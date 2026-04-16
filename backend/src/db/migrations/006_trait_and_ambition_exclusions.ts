import type Database from 'better-sqlite3';

const TRAIT_EXCLUSION_PAIRS = [
  ['Доброта', 'Злость'],
  ['Доброта', 'Жестокость'],
  ['Чревоугодие', 'Самоконтроль'],
  ['Похоть', 'Самоконтроль'],
  ['Амбициозность', 'Апатия'],
  ['Креативность', 'Расчётливость'],
  ['Нервозность', 'Хладнокровие'],
  ['Эгоизм', 'Милосердие'],
  ['Харизма', 'Апатия'],
  ['Фанатизм', 'Любопытство'],
  ['Доверчивость', 'Паранойя'],
  ['Мудрость', 'Умственная отсталость'],
  ['Лицемерие', 'Честность'],
  ['Малодушие', 'Храбрость'],
  ['Упрямство', 'Хитрость'],
  ['Решительность', 'Меланхолия'],
  ['Верность', 'Лицемерие'],
  ['Высокомерие', 'Щедрость'],
  ['Оптимизм', 'Паранойя'],
  ['Жадность', 'Щедрость'],
  ['Утончённость', 'Чревоугодие'],
  ['Расчётливость', 'Милосердие'],
] as const;

const AMBITION_EXCLUSION_PAIRS = [
  ['Изоляционизм', 'Торговая доминация'],
  ['Изоляционизм', 'Территориальная экспансия'],
  ['Изоляционизм', 'Контроль торговых маршрутов'],
  ['Поддержание мира', 'Военное превосходство'],
  ['Поддержание мира', 'Свержение соседа'],
  ['Поддержание мира', 'Порабощение соседей'],
  ['Поддержание мира', 'Религиозное обращение соседей'],
  ['Технологический прогресс', 'Защита традиций'],
  ['Технологический прогресс', 'Реставрация старого порядка'],
  ['Культурная ассимиляция', 'Защита традиций'],
  ['Религиозная экспансия', 'Демократизация'],
  ['Магическое превосходство', 'Научный прогресс'],
  ['Объединение народа', 'Порабощение соседей'],
  ['Накопление богатства', 'Экологическая гармония'],
  ['Научный прогресс', 'Реставрация старого порядка'],
  ['Демократизация', 'Установление тирании'],
  ['Создание колоний', 'Экологическая гармония'],
  ['Контроль морских путей', 'Поддержание мира'],
  ['Выживание', 'Территориальная экспансия'],
  ['Месть', 'Дипломатическая гегемония'],
  ['Освобождение порабощённых', 'Порабощение соседей'],
  ['Развитие искусств', 'Индустриализация'],
  ['Индустриализация', 'Экологическая гармония'],
] as const;

export function migrateTraitAndAmbitionExclusions(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS character_trait_exclusions (
      trait_id INTEGER NOT NULL,
      excluded_trait_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (trait_id, excluded_trait_id),
      FOREIGN KEY (trait_id) REFERENCES character_traits(id) ON DELETE CASCADE,
      FOREIGN KEY (excluded_trait_id) REFERENCES character_traits(id) ON DELETE CASCADE,
      CHECK (trait_id != excluded_trait_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ambition_exclusions (
      ambition_id INTEGER NOT NULL,
      excluded_ambition_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (ambition_id, excluded_ambition_id),
      FOREIGN KEY (ambition_id) REFERENCES ambitions_catalog(id) ON DELETE CASCADE,
      FOREIGN KEY (excluded_ambition_id) REFERENCES ambitions_catalog(id) ON DELETE CASCADE,
      CHECK (ambition_id != excluded_ambition_id)
    );
  `);

  const insertTraitExclusion = db.prepare(`
    INSERT OR IGNORE INTO character_trait_exclusions (trait_id, excluded_trait_id)
    VALUES (?, ?)
  `);
  const insertAmbitionExclusion = db.prepare(`
    INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
    VALUES (?, ?)
  `);

  const traitProjects = db
    .prepare(`SELECT DISTINCT project_id FROM character_traits WHERE is_predefined = 1`)
    .all() as Array<{ project_id: number }>;

  for (const { project_id: projectId } of traitProjects) {
    const traits = db
      .prepare(
        `
        SELECT id, name
        FROM character_traits
        WHERE project_id = ? AND is_predefined = 1
      `
      )
      .all(projectId) as Array<{ id: number; name: string }>;
    const byName = new Map(traits.map((row) => [row.name, row.id]));

    for (const [leftName, rightName] of TRAIT_EXCLUSION_PAIRS) {
      const leftId = byName.get(leftName);
      const rightId = byName.get(rightName);
      if (!leftId || !rightId) continue;
      insertTraitExclusion.run(leftId, rightId);
      insertTraitExclusion.run(rightId, leftId);
    }
  }

  const ambitions = db
    .prepare(
      `
      SELECT id, name
      FROM ambitions_catalog
      WHERE is_custom = 0
    `
    )
    .all() as Array<{ id: number; name: string }>;
  const ambitionsByName = new Map(ambitions.map((row) => [row.name, row.id]));

  for (const [leftName, rightName] of AMBITION_EXCLUSION_PAIRS) {
    const leftId = ambitionsByName.get(leftName);
    const rightId = ambitionsByName.get(rightName);
    if (!leftId || !rightId) continue;
    insertAmbitionExclusion.run(leftId, rightId);
    insertAmbitionExclusion.run(rightId, leftId);
  }
}

export const TRAIT_EXCLUSION_SEED_PAIRS = TRAIT_EXCLUSION_PAIRS;
export const AMBITION_EXCLUSION_SEED_PAIRS = AMBITION_EXCLUSION_PAIRS;
