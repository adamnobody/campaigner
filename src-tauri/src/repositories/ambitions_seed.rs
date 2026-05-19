// GENERATED — DO NOT EDIT
// Source: shared/seeds/ambitions.ts via scripts/gen-rust-seeds.mjs
// manifest-hash: 8af6c931daf0eb14ec78ea2f5cd29fcf9fd2ac2c6156cd8556f445928faf1294

use rusqlite::{params, Connection};

use crate::error::Result;

const BUILTIN_AMBITIONS: &[(&str, &str, &str)] = &[
    (
        "Торговая доминация",
        "Установить контроль над ключевыми рынками и финансовыми потоками региона.",
        "/ambitions/torgovaya-dominatsiya.jpg",
    ),
    (
        "Военное превосходство",
        "Сформировать армию, способную подавить любого соперника на суше и море.",
        "/ambitions/voennoe-prevoskhodstvo.jpg",
    ),
    (
        "Поддержание мира",
        "Сдерживать эскалацию конфликтов и поддерживать баланс сил между соседями.",
        "/ambitions/podderzhanie-mira.jpg",
    ),
    (
        "Территориальная экспансия",
        "Последовательно расширять границы и закреплять контроль над новыми землями.",
        "/ambitions/territorialnaya-ekspansiya.jpg",
    ),
    (
        "Религиозная экспансия",
        "Распространить веру фракции в соседних землях через миссии и влияние.",
        "/ambitions/religioznaya-ekspansiya.jpg",
    ),
    (
        "Технологический прогресс",
        "Инвестировать в инженерные прорывы для усиления экономики и армии.",
        "/ambitions/tekhnologicheskiy-progress.jpg",
    ),
    (
        "Культурная ассимиляция",
        "Интегрировать соседние народы через язык, образование и символы власти.",
        "/ambitions/kulturnaya-assimilyatsiya.jpg",
    ),
    (
        "Защита традиций",
        "Сохранить обычаи предков и не допустить разрушения устоявшегося порядка.",
        "/ambitions/zashchita-traditsiy.jpg",
    ),
    (
        "Изоляционизм",
        "Свести внешние контакты к минимуму и сосредоточиться на внутренних делах.",
        "/ambitions/izolyatsionizm.jpg",
    ),
    (
        "Магическое превосходство",
        "Собрать сильнейших магов и артефакты для доминирования в мистической сфере.",
        "/ambitions/magicheskoe-prevoskhodstvo.jpg",
    ),
    (
        "Объединение народа",
        "Преодолеть внутренние расколы и создать единый национальный проект.",
        "/ambitions/obedinenie-naroda.jpg",
    ),
    (
        "Свержение соседа",
        "Лишить соседнюю державу власти через войну, заговоры и подрыв экономики.",
        "/ambitions/sverzhenie-soseda.jpg",
    ),
    (
        "Накопление богатства",
        "Концентрировать ресурсы и капитал ради долгосрочной независимости.",
        "/ambitions/nakoplenie-bogatstva.jpg",
    ),
    (
        "Научный прогресс",
        "Развивать академии и исследовательские центры для постоянных открытий.",
        "/ambitions/nauchnyy-progress.jpg",
    ),
    (
        "Демократизация",
        "Передать часть власти представительным институтам и расширить участие граждан.",
        "/ambitions/demokratizatsiya.jpg",
    ),
    (
        "Реставрация старого порядка",
        "Вернуть прежние институты и иерархию, отменив реформы последних лет.",
        "/ambitions/restavratsiya-starogo-poryadka.jpg",
    ),
    (
        "Создание колоний",
        "Осваивать удаленные территории и закреплять там экономическое присутствие.",
        "/ambitions/sozdanie-koloniy.jpg",
    ),
    (
        "Контроль морских путей",
        "Доминировать в проливах и портах, управляя морской торговлей и логистикой.",
        "/ambitions/kontrol-morskikh-putey.jpg",
    ),
    (
        "Контроль торговых маршрутов",
        "Монополизировать караванные и речные пути, диктуя условия обмена.",
        "/ambitions/kontrol-torgovykh-marshrutov.jpg",
    ),
    (
        "Религиозное обращение соседей",
        "Мирно или принудительно склонить соседние государства к своей вере.",
        "/ambitions/religioznoe-obrashchenie-sosedey.jpg",
    ),
    (
        "Выживание",
        "Сохранить фракцию в условиях кризиса, дефицита и внешнего давления.",
        "/ambitions/vyzhivanie.jpg",
    ),
    (
        "Месть",
        "Наказать виновных в прошлых поражениях и восстановить поруганную честь.",
        "/ambitions/mest.jpg",
    ),
    (
        "Освобождение порабощённых",
        "Ликвидировать институт рабства и освободить зависимые народы.",
        "/ambitions/osvobozhdenie-poraboshchennykh.jpg",
    ),
    (
        "Порабощение соседей",
        "Подчинить соседние народы и использовать их ресурсы в интересах фракции.",
        "/ambitions/poraboshchenie-sosedey.jpg",
    ),
    (
        "Установление тирании",
        "Сконцентрировать власть в одних руках и подавить любую оппозицию.",
        "/ambitions/ustanovlenie-tiranii.jpg",
    ),
    (
        "Развитие искусств",
        "Сделать культуру инструментом влияния и укрепления идентичности.",
        "/ambitions/razvitie-iskusstv.jpg",
    ),
    (
        "Дипломатическая гегемония",
        "Стать главным арбитром в межгосударственных переговорах и союзах.",
        "/ambitions/diplomaticheskaya-gegemoniya.jpg",
    ),
    (
        "Экологическая гармония",
        "Поддерживать устойчивый баланс между развитием и сохранением природы.",
        "/ambitions/ekologicheskaya-garmoniya.jpg",
    ),
    (
        "Индустриализация",
        "Перейти к массовому производству и инфраструктурному росту.",
        "/ambitions/industrializatsiya.jpg",
    ),
];

const AMBITION_EXCLUSION_PAIRS: &[(&str, &str)] = &[
    ("Изоляционизм", "Торговая доминация"),
    ("Изоляционизм", "Территориальная экспансия"),
    ("Изоляционизм", "Контроль торговых маршрутов"),
    ("Поддержание мира", "Военное превосходство"),
    ("Поддержание мира", "Свержение соседа"),
    ("Поддержание мира", "Порабощение соседей"),
    ("Поддержание мира", "Религиозное обращение соседей"),
    ("Технологический прогресс", "Защита традиций"),
    ("Технологический прогресс", "Реставрация старого порядка"),
    ("Культурная ассимиляция", "Защита традиций"),
    ("Религиозная экспансия", "Демократизация"),
    ("Магическое превосходство", "Научный прогресс"),
    ("Объединение народа", "Порабощение соседей"),
    ("Накопление богатства", "Экологическая гармония"),
    ("Научный прогресс", "Реставрация старого порядка"),
    ("Демократизация", "Установление тирании"),
    ("Создание колоний", "Экологическая гармония"),
    ("Контроль морских путей", "Поддержание мира"),
    ("Выживание", "Территориальная экспансия"),
    ("Месть", "Дипломатическая гегемония"),
    ("Освобождение порабощённых", "Порабощение соседей"),
    ("Развитие искусств", "Индустриализация"),
    ("Индустриализация", "Экологическая гармония"),
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
        .query_map([], |row| Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?)))?
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
