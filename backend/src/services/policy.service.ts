import { getDb } from '../db/connection';
import { ConflictError, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { buildUpdateQuery, ensureEntityExists } from '../utils/dbHelpers';
import type {
  CreatePolicy,
  UpdatePolicy,
  CreatePolicyFactionLink,
  UpdatePolicyFactionLink,
} from '@campaigner/shared';

type PolicyRow = {
  id: number;
  project_id: number;
  title: string;
  type: 'ambition' | 'policy';
  status: 'planned' | 'active' | 'archived';
  description: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

type PolicyFactionLinkRow = {
  id: number;
  policy_id: number;
  faction_id: number;
  faction_name: string;
  faction_type: string;
  role: 'owner' | 'supporter' | 'opponent';
  created_at: string;
  updated_at: string;
};

const POLICY_UPDATE_MAP: Record<string, string> = {
  title: 'title',
  type: 'type',
  status: 'status',
  description: 'description',
  sortOrder: 'sort_order',
};

function toPolicy(row: PolicyRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    type: row.type,
    status: row.status,
    description: row.description || '',
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPolicyFactionLink(row: PolicyFactionLinkRow) {
  return {
    id: row.id,
    policyId: row.policy_id,
    factionId: row.faction_id,
    factionName: row.faction_name,
    factionType: row.faction_type,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PolicyService {
  private static getPolicyRow(id: number): PolicyRow {
    const db = getDb();
    const row = db.prepare('SELECT * FROM project_policies WHERE id = ?').get(id) as PolicyRow | undefined;
    if (!row) throw new NotFoundError('Policy');
    return row;
  }

  private static getFactionProjectId(factionId: number): number {
    const db = getDb();
    const row = db.prepare('SELECT project_id FROM factions WHERE id = ?').get(factionId) as { project_id: number } | undefined;
    if (!row) throw new NotFoundError('Faction');
    return row.project_id;
  }

  static getAll(projectId: number) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM project_policies
      WHERE project_id = ?
      ORDER BY sort_order ASC, id ASC
    `).all(projectId) as PolicyRow[];
    return rows.map(toPolicy);
  }

  static getById(id: number) {
    const row = this.getPolicyRow(id);
    return toPolicy(row);
  }

  static create(data: CreatePolicy) {
    ensureEntityExists('projects', data.projectId, 'Project');
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO project_policies (project_id, title, type, status, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.title.trim(),
      data.type,
      data.status ?? 'active',
      data.description ?? '',
      data.sortOrder ?? 0
    );
    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdatePolicy) {
    this.getById(id);
    const normalizedData: UpdatePolicy = {
      ...data,
      ...(typeof data.title === 'string' ? { title: data.title.trim() } : {}),
    };
    buildUpdateQuery('project_policies', POLICY_UPDATE_MAP, normalizedData as Record<string, unknown>, id);
    return this.getById(id);
  }

  static delete(id: number) {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM project_policies WHERE id = ?').run(id);
  }

  static getLinks(policyId: number) {
    this.getPolicyRow(policyId);
    const db = getDb();
    const rows = db.prepare(`
      SELECT l.id, l.policy_id, l.faction_id, f.name as faction_name, f.type as faction_type, l.role, l.created_at, l.updated_at
      FROM policy_faction_links l
      JOIN factions f ON f.id = l.faction_id
      WHERE l.policy_id = ?
      ORDER BY l.id ASC
    `).all(policyId) as PolicyFactionLinkRow[];
    return rows.map(toPolicyFactionLink);
  }

  static addLink(policyId: number, data: CreatePolicyFactionLink) {
    const policyRow = this.getPolicyRow(policyId);
    const factionProjectId = this.getFactionProjectId(data.factionId);
    if (policyRow.project_id !== factionProjectId) {
      throw new BadRequestError('Policy and faction must belong to the same project');
    }

    const db = getDb();
    try {
      const result = db.prepare(`
        INSERT INTO policy_faction_links (policy_id, faction_id, role)
        VALUES (?, ?, ?)
      `).run(policyId, data.factionId, data.role);

      const row = db.prepare(`
        SELECT l.id, l.policy_id, l.faction_id, f.name as faction_name, f.type as faction_type, l.role, l.created_at, l.updated_at
        FROM policy_faction_links l
        JOIN factions f ON f.id = l.faction_id
        WHERE l.id = ?
      `).get(result.lastInsertRowid as number) as PolicyFactionLinkRow;
      return toPolicyFactionLink(row);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictError('Faction is already linked to this policy');
      }
      throw error;
    }
  }

  static updateLink(policyId: number, linkId: number, data: UpdatePolicyFactionLink) {
    this.getPolicyRow(policyId);
    const db = getDb();
    const linkRow = db.prepare('SELECT policy_id, faction_id FROM policy_faction_links WHERE id = ?').get(linkId) as
      | { policy_id: number; faction_id: number }
      | undefined;
    if (!linkRow) throw new NotFoundError('Policy link');
    if (linkRow.policy_id !== policyId) {
      throw new BadRequestError('Link does not belong to this policy');
    }

    const policyRow = this.getPolicyRow(policyId);
    const factionProjectId = this.getFactionProjectId(linkRow.faction_id);
    if (policyRow.project_id !== factionProjectId) {
      throw new BadRequestError('Policy and faction must belong to the same project');
    }

    buildUpdateQuery('policy_faction_links', { role: 'role' }, data as Record<string, unknown>, linkId);
    const row = db.prepare(`
      SELECT l.id, l.policy_id, l.faction_id, f.name as faction_name, f.type as faction_type, l.role, l.created_at, l.updated_at
      FROM policy_faction_links l
      JOIN factions f ON f.id = l.faction_id
      WHERE l.id = ?
    `).get(linkId) as PolicyFactionLinkRow;
    return toPolicyFactionLink(row);
  }

  static removeLink(policyId: number, linkId: number) {
    this.getPolicyRow(policyId);
    const db = getDb();
    const linkRow = db.prepare('SELECT policy_id, faction_id FROM policy_faction_links WHERE id = ?').get(linkId) as
      | { policy_id: number; faction_id: number }
      | undefined;
    if (!linkRow) throw new NotFoundError('Policy link');
    if (linkRow.policy_id !== policyId) {
      throw new BadRequestError('Link does not belong to this policy');
    }

    const policyRow = this.getPolicyRow(policyId);
    const factionProjectId = this.getFactionProjectId(linkRow.faction_id);
    if (policyRow.project_id !== factionProjectId) {
      throw new BadRequestError('Policy and faction must belong to the same project');
    }

    db.prepare('DELETE FROM policy_faction_links WHERE id = ?').run(linkId);
  }
}
