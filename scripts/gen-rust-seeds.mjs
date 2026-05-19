import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function runSharedBuild() {
  const result = spawnSync('npm', ['run', 'build:shared'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function rustEscape(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function fileHeader(domainFile, hash) {
  return `// GENERATED — DO NOT EDIT
// Source: shared/seeds/${domainFile} via scripts/gen-rust-seeds.mjs
// manifest-hash: ${hash}

`;
}

function writeFile(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const normalized = content.endsWith('\n') ? content : `${content}\n`;
  fs.writeFileSync(targetPath, normalized, 'utf8');
  console.log(`Wrote ${path.relative(root, targetPath)}`);
}

function generateCharacterTraitsSeed(traits, pairs, hash) {
  const traitRows = traits
    .map(
      (trait) => `    (
        "${rustEscape(trait.slug)}",
        "${rustEscape(trait.name)}",
        "${rustEscape(trait.description)}",
    ),`,
    )
    .join('\n');

  const pairRows = pairs
    .map(([left, right]) => `    ("${rustEscape(left)}", "${rustEscape(right)}"),`)
    .join('\n');

  const content = `${fileHeader('characterTraits.ts', hash)}use rusqlite::{params, Connection};

use crate::error::Result;

const PREDEFINED_TRAITS: &[(&str, &str, &str)] = &[
${traitRows}
];

const DEFAULT_TRAIT_EXCLUSION_PAIRS: &[(&str, &str)] = &[
${pairRows}
];

pub fn seed_predefined(connection: &Connection, project_id: i32) -> Result<()> {
    let mut insert = connection.prepare(
        r#"
        INSERT OR IGNORE INTO character_traits (project_id, name, description, image_path, is_predefined, sort_order)
        VALUES (?1, ?2, ?3, ?4, 1, ?5)
        "#,
    )?;

    for (index, (slug, name, description)) in PREDEFINED_TRAITS.iter().enumerate() {
        let image_path = format!("/traits/{slug}.jpg");
        let sort_order = i32::try_from(index).unwrap_or(i32::MAX);
        insert.execute(params![
            project_id,
            name,
            description,
            image_path,
            sort_order
        ])?;
    }

    seed_default_exclusions(connection, project_id)?;
    Ok(())
}

fn seed_default_exclusions(connection: &Connection, project_id: i32) -> Result<()> {
    let mut statement = connection.prepare(
        r#"
        SELECT id, name
        FROM character_traits
        WHERE project_id = ?1 AND is_predefined = 1
        "#,
    )?;

    let rows = statement
        .query_map(params![project_id], |row| {
            Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?))
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let by_name: std::collections::HashMap<&str, i32> =
        rows.iter().map(|(id, name)| (name.as_str(), *id)).collect();

    let mut insert = connection.prepare(
        "INSERT OR IGNORE INTO character_trait_exclusions (trait_id, excluded_trait_id) VALUES (?1, ?2)",
    )?;

    for (left_name, right_name) in DEFAULT_TRAIT_EXCLUSION_PAIRS {
        let Some(left_id) = by_name.get(left_name) else {
            continue;
        };
        let Some(right_id) = by_name.get(right_name) else {
            continue;
        };
        insert.execute(params![left_id, right_id])?;
        insert.execute(params![right_id, left_id])?;
    }

    Ok(())
}
`;

  writeFile(path.join(root, 'src-tauri/src/repositories/character_traits_seed.rs'), content);
}

function generatePoliticalScalesSeed(scales, hash) {
  const rows = scales
    .map((row) => {
      const zones =
        row.zones === null
          ? 'None'
          : `Some(r#"${rustEscape(JSON.stringify(row.zones))}"#)`;
      return `    SeedScale {
        code: "${rustEscape(row.code)}",
        entity_type: "${row.entityType}",
        category: "${rustEscape(row.category)}",
        name: "${rustEscape(row.name)}",
        left_pole_label: "${rustEscape(row.leftPoleLabel)}",
        right_pole_label: "${rustEscape(row.rightPoleLabel)}",
        left_pole_description: "${rustEscape(row.leftPoleDescription)}",
        right_pole_description: "${rustEscape(row.rightPoleDescription)}",
        zones_json: ${zones},
        sort_order: ${row.sortOrder},
    }`;
    })
    .join(',\n');

  const content = `${fileHeader('politicalScales.ts', hash)}use rusqlite::{params, Connection};

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
${rows}
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

  writeFile(path.join(root, 'src-tauri/src/repositories/political_scales_seed.rs'), content);
}

function generateAmbitionsSeed(ambitions, pairs, builtinAmbitionIconPath, hash) {
  const ambitionRows = ambitions
    .map((ambition) => {
      const iconPath = builtinAmbitionIconPath(ambition);
      return `    (
        "${rustEscape(ambition.name)}",
        "${rustEscape(ambition.description)}",
        "${rustEscape(iconPath)}",
    ),`;
    })
    .join('\n');

  const pairRows = pairs
    .map(([left, right]) => `    ("${rustEscape(left)}", "${rustEscape(right)}"),`)
    .join('\n');

  const content = `${fileHeader('ambitions.ts', hash)}use rusqlite::{params, Connection};

use crate::error::Result;

const BUILTIN_AMBITIONS: &[(&str, &str, &str)] = &[
${ambitionRows}
];

const AMBITION_EXCLUSION_PAIRS: &[(&str, &str)] = &[
${pairRows}
];

pub fn seed_builtin_catalog(connection: &Connection) -> Result<()> {
    let count: i64 = connection.query_row(
        "SELECT COUNT(*) FROM ambitions_catalog WHERE is_custom = 0",
        [],
        |row| row.get(0),
    )?;
    if count > 0 {
        return Ok(());
    }

    let mut insert = connection.prepare(
        r#"
        INSERT OR IGNORE INTO ambitions_catalog (name, description, icon_path, is_custom, project_id)
        VALUES (?1, ?2, ?3, 0, NULL)
        "#,
    )?;

    for (name, description, icon_path) in BUILTIN_AMBITIONS {
        insert.execute(params![name, description, icon_path])?;
    }

    seed_builtin_exclusions(connection)?;
    Ok(())
}

fn seed_builtin_exclusions(connection: &Connection) -> Result<()> {
    let mut statement = connection.prepare(
        r#"
        SELECT id, name
        FROM ambitions_catalog
        WHERE is_custom = 0
        "#,
    )?;

    let rows = statement
        .query_map([], |row| {
            Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?))
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let by_name: std::collections::HashMap<&str, i32> =
        rows.iter().map(|(id, name)| (name.as_str(), *id)).collect();

    let mut insert = connection.prepare(
        "INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id) VALUES (?1, ?2)",
    )?;

    for (left_name, right_name) in AMBITION_EXCLUSION_PAIRS {
        let Some(left_id) = by_name.get(left_name) else {
            continue;
        };
        let Some(right_id) = by_name.get(right_name) else {
            continue;
        };
        insert.execute(params![left_id, right_id])?;
        insert.execute(params![right_id, left_id])?;
    }

    Ok(())
}
`;

  writeFile(path.join(root, 'src-tauri/src/repositories/ambitions_seed.rs'), content);
}

runSharedBuild();

const seeds = await import('@campaigner/shared/seeds');

generateCharacterTraitsSeed(
  seeds.BUILTIN_CHARACTER_TRAITS,
  seeds.CHARACTER_TRAIT_EXCLUSION_PAIRS,
  seeds.characterTraitsManifestHash(),
);
generatePoliticalScalesSeed(seeds.BUILTIN_POLITICAL_SCALES, seeds.politicalScalesManifestHash());
generateAmbitionsSeed(
  seeds.BUILTIN_AMBITIONS,
  seeds.AMBITION_EXCLUSION_PAIRS,
  seeds.builtinAmbitionIconPath,
  seeds.ambitionsManifestHash(),
);
