import { getDb } from '../db/connection';
import { CreateDogma, UpdateDogma, Dogma } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';
import { TagService } from './tag.service';

type DogmaCategory = Dogma['category'];
type DogmaImportance = Dogma['importance'];
type DogmaStatus = Dogma['status'];

interface DogmaRow {
  id: number;
  projectId: number;
  title: string;
  category: DogmaCategory;
  description: string;
  impact: string;
  exceptions: string;
  isPublic: number | boolean;
  importance: DogmaImportance;
  status: DogmaStatus;
  sortOrder: number;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface CountRow {
  count: number;
}

interface MaxOrderRow {
  maxOrder: number | null;
}

function mapRow(row: DogmaRow): Dogma {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    category: row.category,
    description: row.description || '',
    impact: row.impact || '',
    exceptions: row.exceptions || '',
    isPublic: !!row.isPublic,
    importance: row.importance,
    status: row.status,
    sortOrder: row.sortOrder,
    icon: row.icon || '',
    color: row.color || '',
    tags: [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const SELECT_FIELDS = `
  id, project_id as projectId, title, category,
  description, impact, exceptions,
  is_public as isPublic, importance, status,
  sort_order as sortOrder, icon, color,
  created_at as createdAt, updated_at as updatedAt
`;

export class DogmaService {
  static getAll(
    projectId: number,
    params?: {
      category?: string;
      importance?: string;
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): { items: Dogma[]; total: number } {
    const db = getDb();
    let whereClause = 'WHERE project_id = ?';
    const queryParams: Array<number | string> = [projectId];

    if (params?.category) {
      whereClause += ' AND category = ?';
      queryParams.push(params.category);
    }

    if (params?.importance) {
      whereClause += ' AND importance = ?';
      queryParams.push(params.importance);
    }

    if (params?.status) {
      whereClause += ' AND status = ?';
      queryParams.push(params.status);
    }

    if (params?.search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM dogmas
      ${whereClause}
    `).get(...queryParams) as CountRow;

    const total = countRow.count;

    let query = `
      SELECT ${SELECT_FIELDS}
      FROM dogmas
      ${whereClause}
      ORDER BY sort_order ASC, created_at DESC
    `;

    const paginationParams: Array<number | string> = [...queryParams];

    if (params?.limit !== undefined) {
      query += ' LIMIT ?';
      paginationParams.push(params.limit);

      if (params?.offset !== undefined) {
        query += ' OFFSET ?';
        paginationParams.push(params.offset);
      }
    }

    const rows = db.prepare(query).all(...paginationParams) as DogmaRow[];

    const items = rows.map((row) => {
      const dogma = mapRow(row);
      dogma.tags = TagService.getTagsForEntity(projectId, 'dogma', row.id);
      return dogma;
    });

    return { items, total };
  }

  static getById(id: number): Dogma {
    const db = getDb();

    const row = db.prepare(`
      SELECT ${SELECT_FIELDS}
      FROM dogmas
      WHERE id = ?
    `).get(id) as DogmaRow | undefined;

    if (!row) {
      throw new NotFoundError('Dogma');
    }

    const dogma = mapRow(row);
    dogma.tags = TagService.getTagsForEntity(row.projectId, 'dogma', id);
    return dogma;
  }

  static create(data: CreateDogma): Dogma {
    const db = getDb();

    let sortOrder = data.sortOrder;

    if (sortOrder === undefined || sortOrder === 0) {
      const maxOrderRow = db.prepare(`
        SELECT MAX(sort_order) as maxOrder
        FROM dogmas
        WHERE project_id = ?
      `).get(data.projectId) as MaxOrderRow | undefined;

      sortOrder = (maxOrderRow?.maxOrder || 0) + 1;
    }

    const result = db.prepare(`
      INSERT INTO dogmas (
        project_id, title, category, description, impact, exceptions,
        is_public, importance, status, sort_order, icon, color
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.title,
      data.category,
      data.description || '',
      data.impact || '',
      data.exceptions || '',
      data.isPublic !== false ? 1 : 0,
      data.importance || 'major',
      data.status || 'active',
      sortOrder,
      data.icon || '',
      data.color || ''
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateDogma): Dogma {
    this.getById(id);
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.impact !== undefined) {
      fields.push('impact = ?');
      values.push(data.impact);
    }
    if (data.exceptions !== undefined) {
      fields.push('exceptions = ?');
      values.push(data.exceptions);
    }
    if (data.isPublic !== undefined) {
      fields.push('is_public = ?');
      values.push(data.isPublic ? 1 : 0);
    }
    if (data.importance !== undefined) {
      fields.push('importance = ?');
      values.push(data.importance);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.sortOrder !== undefined) {
      fields.push('sort_order = ?');
      values.push(data.sortOrder);
    }
    if (data.icon !== undefined) {
      fields.push('icon = ?');
      values.push(data.icon);
    }
    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color);
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE dogmas SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM dogmas WHERE id = ?').run(id);
  }

  static reorder(projectId: number, orderedIds: number[]): void {
    const db = getDb();
    const updateStmt = db.prepare(
      'UPDATE dogmas SET sort_order = ? WHERE id = ? AND project_id = ?'
    );

    const transaction = db.transaction(() => {
      orderedIds.forEach((id, index) => {
        updateStmt.run(index + 1, id, projectId);
      });
    });

    transaction();
  }
}