import { getDb } from '../db/connection.js';
import { Tag, CreateTag } from '@campaigner/shared';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';

export class TagService {
  static getAll(projectId: number): Tag[] {
    const db = getDb();
    return db.prepare(`
      SELECT id, name, color FROM tags WHERE project_id = ? ORDER BY name ASC
    `).all(projectId) as Tag[];
  }

  static create(projectId: number, data: CreateTag): Tag {
    const db = getDb();

    // Проверяем уникальность
    const existing = db.prepare(
      'SELECT id FROM tags WHERE project_id = ? AND name = ?'
    ).get(projectId, data.name);

    if (existing) {
      throw new ConflictError(`Tag "${data.name}" already exists in this project`);
    }

    const result = db.prepare(`
      INSERT INTO tags (project_id, name, color) VALUES (?, ?, ?)
    `).run(projectId, data.name, data.color || '#808080');

    return { id: result.lastInsertRowid as number, name: data.name, color: data.color || '#808080' };
  }

  static delete(id: number): void {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM tags WHERE id = ?').get(id);
    if (!existing) throw new NotFoundError('Tag');
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  }

  // Получить теги для сущности
  static getTagsForEntity(projectId: number, entityType: string, entityId: number): Tag[] {
    const db = getDb();
    return db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN tag_associations ta ON t.id = ta.tag_id
      WHERE ta.entity_type = ? AND ta.entity_id = ? AND t.project_id = ?
      ORDER BY t.name ASC
    `).all(entityType, entityId, projectId) as Tag[];
  }

  // Привязать тег к сущности
  static addTagToEntity(tagId: number, entityType: string, entityId: number): void {
    const db = getDb();
    try {
      db.prepare(`
        INSERT OR IGNORE INTO tag_associations (tag_id, entity_type, entity_id)
        VALUES (?, ?, ?)
      `).run(tagId, entityType, entityId);
    } catch (error) {
      // Игнорируем дубликаты
    }
  }

  // Отвязать тег от сущности
  static removeTagFromEntity(tagId: number, entityType: string, entityId: number): void {
    const db = getDb();
    db.prepare(`
      DELETE FROM tag_associations WHERE tag_id = ? AND entity_type = ? AND entity_id = ?
    `).run(tagId, entityType, entityId);
  }

  // Обновить теги для сущности (полная замена)
  static setTagsForEntity(projectId: number, entityType: string, entityId: number, tagIds: number[]): Tag[] {
    const db = getDb();
    const transaction = db.transaction(() => {
      // Удаляем все текущие привязки
      db.prepare(`
        DELETE FROM tag_associations WHERE entity_type = ? AND entity_id = ?
      `).run(entityType, entityId);

      // Добавляем новые
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO tag_associations (tag_id, entity_type, entity_id)
        VALUES (?, ?, ?)
      `);

      tagIds.forEach(tagId => {
        insertStmt.run(tagId, entityType, entityId);
      });
    });

    transaction();
    return this.getTagsForEntity(projectId, entityType, entityId);
  }

  // Найти или создать тег
  static findOrCreate(projectId: number, name: string, color?: string): Tag {
    const db = getDb();
    const existing = db.prepare(
      'SELECT id, name, color FROM tags WHERE project_id = ? AND name = ?'
    ).get(projectId, name) as Tag | undefined;

    if (existing) return existing;
    return this.create(projectId, { name, color });
  }
}