import { getDb } from '../db/connection.js';
import { CreateDogma, UpdateDogma, Dogma } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler.js';
import { TagService } from './tag.service.js';
import { loadTagsBatch, buildUpdateQuery } from '../utils/dbHelpers.js';
import { BranchOverlayService } from './branchOverlay.service.js';
import {
  branchCreatedScopeSql,
  isRowVisibleForActiveBranch,
  resolveCreatedBranchId,
  assertBranchBelongsToProject,
} from './branchScope.js';

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
  createdBranchId?: number | null;
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
  created_at as createdAt, updated_at as updatedAt,
  created_branch_id as createdBranchId
`;

const UPDATE_FIELD_MAP: Record<string, string> = {
  title: 'title',
  category: 'category',
  description: 'description',
  impact: 'impact',
  exceptions: 'exceptions',
  isPublic: 'is_public',
  importance: 'importance',
  status: 'status',
  sortOrder: 'sort_order',
  icon: 'icon',
  color: 'color',
};

function pickDogmaPatch(data: UpdateDogma): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  (Object.keys(UPDATE_FIELD_MAP) as Array<keyof UpdateDogma>).forEach((key) => {
    if (data[key] !== undefined) patch[key] = data[key];
  });
  return patch;
}

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
    },
    branchId?: number
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

    const scope = branchCreatedScopeSql(branchId);
    whereClause += scope.sql;
    queryParams.push(...scope.params);

    const query = `
      SELECT ${SELECT_FIELDS} FROM dogmas ${whereClause}
      ORDER BY sort_order ASC, created_at DESC
    `;

    const limit = params?.limit;
    const offset = params?.offset ?? 0;

    let rows: DogmaRow[];
    let total: number;

    if (branchId) {
      const baseRows = db.prepare(query).all(...queryParams) as DogmaRow[];
      const overlaid = BranchOverlayService.applyListOverlay(
        baseRows,
        BranchOverlayService.getOverrides(branchId, 'dogma'),
      );
      total = overlaid.length;
      rows = limit === undefined ? overlaid : overlaid.slice(offset, offset + limit);
    } else {
      const countRow = db.prepare(
        `SELECT COUNT(*) as count FROM dogmas ${whereClause}`
      ).get(...queryParams) as { count: number };
      total = countRow.count;

      let pagedQuery = query;
      if (limit !== undefined) {
        pagedQuery += ` LIMIT ${limit} OFFSET ${offset}`;
      }
      rows = db.prepare(pagedQuery).all(...queryParams) as DogmaRow[];
    }

    const tagsMap = loadTagsBatch(
      projectId,
      'dogma',
      rows.map((r) => r.id)
    );

    const items = rows.map((row) => {
      const dogma = mapRow(row);
      dogma.tags = tagsMap.get(row.id) || [];
      return dogma;
    });

    return { items, total };
  }

  static getById(id: number, branchId?: number): Dogma {
    const db = getDb();

    const row = db.prepare(`
      SELECT ${SELECT_FIELDS} FROM dogmas WHERE id = ?
    `).get(id) as DogmaRow | undefined;

    if (row && !isRowVisibleForActiveBranch(row.createdBranchId, branchId)) {
      throw new NotFoundError('Dogma');
    }

    const projectedRow = branchId
      ? BranchOverlayService.applyItemOverlay(row ?? null, BranchOverlayService.getOverrides(branchId, 'dogma'))
      : row ?? null;

    if (!projectedRow) {
      throw new NotFoundError('Dogma');
    }

    const dogma = mapRow(projectedRow);
    dogma.tags = TagService.getTagsForEntity(projectedRow.projectId, 'dogma', id);
    return dogma;
  }

  static create(data: CreateDogma, requestBranchId?: number): Dogma {
    const db = getDb();

    if (requestBranchId !== undefined) {
      assertBranchBelongsToProject(requestBranchId, data.projectId);
    }
    const createdBranchId = resolveCreatedBranchId(data.projectId, requestBranchId);

    let sortOrder = data.sortOrder;

    if (sortOrder === undefined || sortOrder === 0) {
      const maxOrderRow = db.prepare(`
        SELECT MAX(sort_order) as maxOrder FROM dogmas WHERE project_id = ?
      `).get(data.projectId) as MaxOrderRow | undefined;

      sortOrder = (maxOrderRow?.maxOrder || 0) + 1;
    }

    const result = db.prepare(`
      INSERT INTO dogmas (
        project_id, title, category, description, impact, exceptions,
        is_public, importance, status, sort_order, icon, color, created_branch_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      data.color || '',
      createdBranchId,
    );

    return this.getById(result.lastInsertRowid as number, requestBranchId);
  }

  static update(id: number, data: UpdateDogma, branchId?: number): Dogma {
    this.getById(id, branchId);
    if (branchId) {
      BranchOverlayService.saveUpsertOverride(branchId, 'dogma', id, pickDogmaPatch(data));
      return this.getById(id, branchId);
    }

    buildUpdateQuery('dogmas', UPDATE_FIELD_MAP, data as Record<string, unknown>, id, {
      booleanFields: ['isPublic'],
    });
    return this.getById(id);
  }

  static delete(id: number, branchId?: number): void {
    this.getById(id, branchId);
    if (branchId) {
      BranchOverlayService.saveDeleteOverride(branchId, 'dogma', id);
      return;
    }

    const db = getDb();
    db.prepare('DELETE FROM dogmas WHERE id = ?').run(id);
  }

  static reorder(projectId: number, orderedIds: number[], branchId?: number): void {
    if (!branchId) {
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
      return;
    }

    const db = getDb();
    const verifyOwnershipStmt = db.prepare(
      'SELECT id FROM dogmas WHERE id = ? AND project_id = ?'
    );
    const transaction = db.transaction(() => {
      orderedIds.forEach((id, index) => {
        const exists = verifyOwnershipStmt.get(id, projectId) as { id: number } | undefined;
        if (exists) {
          BranchOverlayService.saveUpsertOverride(branchId, 'dogma', id, { sortOrder: index + 1 });
        }
      });
    });

    transaction();
  }
}
