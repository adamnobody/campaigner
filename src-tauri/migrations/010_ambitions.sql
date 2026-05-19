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

CREATE UNIQUE INDEX IF NOT EXISTS idx_ambitions_catalog_builtin_name
  ON ambitions_catalog(name)
  WHERE is_custom = 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ambitions_catalog_custom_project_name
  ON ambitions_catalog(project_id, name)
  WHERE is_custom = 1;

CREATE TABLE IF NOT EXISTS ambition_exclusions (
  ambition_id INTEGER NOT NULL,
  excluded_ambition_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (ambition_id, excluded_ambition_id),
  FOREIGN KEY (ambition_id) REFERENCES ambitions_catalog(id) ON DELETE CASCADE,
  FOREIGN KEY (excluded_ambition_id) REFERENCES ambitions_catalog(id) ON DELETE CASCADE,
  CHECK (ambition_id != excluded_ambition_id)
);

CREATE TABLE IF NOT EXISTS faction_ambitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faction_id INTEGER NOT NULL,
  ambition_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
  FOREIGN KEY (ambition_id) REFERENCES ambitions_catalog(id) ON DELETE CASCADE,
  UNIQUE(faction_id, ambition_id)
);

CREATE INDEX IF NOT EXISTS idx_faction_ambitions_faction ON faction_ambitions(faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_ambitions_ambition ON faction_ambitions(ambition_id);

INSERT OR IGNORE INTO ambitions_catalog (name, description, icon_path, is_custom, project_id) VALUES
  ('Торговая доминация', 'Установить контроль над ключевыми рынками и финансовыми потоками региона.', '/ambitions/torgovaya-dominatsiya.jpg', 0, NULL),
  ('Военное превосходство', 'Сформировать армию, способную подавить любого соперника на суше и море.', '/ambitions/voennoe-prevoskhodstvo.jpg', 0, NULL),
  ('Поддержание мира', 'Сдерживать эскалацию конфликтов и поддерживать баланс сил между соседями.', '/ambitions/podderzhanie-mira.jpg', 0, NULL),
  ('Территориальная экспансия', 'Последовательно расширять границы и закреплять контроль над новыми землями.', '/ambitions/territorialnaya-ekspansiya.jpg', 0, NULL),
  ('Религиозная экспансия', 'Распространить веру фракции в соседних землях через миссии и влияние.', '/ambitions/religioznaya-ekspansiya.jpg', 0, NULL),
  ('Технологический прогресс', 'Инвестировать в инженерные прорывы для усиления экономики и армии.', '/ambitions/tekhnologicheskiy-progress.jpg', 0, NULL),
  ('Культурная ассимиляция', 'Интегрировать соседние народы через язык, образование и символы власти.', '/ambitions/kulturnaya-assimilyatsiya.jpg', 0, NULL),
  ('Защита традиций', 'Сохранить обычаи предков и не допустить разрушения устоявшегося порядка.', '/ambitions/zashchita-traditsiy.jpg', 0, NULL),
  ('Изоляционизм', 'Свести внешние контакты к минимуму и сосредоточиться на внутренних делах.', '/ambitions/izolyatsionizm.jpg', 0, NULL),
  ('Магическое превосходство', 'Собрать сильнейших магов и артефакты для доминирования в мистической сфере.', '/ambitions/magicheskoe-prevoskhodstvo.jpg', 0, NULL),
  ('Объединение народа', 'Преодолеть внутренние расколы и создать единый национальный проект.', '/ambitions/obedinenie-naroda.jpg', 0, NULL),
  ('Свержение соседа', 'Лишить соседнюю державу власти через войну, заговоры и подрыв экономики.', '/ambitions/sverzhenie-soseda.jpg', 0, NULL),
  ('Накопление богатства', 'Концентрировать ресурсы и капитал ради долгосрочной независимости.', '/ambitions/nakoplenie-bogatstva.jpg', 0, NULL),
  ('Научный прогресс', 'Развивать академии и исследовательские центры для постоянных открытий.', '/ambitions/nauchnyy-progress.jpg', 0, NULL),
  ('Демократизация', 'Передать часть власти представительным институтам и расширить участие граждан.', '/ambitions/demokratizatsiya.jpg', 0, NULL),
  ('Реставрация старого порядка', 'Вернуть прежние институты и иерархию, отменив реформы последних лет.', '/ambitions/restavratsiya-starogo-poryadka.jpg', 0, NULL),
  ('Создание колоний', 'Осваивать удаленные территории и закреплять там экономическое присутствие.', '/ambitions/sozdanie-koloniy.jpg', 0, NULL),
  ('Контроль морских путей', 'Доминировать в проливах и портах, управляя морской торговлей и логистикой.', '/ambitions/kontrol-morskikh-putey.jpg', 0, NULL),
  ('Контроль торговых маршрутов', 'Монополизировать караванные и речные пути, диктуя условия обмена.', '/ambitions/kontrol-torgovykh-marshrutov.jpg', 0, NULL),
  ('Религиозное обращение соседей', 'Мирно или принудительно склонить соседние государства к своей вере.', '/ambitions/religioznoe-obrashchenie-sosedey.jpg', 0, NULL),
  ('Выживание', 'Сохранить фракцию в условиях кризиса, дефицита и внешнего давления.', '/ambitions/vyzhivanie.jpg', 0, NULL),
  ('Месть', 'Наказать виновных в прошлых поражениях и восстановить поруганную честь.', '/ambitions/mest.jpg', 0, NULL),
  ('Освобождение порабощённых', 'Ликвидировать институт рабства и освободить зависимые народы.', '/ambitions/osvobozhdenie-poraboshchennykh.jpg', 0, NULL),
  ('Порабощение соседей', 'Подчинить соседние народы и использовать их ресурсы в интересах фракции.', '/ambitions/poraboshchenie-sosedey.jpg', 0, NULL),
  ('Установление тирании', 'Сконцентрировать власть в одних руках и подавить любую оппозицию.', '/ambitions/ustanovlenie-tiranii.jpg', 0, NULL),
  ('Развитие искусств', 'Сделать культуру инструментом влияния и укрепления идентичности.', '/ambitions/razvitie-iskusstv.jpg', 0, NULL),
  ('Дипломатическая гегемония', 'Стать главным арбитром в межгосударственных переговорах и союзах.', '/ambitions/diplomaticheskaya-gegemoniya.jpg', 0, NULL),
  ('Экологическая гармония', 'Поддерживать устойчивый баланс между развитием и сохранением природы.', '/ambitions/ekologicheskaya-garmoniya.jpg', 0, NULL),
  ('Индустриализация', 'Перейти к массовому производству и инфраструктурному росту.', '/ambitions/industrializatsiya.jpg', 0, NULL);

INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Изоляционизм' AND a2.name = 'Торговая доминация';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Торговая доминация' AND a2.name = 'Изоляционизм';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Изоляционизм' AND a2.name = 'Территориальная экспансия';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Территориальная экспансия' AND a2.name = 'Изоляционизм';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Изоляционизм' AND a2.name = 'Контроль торговых маршрутов';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Контроль торговых маршрутов' AND a2.name = 'Изоляционизм';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Поддержание мира' AND a2.name = 'Военное превосходство';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Военное превосходство' AND a2.name = 'Поддержание мира';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Поддержание мира' AND a2.name = 'Свержение соседа';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Свержение соседа' AND a2.name = 'Поддержание мира';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Поддержание мира' AND a2.name = 'Порабощение соседей';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Порабощение соседей' AND a2.name = 'Поддержание мира';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Поддержание мира' AND a2.name = 'Религиозное обращение соседей';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Религиозное обращение соседей' AND a2.name = 'Поддержание мира';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Технологический прогресс' AND a2.name = 'Защита традиций';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Защита традиций' AND a2.name = 'Технологический прогресс';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Технологический прогресс' AND a2.name = 'Реставрация старого порядка';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Реставрация старого порядка' AND a2.name = 'Технологический прогресс';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Культурная ассимиляция' AND a2.name = 'Защита традиций';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Защита традиций' AND a2.name = 'Культурная ассимиляция';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Религиозная экспансия' AND a2.name = 'Демократизация';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Демократизация' AND a2.name = 'Религиозная экспансия';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Магическое превосходство' AND a2.name = 'Научный прогресс';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Научный прогресс' AND a2.name = 'Магическое превосходство';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Объединение народа' AND a2.name = 'Порабощение соседей';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Порабощение соседей' AND a2.name = 'Объединение народа';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Накопление богатства' AND a2.name = 'Экологическая гармония';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Экологическая гармония' AND a2.name = 'Накопление богатства';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Научный прогресс' AND a2.name = 'Реставрация старого порядка';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Реставрация старого порядка' AND a2.name = 'Научный прогресс';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Демократизация' AND a2.name = 'Установление тирании';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Установление тирании' AND a2.name = 'Демократизация';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Создание колоний' AND a2.name = 'Экологическая гармония';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Экологическая гармония' AND a2.name = 'Создание колоний';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Контроль морских путей' AND a2.name = 'Поддержание мира';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Поддержание мира' AND a2.name = 'Контроль морских путей';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Выживание' AND a2.name = 'Территориальная экспансия';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Территориальная экспансия' AND a2.name = 'Выживание';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Месть' AND a2.name = 'Дипломатическая гегемония';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Дипломатическая гегемония' AND a2.name = 'Месть';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Освобождение порабощённых' AND a2.name = 'Порабощение соседей';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Порабощение соседей' AND a2.name = 'Освобождение порабощённых';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Развитие искусств' AND a2.name = 'Индустриализация';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Индустриализация' AND a2.name = 'Развитие искусств';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Индустриализация' AND a2.name = 'Экологическая гармония';
INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
SELECT a1.id, a2.id FROM ambitions_catalog a1, ambitions_catalog a2
WHERE a1.is_custom = 0 AND a2.is_custom = 0 AND a1.name = 'Экологическая гармония' AND a2.name = 'Индустриализация';
