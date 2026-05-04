import {
  emptyGraphLayoutData,
  graphLayoutDataSchema,
  type GraphLayoutDataV1,
} from '@campaigner/shared';
import { getDb } from '../db/connection.js';
import { BadRequestError } from '../middleware/errorHandler.js';
import { ProjectService } from './project/project.service.js';
import {
  assertBranchBelongsToProject,
  effectiveBranchIdForRead,
} from './branchScope.js';

function parseLayoutData(raw: string | null | undefined): GraphLayoutDataV1 {
  if (!raw) return emptyGraphLayoutData();
  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = graphLayoutDataSchema.safeParse(json);
    return parsed.success ? parsed.data : emptyGraphLayoutData();
  } catch {
    return emptyGraphLayoutData();
  }
}

export class GraphLayoutService {
  static getParsed(
    projectId: number,
    graphType: string,
    branchId?: number,
  ): GraphLayoutDataV1 {
    ProjectService.getById(projectId);
    const viewBranch = effectiveBranchIdForRead(projectId, branchId);
    if (viewBranch == null) {
      return emptyGraphLayoutData();
    }
    assertBranchBelongsToProject(viewBranch, projectId);

    const db = getDb();
    const row = db
      .prepare(
        `
      SELECT layout_data as layoutData
      FROM graph_layouts
      WHERE project_id = ? AND branch_id = ? AND graph_type = ?
    `,
      )
      .get(projectId, viewBranch, graphType) as { layoutData: string } | undefined;

    return parseLayoutData(row?.layoutData);
  }

  static upsert(
    projectId: number,
    graphType: string,
    layoutData: GraphLayoutDataV1,
    branchId?: number,
  ): GraphLayoutDataV1 {
    ProjectService.getById(projectId);
    const viewBranch = effectiveBranchIdForRead(projectId, branchId);
    if (viewBranch == null) {
      throw new BadRequestError('branchId required (no main branch for project)');
    }
    assertBranchBelongsToProject(viewBranch, projectId);

    const parsed = graphLayoutDataSchema.safeParse(layoutData);
    const normalized = parsed.success ? parsed.data : emptyGraphLayoutData();
    const stored = JSON.parse(JSON.stringify(normalized)) as GraphLayoutDataV1;

    const db = getDb();
    db.prepare(
      `
      INSERT INTO graph_layouts (project_id, branch_id, graph_type, layout_data, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(project_id, branch_id, graph_type) DO UPDATE SET
        layout_data = excluded.layout_data,
        updated_at = datetime('now')
    `,
    ).run(projectId, viewBranch, graphType, JSON.stringify(stored));

    return stored;
  }

  static delete(projectId: number, graphType: string, branchId?: number): void {
    ProjectService.getById(projectId);
    const viewBranch = effectiveBranchIdForRead(projectId, branchId);
    if (viewBranch == null) {
      throw new BadRequestError('branchId required (no main branch for project)');
    }
    assertBranchBelongsToProject(viewBranch, projectId);

    const db = getDb();
    db.prepare(
      `
      DELETE FROM graph_layouts
      WHERE project_id = ? AND branch_id = ? AND graph_type = ?
    `,
    ).run(projectId, viewBranch, graphType);
  }

  /** Snapshot parent branch layouts onto a new branch (fork). Deep copies JSON. */
  static copyLayoutsFromParent(
    projectId: number,
    parentBranchId: number,
    newBranchId: number,
  ): void {
    assertBranchBelongsToProject(parentBranchId, projectId);
    assertBranchBelongsToProject(newBranchId, projectId);

    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT graph_type as graphType, layout_data as layoutData
      FROM graph_layouts
      WHERE project_id = ? AND branch_id = ?
    `,
      )
      .all(projectId, parentBranchId) as Array<{ graphType: string; layoutData: string }>;

    if (rows.length === 0) return;

    for (const row of rows) {
      const parsed = parseLayoutData(row.layoutData);
      const copy = JSON.parse(JSON.stringify(parsed)) as GraphLayoutDataV1;
      this.upsert(projectId, row.graphType, copy, newBranchId);
    }
  }

  static listForExport(projectId: number): Array<{
    branchId: number;
    graphType: string;
    layoutData: GraphLayoutDataV1;
  }> {
    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT branch_id as branchId, graph_type as graphType, layout_data as layoutData
      FROM graph_layouts
      WHERE project_id = ?
    `,
      )
      .all(projectId) as Array<{ branchId: number; graphType: string; layoutData: string }>;

    return rows.map((row) => ({
      branchId: row.branchId,
      graphType: row.graphType,
      layoutData: parseLayoutData(row.layoutData),
    }));
  }
}
