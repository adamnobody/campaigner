import type Database from 'better-sqlite3';

/** Файл в `frontend/public/ambitions/`. По умолчанию — `<slug>.svg`. */
type AmbitionSeed = {
  slug: string;
  name: string;
  description: string;
  iconFile?: string;
};

function builtinAmbitionIconPath(ambition: AmbitionSeed): string {
  return `/ambitions/${ambition.iconFile ?? `${ambition.slug}.svg`}`;
}

const PREDEFINED_AMBITIONS: readonly AmbitionSeed[] = [
  {
    slug: 'torgovaya-dominatsiya',
    name: 'Торговая доминация',
    description: 'Установить контроль над ключевыми рынками и финансовыми потоками региона.',
  },
  {
    slug: 'voennoe-prevoskhodstvo',
    name: 'Военное превосходство',
    description: 'Сформировать армию, способную подавить любого соперника на суше и море.',
  },
  {
    slug: 'podderzhanie-mira',
    name: 'Поддержание мира',
    description: 'Сдерживать эскалацию конфликтов и поддерживать баланс сил между соседями.',
  },
  {
    slug: 'territorialnaya-ekspansiya',
    name: 'Территориальная экспансия',
    description: 'Последовательно расширять границы и закреплять контроль над новыми землями.',
  },
  {
    slug: 'religioznaya-ekspansiya',
    name: 'Религиозная экспансия',
    description: 'Распространить веру фракции в соседних землях через миссии и влияние.',
  },
  {
    slug: 'tekhnologicheskiy-progress',
    name: 'Технологический прогресс',
    description: 'Инвестировать в инженерные прорывы для усиления экономики и армии.',
  },
  {
    slug: 'kulturnaya-assimilyatsiya',
    name: 'Культурная ассимиляция',
    description: 'Интегрировать соседние народы через язык, образование и символы власти.',
  },
  {
    slug: 'zashchita-traditsiy',
    name: 'Защита традиций',
    description: 'Сохранить обычаи предков и не допустить разрушения устоявшегося порядка.',
  },
  {
    slug: 'izolyatsionizm',
    name: 'Изоляционизм',
    description: 'Свести внешние контакты к минимуму и сосредоточиться на внутренних делах.',
    iconFile: 'izolyatsionizm.jpg',
  },
  {
    slug: 'magicheskoe-prevoskhodstvo',
    name: 'Магическое превосходство',
    description: 'Собрать сильнейших магов и артефакты для доминирования в мистической сфере.',
  },
  {
    slug: 'obedinenie-naroda',
    name: 'Объединение народа',
    description: 'Преодолеть внутренние расколы и создать единый национальный проект.',
  },
  {
    slug: 'sverzhenie-soseda',
    name: 'Свержение соседа',
    description: 'Лишить соседнюю державу власти через войну, заговоры и подрыв экономики.',
  },
  {
    slug: 'nakoplenie-bogatstva',
    name: 'Накопление богатства',
    description: 'Концентрировать ресурсы и капитал ради долгосрочной независимости.',
  },
  {
    slug: 'nauchnyy-progress',
    name: 'Научный прогресс',
    description: 'Развивать академии и исследовательские центры для постоянных открытий.',
  },
  {
    slug: 'demokratizatsiya',
    name: 'Демократизация',
    description: 'Передать часть власти представительным институтам и расширить участие граждан.',
  },
  {
    slug: 'restavratsiya-starogo-poryadka',
    name: 'Реставрация старого порядка',
    description: 'Вернуть прежние институты и иерархию, отменив реформы последних лет.',
  },
  {
    slug: 'sozdanie-koloniy',
    name: 'Создание колоний',
    description: 'Осваивать удаленные территории и закреплять там экономическое присутствие.',
  },
  {
    slug: 'kontrol-morskikh-putey',
    name: 'Контроль морских путей',
    description: 'Доминировать в проливах и портах, управляя морской торговлей и логистикой.',
  },
  {
    slug: 'kontrol-torgovykh-marshrutov',
    name: 'Контроль торговых маршрутов',
    description: 'Монополизировать караванные и речные пути, диктуя условия обмена.',
  },
  {
    slug: 'religioznoe-obrashchenie-sosedey',
    name: 'Религиозное обращение соседей',
    description: 'Мирно или принудительно склонить соседние государства к своей вере.',
  },
  {
    slug: 'vyzhivanie',
    name: 'Выживание',
    description: 'Сохранить фракцию в условиях кризиса, дефицита и внешнего давления.',
  },
  {
    slug: 'mest',
    name: 'Месть',
    description: 'Наказать виновных в прошлых поражениях и восстановить поруганную честь.',
  },
  {
    slug: 'osvobozhdenie-poraboshchennykh',
    name: 'Освобождение порабощённых',
    description: 'Ликвидировать институт рабства и освободить зависимые народы.',
  },
  {
    slug: 'poraboshchenie-sosedey',
    name: 'Порабощение соседей',
    description: 'Подчинить соседние народы и использовать их ресурсы в интересах фракции.',
  },
  {
    slug: 'ustanovlenie-tiranii',
    name: 'Установление тирании',
    description: 'Сконцентрировать власть в одних руках и подавить любую оппозицию.',
  },
  {
    slug: 'razvitie-iskusstv',
    name: 'Развитие искусств',
    description: 'Сделать культуру инструментом влияния и укрепления идентичности.',
  },
  {
    slug: 'diplomaticheskaya-gegemoniya',
    name: 'Дипломатическая гегемония',
    description: 'Стать главным арбитром в межгосударственных переговорах и союзах.',
  },
  {
    slug: 'ekologicheskaya-garmoniya',
    name: 'Экологическая гармония',
    description: 'Поддерживать устойчивый баланс между развитием и сохранением природы.',
  },
  {
    slug: 'industrializatsiya',
    name: 'Индустриализация',
    description: 'Перейти к массовому производству и инфраструктурному росту.',
    iconFile: 'industrializatsiya.jpg',
  },
];

export function migrateFactionAmbitions(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ambitions_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon_path TEXT DEFAULT '',
      is_custom INTEGER NOT NULL DEFAULT 0,
      project_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      CHECK (
        (is_custom = 0 AND project_id IS NULL) OR
        (is_custom = 1 AND project_id IS NOT NULL)
      )
    );
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ambitions_catalog_builtin_name
    ON ambitions_catalog(name)
    WHERE is_custom = 0;
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ambitions_catalog_custom_project_name
    ON ambitions_catalog(project_id, name)
    WHERE is_custom = 1;
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS faction_ambitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faction_id INTEGER NOT NULL,
      ambition_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
      FOREIGN KEY (ambition_id) REFERENCES ambitions_catalog(id) ON DELETE CASCADE,
      UNIQUE(faction_id, ambition_id)
    );
  `);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO ambitions_catalog (name, description, icon_path, is_custom, project_id)
    VALUES (?, ?, ?, 0, NULL)
  `);

  for (const ambition of PREDEFINED_AMBITIONS) {
    insert.run(ambition.name, ambition.description, builtinAmbitionIconPath(ambition));
  }

  // Старые БД уже содержат строки с INSERT OR IGNORE — обновляем icon_path под актуальные файлы в public/ambitions.
  const syncBuiltinIcon = db.prepare(
    `UPDATE ambitions_catalog SET icon_path = ? WHERE name = ? AND is_custom = 0`
  );
  for (const ambition of PREDEFINED_AMBITIONS) {
    syncBuiltinIcon.run(builtinAmbitionIconPath(ambition), ambition.name);
  }
}
