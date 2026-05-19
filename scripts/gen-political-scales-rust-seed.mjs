import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SYSTEM_POLITICAL_SCALES_SEED } from '../backend/dist/db/seeds/politicalScalesSeedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src-tauri/src/repositories/political_scales_seed.rs');

const esc = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const rows = SYSTEM_POLITICAL_SCALES_SEED.map((row) => {
  const zones =
    row.zonesJson === null ? 'None' : `Some(r#"${row.zonesJson.replace(/"/g, '\\"')}"#)`;
  return `    SeedScale {
        code: "${esc(row.code)}",
        entity_type: "${row.entityType}",
        category: "${esc(row.category)}",
        name: "${esc(row.name)}",
        left_pole_label: "${esc(row.leftPoleLabel)}",
        right_pole_label: "${esc(row.rightPoleLabel)}",
        left_pole_description: "${esc(row.leftPoleDescription)}",
        right_pole_description: "${esc(row.rightPoleDescription)}",
        zones_json: ${zones},
        sort_order: ${row.sortOrder},
    }`;
});

const content = `// Mirrors backend/src/db/seeds/politicalScalesSeedData.ts (generated via scripts/gen-political-scales-rust-seed.mjs)

use rusqlite::{params, Connection};

use crate::error::Result;

#[derive(Clone, Copy)]
struct SeedScale {
    code: &'static str,
    entity_type: &'static str,
    category: &'static str,
    name: &'static str,
    left_pole_label: &'static str,
    right_pole_label: &'static str,
    left_pole_description: &'static str,
    right_pole_description: &'static str,
    zones_json: Option<&'static str>,
    sort_order: i32,
}

const SYSTEM_SCALES: &[SeedScale] = &[
${rows.join(',\n')}
];

pub fn seed_system_scales(connection: &Connection) -> Result<()> {
    let count: i64 = connection.query_row(
        "SELECT COUNT(*) FROM political_scales WHERE is_system = 1",
        [],
        |row| row.get(0),
    )?;
    if count > 0 {
        return Ok(());
    }

    let mut insert = connection.prepare(
        r#"
        INSERT OR IGNORE INTO political_scales (
            code, entity_type, category, name,
            left_pole_label, right_pole_label,
            left_pole_description, right_pole_description,
            icon, zones_json, is_system, project_id, sort_order
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULL, ?9, 1, NULL, ?10)
        "#,
    )?;

    for scale in SYSTEM_SCALES {
        insert.execute(params![
            scale.code,
            scale.entity_type,
            scale.category,
            scale.name,
            scale.left_pole_label,
            scale.right_pole_label,
            scale.left_pole_description,
            scale.right_pole_description,
            scale.zones_json,
            scale.sort_order
        ])?;
    }

    Ok(())
}
`;

fs.writeFileSync(outPath, content, 'utf8');
console.log(`Wrote ${outPath} (${SYSTEM_POLITICAL_SCALES_SEED.length} scales)`);
