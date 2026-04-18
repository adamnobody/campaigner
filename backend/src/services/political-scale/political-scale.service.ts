import { getDb } from '../../db/connection.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../middleware/errorHandler.js';
import { ensureEntityExists } from '../../utils/dbHelpers.js';
import type { CreatePoliticalScale, PoliticalScale, UpdatePoliticalScale } from '@campaigner/shared';

type PoliticalScaleRow = {
  id: number;
  code: string;
  entity_type: 'state' | 'faction';
  category: string;
  name: string;
  left_pole_label: string;
  right_pole_label: string;
  left_pole_description: string;
  right_pole_description: string;
  icon: string | null;
  zones_json: string | null;
  is_system: number;
  project_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function parseZones(json: string | null): PoliticalScale['zones'] {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as PoliticalScale['zones'];
  } catch {
    return null;
  }
}

function toDto(row: PoliticalScaleRow): PoliticalScale {
  return {
    id: row.id,
    code: row.code,
    entityType: row.entity_type,
    category: row.category,
    name: row.name,
    leftPoleLabel: row.left_pole_label,
    rightPoleLabel: row.right_pole_label,
    leftPoleDescription: row.left_pole_description || '',
    rightPoleDescription: row.right_pole_description || '',
    icon: row.icon,
    zones: parseZones(row.zones_json),
    isSystem: row.is_system === 1,
    worldId: row.project_id,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeCustomCode(worldId: number, code: string): string {
  const trimmed = code.trim().toLowerCase();
  return `p${worldId}_${trimmed}`;
}

export class PoliticalScaleService {
  static list(entityType: 'state' | 'faction', worldId: number): PoliticalScale[] {
    ensureEntityExists('projects', worldId, 'Project');
    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT * FROM political_scales
      WHERE entity_type = ?
        AND (is_system = 1 OR project_id = ?)
      ORDER BY sort_order ASC, id ASC
    `
      )
      .all(entityType, worldId) as PoliticalScaleRow[];
    return rows.map(toDto);
  }

  static getById(id: number): PoliticalScale {
    const db = getDb();
    const row = db.prepare('SELECT * FROM political_scales WHERE id = ?').get(id) as PoliticalScaleRow | undefined;
    if (!row) throw new NotFoundError('Political scale');
    return toDto(row);
  }

  static create(data: CreatePoliticalScale): PoliticalScale {
    ensureEntityExists('projects', data.worldId, 'Project');
    const db = getDb();
    const code = normalizeCustomCode(data.worldId, data.code);
    const existing = db.prepare('SELECT id FROM political_scales WHERE code = ?').get(code) as { id: number } | undefined;
    if (existing) {
      throw new ConflictError('Шкала с таким кодом уже существует в этом мире');
    }

    const zonesJson =
      data.zones === undefined || data.zones === null ? null : JSON.stringify(data.zones);

    try {
      const result = db
        .prepare(
          `
        INSERT INTO political_scales (
          code, entity_type, category, name,
          left_pole_label, right_pole_label,
          left_pole_description, right_pole_description,
          icon, zones_json, is_system, project_id, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `
        )
        .run(
          code,
          data.entityType,
          data.category.trim(),
          data.name.trim(),
          data.leftPoleLabel.trim(),
          data.rightPoleLabel.trim(),
          (data.leftPoleDescription ?? '').trim(),
          (data.rightPoleDescription ?? '').trim(),
          data.icon ?? null,
          zonesJson,
          data.worldId,
          data.order ?? 0
        );
      return this.getById(result.lastInsertRowid as number);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('UNIQUE')) {
        throw new ConflictError('Шкала с таким кодом уже существует');
      }
      throw err;
    }
  }

  static update(id: number, data: UpdatePoliticalScale): PoliticalScale {
    const db = getDb();
    const row = db.prepare('SELECT * FROM political_scales WHERE id = ?').get(id) as PoliticalScaleRow | undefined;
    if (!row) throw new NotFoundError('Political scale');
    if (row.is_system === 1) {
      throw new BadRequestError('Системные шкалы нельзя изменять');
    }

    const zonesJson =
      data.zones === undefined ? undefined : data.zones === null ? null : JSON.stringify(data.zones);

    const fields: string[] = [];
    const values: unknown[] = [];

    const set = (col: string, val: unknown) => {
      fields.push(`${col} = ?`);
      values.push(val);
    };

    if (data.category !== undefined) set('category', data.category.trim());
    if (data.name !== undefined) set('name', data.name.trim());
    if (data.leftPoleLabel !== undefined) set('left_pole_label', data.leftPoleLabel.trim());
    if (data.rightPoleLabel !== undefined) set('right_pole_label', data.rightPoleLabel.trim());
    if (data.leftPoleDescription !== undefined) set('left_pole_description', data.leftPoleDescription.trim());
    if (data.rightPoleDescription !== undefined) set('right_pole_description', data.rightPoleDescription.trim());
    if (data.icon !== undefined) set('icon', data.icon);
    if (zonesJson !== undefined) set('zones_json', zonesJson);
    if (data.order !== undefined) set('sort_order', data.order);

    if (fields.length === 0) {
      return toDto(row);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE political_scales SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  }

  static delete(id: number): void {
    const db = getDb();
    const row = db.prepare('SELECT is_system FROM political_scales WHERE id = ?').get(id) as
      | { is_system: number }
      | undefined;
    if (!row) throw new NotFoundError('Political scale');
    if (row.is_system === 1) {
      throw new BadRequestError('Системные шкалы нельзя удалять');
    }
    db.prepare('DELETE FROM political_scales WHERE id = ?').run(id);
  }
}
