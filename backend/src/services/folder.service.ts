import { getDb } from '../db/connection';
import { CreateFolder, ProjectFolder } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';

export class FolderService {
  static getAll(projectId: number): ProjectFolder[] {
    const db = getDb();
    return db.prepare(`
      SELECT id, project_id as projectId, name, parent_id as parentId,
             created_at as createdAt
      FROM folders WHERE project_id = ?
      ORDER BY name ASC
    `).all(projectId) as ProjectFolder[];
  }

  static getById(id: number): ProjectFolder {
    const db = getDb();
    const row = db.prepare(`
      SELECT id, project_id as projectId, name, parent_id as parentId,
             created_at as createdAt
      FROM folders WHERE id = ?
    `).get(id) as ProjectFolder | undefined;

    if (!row) throw new NotFoundError('Folder');
    return row;
  }

  static create(data: CreateFolder): ProjectFolder {
    const db = getDb();

    // Проверяем что parent существует если указан
    if (data.parentId) {
      this.getById(data.parentId);
    }

    const result = db.prepare(`
      INSERT INTO folders (project_id, name, parent_id)
      VALUES (?, ?, ?)
    `).run(data.projectId, data.name, data.parentId || null);

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, name: string): ProjectFolder {
    this.getById(id);
    const db = getDb();
    db.prepare('UPDATE folders SET name = ? WHERE id = ?').run(name, id);
    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM folders WHERE id = ?').run(id);
  }

  // Получить дерево папок
  static getTree(projectId: number): any[] {
    const folders = this.getAll(projectId);
    const folderMap = new Map<number, any>();
    const roots: any[] = [];

    folders.forEach(f => {
      folderMap.set(f.id, { ...f, children: [] });
    });

    folders.forEach(f => {
      const node = folderMap.get(f.id)!;
      if (f.parentId && folderMap.has(f.parentId)) {
        folderMap.get(f.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}