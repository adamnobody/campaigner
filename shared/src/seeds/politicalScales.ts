export type PoliticalScaleZone = {
  from: number;
  to: number;
  label: string;
  description: string;
};

export type BuiltinPoliticalScale = {
  code: string;
  entityType: 'state' | 'faction';
  category: string;
  name: string;
  leftPoleLabel: string;
  rightPoleLabel: string;
  leftPoleDescription: string;
  rightPoleDescription: string;
  zones: PoliticalScaleZone[] | null;
  sortOrder: number;
};

export const BUILTIN_POLITICAL_SCALES: readonly BuiltinPoliticalScale[] = [
  {
    "code": "authoritarianism_democracy",
    "category": "power",
    "name": "Авторитаризм ↔ Демократия",
    "entityType": "state",
    "leftPoleLabel": "Авторитаризм",
    "rightPoleLabel": "Демократия",
    "leftPoleDescription": "Сильная концентрация власти, ограниченные институты участия.",
    "rightPoleDescription": "Широкое политическое участие и конкурентные выборы.",
    "sortOrder": 1,
    "zones": [
      {
        "from": -100,
        "to": -66,
        "label": "Тирания / диктатура",
        "description": "Правление одного центра без эффективных ограничений."
      },
      {
        "from": -65,
        "to": -20,
        "label": "Авторитарный режим",
        "description": "Формальные институты есть, но оппозиция слаба."
      },
      {
        "from": -19,
        "to": 19,
        "label": "Гибридный режим",
        "description": "Смесь демократических и авторитарных практик."
      },
      {
        "from": 20,
        "to": 65,
        "label": "Представительная демократия",
        "description": "Выборы и парламент как основа легитимности."
      },
      {
        "from": 66,
        "to": 100,
        "label": "Прямая демократия",
        "description": "Максимум прямого участия граждан в решениях."
      }
    ]
  },
  {
    "code": "centralization_federalization",
    "category": "power",
    "name": "Централизация ↔ Федерализация",
    "entityType": "state",
    "leftPoleLabel": "Централизация",
    "rightPoleLabel": "Федерализация",
    "leftPoleDescription": "Решения и ресурсы сосредоточены в столице.",
    "rightPoleDescription": "Регионы и субъекты обладают существенной автономией.",
    "sortOrder": 2,
    "zones": [
      {
        "from": -100,
        "to": -50,
        "label": "Унитарное государство",
        "description": "Единая административная вертикаль."
      },
      {
        "from": -49,
        "to": 20,
        "label": "Деволюция",
        "description": "Постепенная передача полномочий вниз."
      },
      {
        "from": 21,
        "to": 65,
        "label": "Федерация",
        "description": "Чёткое разделение уровней власти."
      },
      {
        "from": 66,
        "to": 100,
        "label": "Конфедерация",
        "description": "Союз с высокой независимостью членов."
      }
    ]
  },
  {
    "code": "monarchy_republic",
    "category": "power",
    "name": "Монархия ↔ Республика",
    "entityType": "state",
    "leftPoleLabel": "Монархия",
    "rightPoleLabel": "Республика",
    "leftPoleDescription": "Наследуемая верховная власть и символика престола.",
    "rightPoleDescription": "Выборные органы и отсутствие наследственной власти.",
    "sortOrder": 3,
    "zones": [
      {
        "from": -100,
        "to": -66,
        "label": "Абсолютная монархия",
        "description": "Монарх — главный источник законов."
      },
      {
        "from": -65,
        "to": -20,
        "label": "Конституционная монархия",
        "description": "Парламент и закон ограничивают монарха."
      },
      {
        "from": -19,
        "to": 19,
        "label": "Смешанная форма",
        "description": "Черты монархии и республики в равновесии."
      },
      {
        "from": 20,
        "to": 65,
        "label": "Парламентская республика",
        "description": "Правительство отвечает перед парламентом."
      },
      {
        "from": 66,
        "to": 100,
        "label": "Президентская республика",
        "description": "Сильная исполнительная власть президента."
      }
    ]
  },
  {
    "code": "theocracy_secularism",
    "category": "power",
    "name": "Теократия ↔ Секуляризм",
    "entityType": "state",
    "leftPoleLabel": "Теократия",
    "rightPoleLabel": "Секуляризм",
    "leftPoleDescription": "Религиозное право и духовенство в основе государства.",
    "rightPoleDescription": "Нейтральность государства в религиозных вопросах.",
    "sortOrder": 4,
    "zones": [
      {
        "from": -100,
        "to": -50,
        "label": "Теократия",
        "description": "Богословские нормы определяют закон."
      },
      {
        "from": -49,
        "to": -10,
        "label": "Государственная религия",
        "description": "Официальный культ и привилегии церкви."
      },
      {
        "from": -9,
        "to": 30,
        "label": "Религия в публичной жизни",
        "description": "Заметное присутствие религии в символике и нормах."
      },
      {
        "from": 31,
        "to": 100,
        "label": "Светское государство",
        "description": "Разделение сфер и равенство конфессий."
      }
    ]
  },
  {
    "code": "police_state_civil_liberties",
    "category": "society",
    "name": "Полицейское государство ↔ Гражданские свободы",
    "entityType": "state",
    "leftPoleLabel": "Полицейское государство",
    "rightPoleLabel": "Гражданские свободы",
    "leftPoleDescription": "Сильный контроль, ограничения приватности и собраний.",
    "rightPoleDescription": "Широкие права на слово, ассоциации и судебную защиту.",
    "sortOrder": 5,
    "zones": null
  },
  {
    "code": "traditionalism_progressivism",
    "category": "society",
    "name": "Традиционализм ↔ Прогрессивизм",
    "entityType": "state",
    "leftPoleLabel": "Традиционализм",
    "rightPoleLabel": "Прогрессивизм",
    "leftPoleDescription": "Опора на устойчивые нормы, роль общины и религии.",
    "rightPoleDescription": "Ориентация на реформы, права меньшинств и новые нормы.",
    "sortOrder": 6,
    "zones": null
  },
  {
    "code": "estate_meritocracy",
    "category": "society",
    "name": "Сословность ↔ Меритократия",
    "entityType": "state",
    "leftPoleLabel": "Сословность",
    "rightPoleLabel": "Меритократия",
    "leftPoleDescription": "Статус и доступ к власти зависят от происхождения.",
    "rightPoleDescription": "Карьера и роли по компетенции и заслугам.",
    "sortOrder": 7,
    "zones": null
  },
  {
    "code": "monoethnic_multicultural",
    "category": "society",
    "name": "Моноэтничность ↔ Мультикультурализм",
    "entityType": "state",
    "leftPoleLabel": "Моноэтничность",
    "rightPoleLabel": "Мультикультурализм",
    "leftPoleDescription": "Один культурный образ государства и ассимиляционные ожидания.",
    "rightPoleDescription": "Поддержка культурного разнообразия и интеграции.",
    "sortOrder": 8,
    "zones": null
  },
  {
    "code": "planned_market",
    "category": "economy",
    "name": "Плановая ↔ Рыночная экономика",
    "entityType": "state",
    "leftPoleLabel": "Плановая",
    "rightPoleLabel": "Рыночная",
    "leftPoleDescription": "Централизованное планирование и квоты.",
    "rightPoleDescription": "Цены и конкуренция как основной регулятор.",
    "sortOrder": 9,
    "zones": [
      {
        "from": -100,
        "to": -50,
        "label": "Командно-административная",
        "description": "Планы и распределение сверху."
      },
      {
        "from": -49,
        "to": -10,
        "label": "Регулируемая плановая",
        "description": "План с местом для рыночных элементов."
      },
      {
        "from": -9,
        "to": 30,
        "label": "Смешанная экономика",
        "description": "Государство и рынок делят ключевые рычаги."
      },
      {
        "from": 31,
        "to": 70,
        "label": "Рыночная с регулированием",
        "description": "Рынок доминирует, регулирование точечное."
      },
      {
        "from": 71,
        "to": 100,
        "label": "Свободный рынок",
        "description": "Минимум барьеров и вмешательств."
      }
    ]
  },
  {
    "code": "protectionism_free_trade",
    "category": "economy",
    "name": "Протекционизм ↔ Свободная торговля",
    "entityType": "state",
    "leftPoleLabel": "Протекционизм",
    "rightPoleLabel": "Свободная торговля",
    "leftPoleDescription": "Тарифы и квоты для защиты отечественных отраслей.",
    "rightPoleDescription": "Минимальные барьеры для импорта и экспорта.",
    "sortOrder": 10,
    "zones": null
  },
  {
    "code": "agrarian_industrial",
    "category": "economy",
    "name": "Аграрность ↔ Индустриализация",
    "entityType": "state",
    "leftPoleLabel": "Аграрность",
    "rightPoleLabel": "Индустриализация",
    "leftPoleDescription": "Сельское хозяйство и земля как основа экономики.",
    "rightPoleDescription": "Промышленность, сервисы и инновации доминируют.",
    "sortOrder": 11,
    "zones": [
      {
        "from": -100,
        "to": -50,
        "label": "Аграрное общество",
        "description": "Большинство занято землёй и природными циклами."
      },
      {
        "from": -49,
        "to": 0,
        "label": "Аграрно-промышленное",
        "description": "Переходные отрасли и урбанизация."
      },
      {
        "from": 1,
        "to": 50,
        "label": "Индустриальное",
        "description": "Заводы, инфраструктура, массовое производство."
      },
      {
        "from": 51,
        "to": 100,
        "label": "Постиндустриальное",
        "description": "Услуги, ИТ, наука и глобальные цепочки."
      }
    ]
  },
  {
    "code": "state_private_property",
    "category": "economy",
    "name": "Казённая собственность ↔ Частная собственность",
    "entityType": "state",
    "leftPoleLabel": "Казённая собственность",
    "rightPoleLabel": "Частная собственность",
    "leftPoleDescription": "Государственные и общинные активы в центре модели.",
    "rightPoleDescription": "Частные права и рынок активов как норма.",
    "sortOrder": 12,
    "zones": null
  },
  {
    "code": "isolationism_expansionism",
    "category": "foreign",
    "name": "Изоляционизм ↔ Экспансионизм",
    "entityType": "state",
    "leftPoleLabel": "Изоляционизм",
    "rightPoleLabel": "Экспансионизм",
    "leftPoleDescription": "Минимальное внешнее вмешательство и автономия.",
    "rightPoleDescription": "Активное расширение влияния и интересов за рубежом.",
    "sortOrder": 13,
    "zones": null
  },
  {
    "code": "militarism_pacifism",
    "category": "foreign",
    "name": "Милитаризм ↔ Пацифизм",
    "entityType": "state",
    "leftPoleLabel": "Милитаризм",
    "rightPoleLabel": "Пацифизм",
    "leftPoleDescription": "Высокая роль армии и силовых структур в политике.",
    "rightPoleDescription": "Приоритет дипломатии и отказ от силовых решений.",
    "sortOrder": 14,
    "zones": null
  },
  {
    "code": "sovereignty_integration",
    "category": "foreign",
    "name": "Суверенитет ↔ Интеграция",
    "entityType": "state",
    "leftPoleLabel": "Суверенитет",
    "rightPoleLabel": "Интеграция",
    "leftPoleDescription": "Полный контроль над законами и границами.",
    "rightPoleDescription": "Уступка полномочий союзам и наднациональным органам.",
    "sortOrder": 15,
    "zones": [
      {
        "from": -100,
        "to": -50,
        "label": "Полная независимость",
        "description": "Нет обязательств, выше национальный суверенитет."
      },
      {
        "from": -49,
        "to": 0,
        "label": "Союзнические отношения",
        "description": "Договоры и координация без уступки суверенитета."
      },
      {
        "from": 1,
        "to": 50,
        "label": "Конфедеративные структуры",
        "description": "Совместные институты с разделением компетенций."
      },
      {
        "from": 51,
        "to": 100,
        "label": "Наднациональный союз",
        "description": "Глубокая интеграция законов и политик."
      }
    ]
  },
  {
    "code": "xenophobia_openness",
    "category": "foreign",
    "name": "Ксенофобия ↔ Открытость",
    "entityType": "state",
    "leftPoleLabel": "Ксенофобия",
    "rightPoleLabel": "Открытость",
    "leftPoleDescription": "Опасение чужого, жёсткие барьеры для приезжих.",
    "rightPoleDescription": "Миграция и обмен как норма и ресурс.",
    "sortOrder": 16,
    "zones": null
  },
  {
    "code": "loyalism_opposition",
    "category": "authority",
    "name": "Лоялизм ↔ Оппозиция",
    "entityType": "faction",
    "leftPoleLabel": "Лоялизм",
    "rightPoleLabel": "Оппозиция",
    "leftPoleDescription": "Поддержка текущей власти и легитимных институтов.",
    "rightPoleDescription": "Критика режима и стремление к смене курса.",
    "sortOrder": 1,
    "zones": null
  },
  {
    "code": "reformism_revolution",
    "category": "authority",
    "name": "Реформизм ↔ Революционность",
    "entityType": "faction",
    "leftPoleLabel": "Реформизм",
    "rightPoleLabel": "Революционность",
    "leftPoleDescription": "Постепенные изменения в рамках системы.",
    "rightPoleDescription": "Резкий разрыв с прежним порядком.",
    "sortOrder": 2,
    "zones": [
      {
        "from": -100,
        "to": -50,
        "label": "Консерваторы",
        "description": "Сопротивление переменам, сохранение статус-кво."
      },
      {
        "from": -49,
        "to": 0,
        "label": "Реформисты",
        "description": "Эволюция правил и институтов."
      },
      {
        "from": 1,
        "to": 50,
        "label": "Радикальные реформисты",
        "description": "Быстрые преобразования без насильственного переворота."
      },
      {
        "from": 51,
        "to": 100,
        "label": "Революционеры",
        "description": "Насильственная смена системы как допустимая цель."
      }
    ]
  },
  {
    "code": "legalism_underground",
    "category": "authority",
    "name": "Легализм ↔ Подпольность",
    "entityType": "faction",
    "leftPoleLabel": "Легализм",
    "rightPoleLabel": "Подпольность",
    "leftPoleDescription": "Публичная регистрация и работа в правовом поле.",
    "rightPoleDescription": "Тайные структуры и обход официальных запретов.",
    "sortOrder": 3,
    "zones": [
      {
        "from": -100,
        "to": -50,
        "label": "Официальная партия",
        "description": "Полностью легальный статус и доступ к институтам."
      },
      {
        "from": -49,
        "to": 0,
        "label": "Полулегальное движение",
        "description": "Частичная легальность, зона серых схем."
      },
      {
        "from": 1,
        "to": 50,
        "label": "Нелегальное движение",
        "description": "Запрещённая деятельность без глубокой конспирации."
      },
      {
        "from": 51,
        "to": 100,
        "label": "Подпольная организация",
        "description": "Строгая конспирация и скрытая сеть."
      }
    ]
  },
  {
    "code": "conformism_radicalism",
    "category": "authority",
    "name": "Конформизм ↔ Радикализм",
    "entityType": "faction",
    "leftPoleLabel": "Конформизм",
    "rightPoleLabel": "Радикализм",
    "leftPoleDescription": "Следование общим нормам и умеренность формулировок.",
    "rightPoleDescription": "Резкие лозунги и нетерпимость к компромиссам.",
    "sortOrder": 4,
    "zones": null
  },
  {
    "code": "collectivism_individualism",
    "category": "ideology",
    "name": "Коллективизм ↔ Индивидуализм",
    "entityType": "faction",
    "leftPoleLabel": "Коллективизм",
    "rightPoleLabel": "Индивидуализм",
    "leftPoleDescription": "Приоритет группы, общей цели и солидарности.",
    "rightPoleDescription": "Свобода личного выбора и автономия членов.",
    "sortOrder": 5,
    "zones": null
  },
  {
    "code": "egalitarianism_elitism",
    "category": "ideology",
    "name": "Эгалитаризм ↔ Элитаризм",
    "entityType": "faction",
    "leftPoleLabel": "Эгалитаризм",
    "rightPoleLabel": "Элитаризм",
    "leftPoleDescription": "Равенство доступа и распределения ролей.",
    "rightPoleDescription": "Лидерство избранных и иерархия компетенций.",
    "sortOrder": 6,
    "zones": null
  },
  {
    "code": "dogmatism_pragmatism",
    "category": "ideology",
    "name": "Догматизм ↔ Прагматизм",
    "entityType": "faction",
    "leftPoleLabel": "Догматизм",
    "rightPoleLabel": "Прагматизм",
    "leftPoleDescription": "Негибкие доктрины и символическая чистота.",
    "rightPoleDescription": "Гибкие решения и расчёт последствий.",
    "sortOrder": 7,
    "zones": null
  },
  {
    "code": "nationalism_internationalism",
    "category": "ideology",
    "name": "Националистичность ↔ Интернационализм",
    "entityType": "faction",
    "leftPoleLabel": "Националистичность",
    "rightPoleLabel": "Интернационализм",
    "leftPoleDescription": "Приоритет национального сообщества и культуры.",
    "rightPoleDescription": "Трансграничная солидарность и общие ценности.",
    "sortOrder": 8,
    "zones": null
  },
  {
    "code": "nonviolence_armed_struggle",
    "category": "methods",
    "name": "Ненасилие ↔ Вооружённая борьба",
    "entityType": "faction",
    "leftPoleLabel": "Ненасилие",
    "rightPoleLabel": "Вооружённая борьба",
    "leftPoleDescription": "Отказ от силовых методов как принцип.",
    "rightPoleDescription": "Допустимость оружия и силовых действий.",
    "sortOrder": 9,
    "zones": [
      {
        "from": -100,
        "to": -50,
        "label": "Принципиальное ненасилие",
        "description": "Никакого применения силы даже в ответ."
      },
      {
        "from": -49,
        "to": 0,
        "label": "Гражданское сопротивление",
        "description": "Бойкоты, забастовки, демонстрации."
      },
      {
        "from": 1,
        "to": 50,
        "label": "Силовые акции",
        "description": "Конфликты без системной войны."
      },
      {
        "from": 51,
        "to": 100,
        "label": "Вооружённая борьба",
        "description": "Партизанская или военная линия как стратегия."
      }
    ]
  },
  {
    "code": "publicity_conspiracy",
    "category": "methods",
    "name": "Публичность ↔ Конспирация",
    "entityType": "faction",
    "leftPoleLabel": "Публичность",
    "rightPoleLabel": "Конспирация",
    "leftPoleDescription": "Открытые кампании и медиаприсутствие.",
    "rightPoleDescription": "Скрытность, ячейки и минимум следов.",
    "sortOrder": 10,
    "zones": null
  },
  {
    "code": "diplomacy_confrontation",
    "category": "methods",
    "name": "Дипломатия ↔ Конфронтация",
    "entityType": "faction",
    "leftPoleLabel": "Дипломатия",
    "rightPoleLabel": "Конфронтация",
    "leftPoleDescription": "Переговоры, коалиции и поиск компромиссов.",
    "rightPoleDescription": "Жёсткое давление и публичные атаки оппонентов.",
    "sortOrder": 11,
    "zones": null
  },
  {
    "code": "propaganda_coercion",
    "category": "methods",
    "name": "Пропаганда ↔ Принуждение",
    "entityType": "faction",
    "leftPoleLabel": "Пропаганда",
    "rightPoleLabel": "Принуждение",
    "leftPoleDescription": "Убеждение, мифология, работа с общественным мнением.",
    "rightPoleDescription": "Прямое принуждение, санкции и запугивание.",
    "sortOrder": 12,
    "zones": null
  },
  {
    "code": "mass_cadre",
    "category": "base",
    "name": "Народность ↔ Кадровость",
    "entityType": "faction",
    "leftPoleLabel": "Народность",
    "rightPoleLabel": "Кадровость",
    "leftPoleDescription": "Массовая база и открытый набор.",
    "rightPoleDescription": "Узкий круг посвящённых и строгий отбор.",
    "sortOrder": 13,
    "zones": [
      {
        "from": -100,
        "to": -50,
        "label": "Массовое движение",
        "description": "Десятки тысяч сторонников и активистов."
      },
      {
        "from": -49,
        "to": 0,
        "label": "Широкая партия",
        "description": "Крупная, но управляемая структура."
      },
      {
        "from": 1,
        "to": 50,
        "label": "Кадровая партия",
        "description": "Профессиональное ядро и дисциплина."
      },
      {
        "from": 51,
        "to": 100,
        "label": "Орден / узкий круг",
        "description": "Элитное сообщество с ритуалами и фильтрами."
      }
    ]
  },
  {
    "code": "self_financed_patronage",
    "category": "base",
    "name": "Самофинансирование ↔ Покровительство",
    "entityType": "faction",
    "leftPoleLabel": "Самофинансирование",
    "rightPoleLabel": "Покровительство",
    "leftPoleDescription": "Членские взносы и автономные источники.",
    "rightPoleDescription": "Зависимость от спонсоров и внешних покровителей.",
    "sortOrder": 14,
    "zones": null
  },
  {
    "code": "secular_religious",
    "category": "base",
    "name": "Светскость ↔ Религиозность",
    "entityType": "faction",
    "leftPoleLabel": "Светскость",
    "rightPoleLabel": "Религиозность",
    "leftPoleDescription": "Секулярная идеология и нейтральный дискурс.",
    "rightPoleDescription": "Религиозные обеты, догматы и ритуал в основе.",
    "sortOrder": 15,
    "zones": null
  },
  {
    "code": "class_based_transclass",
    "category": "base",
    "name": "Классовость ↔ Надклассовость",
    "entityType": "faction",
    "leftPoleLabel": "Классовость",
    "rightPoleLabel": "Надклассовость",
    "leftPoleDescription": "Явная опора на класс или сословие.",
    "rightPoleDescription": "Коалиции между разными слоями «ради общего дела».",
    "sortOrder": 16,
    "zones": null
  }
];
