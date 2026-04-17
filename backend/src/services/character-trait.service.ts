import { getDb } from '../db/connection.js';
import type { CharacterTrait, CreateCharacterTrait } from '@campaigner/shared';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';

const seededProjects = new Set<number>();
const seededExclusionsProjects = new Set<number>();

const DEFAULT_TRAIT_EXCLUSION_PAIRS = [
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

export const PREDEFINED_TRAITS = [
  {
    slug: 'dobrota',
    name: 'Доброта',
    description:
      'Искреннее сочувствие к окружающим и стремление помочь даже в ущерб себе.',
  },
  {
    slug: 'zlost',
    name: 'Злость',
    description: 'Склонность к вспышкам гнева и агрессивным реакциям на раздражители.',
  },
  {
    slug: 'chrevogudie',
    name: 'Чревоугодие',
    description: 'Невоздержанность в еде, напитках и телесных удовольствиях.',
  },
  {
    slug: 'pokhot',
    name: 'Похоть',
    description: 'Одержимость желанием и страстью, неспособность противостоять влечению.',
  },
  {
    slug: 'ambitsioznost',
    name: 'Амбициозность',
    description: 'Стремление к высоким целям, нежелание останавливаться на достигнутом.',
  },
  {
    slug: 'kreativnost',
    name: 'Креативность',
    description:
      'Нестандартное мышление и богатое воображение, способность находить неожиданные решения.',
  },
  {
    slug: 'apatiya',
    name: 'Апатия',
    description: 'Глубокое безразличие к происходящему вокруг и к собственной судьбе.',
  },
  {
    slug: 'nervoznost',
    name: 'Нервозность',
    description: 'Постоянная тревожность и беспокойство, склонность к панике.',
  },
  {
    slug: 'egoizm',
    name: 'Эгоизм',
    description: 'Ставит собственные интересы выше интересов окружающих.',
  },
  {
    slug: 'samokontrol',
    name: 'Самоконтроль',
    description:
      'Способность управлять своими эмоциями и порывами даже в критических ситуациях.',
  },
  {
    slug: 'kharizma',
    name: 'Харизма',
    description: 'Природная притягательность и способность вести за собой людей.',
  },
  {
    slug: 'khladnokrovie',
    name: 'Хладнокровие',
    description:
      'Невозмутимое спокойствие под давлением, способность действовать рационально в стрессе.',
  },
  {
    slug: 'fanatizm',
    name: 'Фанатизм',
    description: 'Слепая, непоколебимая преданность идее, вере или делу.',
  },
  {
    slug: 'doverchivost',
    name: 'Доверчивость',
    description: 'Легко верит другим, не ожидая подвоха или обмана.',
  },
  {
    slug: 'mudrost',
    name: 'Мудрость',
    description: 'Глубокое понимание мира и людей, способность видеть суть вещей.',
  },
  {
    slug: 'litsemerie',
    name: 'Лицемерие',
    description: 'Привычка скрывать истинные намерения за маской добродетели.',
  },
  {
    slug: 'malodushie',
    name: 'Малодушие',
    description:
      'Неспособность действовать решительно перед лицом опасности или трудностей.',
  },
  {
    slug: 'chestnost',
    name: 'Честность',
    description: 'Говорит правду даже когда это невыгодно или опасно.',
  },
  {
    slug: 'khrabrost',
    name: 'Храбрость',
    description:
      'Готовность идти навстречу опасности ради своих убеждений и близких.',
  },
  {
    slug: 'upryamstvo',
    name: 'Упрямство',
    description: 'Твёрдо стоит на своём и не отступает от принятого решения.',
  },
  {
    slug: 'reshitelnost',
    name: 'Решительность',
    description:
      'Быстро принимает решения и незамедлительно переходит к действиям.',
  },
  {
    slug: 'vernost',
    name: 'Верность',
    description: 'Непоколебимая преданность своим людям и принципам.',
  },
  {
    slug: 'khitrost',
    name: 'Хитрость',
    description:
      'Предпочитает обходные пути, манипуляции и нестандартные ходы прямой конфронтации.',
  },
  {
    slug: 'zhestokost',
    name: 'Жестокость',
    description: 'Готовность причинять страдания без угрызений совести.',
  },
  {
    slug: 'miloserdie',
    name: 'Милосердие',
    description: 'Способность прощать, щадить и давать второй шанс.',
  },
  {
    slug: 'vysokomerie',
    name: 'Высокомерие',
    description: 'Глубокое ощущение собственного превосходства над окружающими.',
  },
  {
    slug: 'lyubopytstvo',
    name: 'Любопытство',
    description:
      'Неутолимая тяга к познанию, исследованию и новым открытиям.',
  },
  {
    slug: 'melankholiya',
    name: 'Меланхолия',
    description: 'Склонность к грусти, задумчивости и глубокой рефлексии.',
  },
  {
    slug: 'optimizm',
    name: 'Оптимизм',
    description:
      'Неиссякаемая вера в лучший исход, способность видеть свет в любой ситуации.',
  },
  {
    slug: 'paranoyya',
    name: 'Паранойя',
    description: 'Постоянная подозрительность и ожидание угрозы от окружающих.',
  },
  {
    slug: 'zhadnost',
    name: 'Жадность',
    description: 'Неудержимое стремление накапливать и нежелание делиться.',
  },
  {
    slug: 'shchedrost',
    name: 'Щедрость',
    description:
      'Искренняя готовность отдавать и делиться без ожидания отдачи.',
  },
  {
    slug: 'raschetlivost',
    name: 'Расчётливость',
    description:
      'Холодная прагматика, каждое действие подчинено выгоде и логике.',
  },
  {
    slug: 'umstvennaya-otstalost',
    name: 'Умственная отсталость',
    description:
      'Ограниченные способности к обучению и пониманию сложных концепций.',
  },
  {
    slug: 'utonchennost',
    name: 'Утончённость',
    description: 'Изысканные манеры, тонкий вкус и внимание к деталям.',
  },
] as const;

interface TraitRow {
  id: number;
  project_id: number;
  name: string;
  description: string;
  image_path: string;
  is_predefined: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: TraitRow): CharacterTrait {
  const exclusions = CharacterTraitService.getExclusions(row.id);
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description ?? '',
    imagePath: row.image_path ?? '',
    isPredefined: row.is_predefined === 1,
    exclusions,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CharacterTraitService {
  private static seedDefaultExclusions(projectId: number): void {
    if (seededExclusionsProjects.has(projectId)) return;
    const db = getDb();
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
    const insert = db.prepare(`
      INSERT OR IGNORE INTO character_trait_exclusions (trait_id, excluded_trait_id)
      VALUES (?, ?)
    `);

    for (const [leftName, rightName] of DEFAULT_TRAIT_EXCLUSION_PAIRS) {
      const leftId = byName.get(leftName);
      const rightId = byName.get(rightName);
      if (!leftId || !rightId) continue;
      insert.run(leftId, rightId);
      insert.run(rightId, leftId);
    }
    seededExclusionsProjects.add(projectId);
  }

  static seedPredefined(projectId: number): void {
    if (seededProjects.has(projectId)) return;
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO character_traits (project_id, name, description, image_path, is_predefined, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    PREDEFINED_TRAITS.forEach((t, i) => {
      stmt.run(projectId, t.name, t.description, `/traits/${t.slug}.jpg`, i);
    });
    this.seedDefaultExclusions(projectId);
    seededProjects.add(projectId);
  }

  static getAll(projectId: number): CharacterTrait[] {
    this.seedPredefined(projectId);
    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT id, project_id, name, description, image_path, is_predefined, sort_order, created_at, updated_at
      FROM character_traits
      WHERE project_id = ?
      ORDER BY sort_order ASC, name ASC
    `
      )
      .all(projectId) as TraitRow[];
    return rows.map(mapRow);
  }

  static getById(id: number): CharacterTrait {
    const db = getDb();
    const row = db
      .prepare(
        `
      SELECT id, project_id, name, description, image_path, is_predefined, sort_order, created_at, updated_at
      FROM character_traits WHERE id = ?
    `
      )
      .get(id) as TraitRow | undefined;
    if (!row) throw new NotFoundError('Trait');
    return mapRow(row);
  }

  static getAssignedTraitIds(characterId: number): number[] {
    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT trait_id FROM character_trait_assignments WHERE character_id = ? ORDER BY trait_id ASC
    `
      )
      .all(characterId) as { trait_id: number }[];
    return rows.map((r) => r.trait_id);
  }

  static getExclusions(traitId: number): number[] {
    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT excluded_trait_id
        FROM character_trait_exclusions
        WHERE trait_id = ?
        ORDER BY excluded_trait_id ASC
      `
      )
      .all(traitId) as { excluded_trait_id: number }[];
    return rows.map((row) => row.excluded_trait_id);
  }

  static setExclusions(traitId: number, excludedIds: number[]): CharacterTrait {
    const db = getDb();
    const trait = db
      .prepare(`SELECT id, project_id FROM character_traits WHERE id = ?`)
      .get(traitId) as { id: number; project_id: number } | undefined;
    if (!trait) throw new NotFoundError('Trait');

    const normalized = Array.from(new Set(excludedIds));
    if (normalized.includes(traitId)) {
      throw new BadRequestError('Trait cannot exclude itself');
    }

    if (normalized.length > 0) {
      const placeholders = normalized.map(() => '?').join(',');
      const candidates = db
        .prepare(
          `
          SELECT id, project_id
          FROM character_traits
          WHERE id IN (${placeholders})
        `
        )
        .all(...normalized) as Array<{ id: number; project_id: number }>;

      if (candidates.length !== normalized.length) {
        throw new NotFoundError('Excluded trait');
      }
      if (candidates.some((row) => row.project_id !== trait.project_id)) {
        throw new BadRequestError('Excluded traits must belong to the same project');
      }
    }

    const remove = db.prepare(`
      DELETE FROM character_trait_exclusions
      WHERE trait_id = ? OR excluded_trait_id = ?
    `);
    const insert = db.prepare(`
      INSERT OR IGNORE INTO character_trait_exclusions (trait_id, excluded_trait_id)
      VALUES (?, ?)
    `);

    const tx = db.transaction(() => {
      remove.run(traitId, traitId);
      for (const excludedId of normalized) {
        insert.run(traitId, excludedId);
        insert.run(excludedId, traitId);
      }
    });
    tx();

    return this.getById(traitId);
  }

  static assign(characterId: number, traitId: number): void {
    const db = getDb();
    const check = db
      .prepare(
        `
      SELECT c.project_id AS cp, ct.project_id AS tp
      FROM characters c
      CROSS JOIN character_traits ct
      WHERE c.id = ? AND ct.id = ?
    `
      )
      .get(characterId, traitId) as { cp: number; tp: number } | undefined;
    if (!check) throw new NotFoundError('Character or trait');
    if (check.cp !== check.tp) {
      throw new BadRequestError('Trait does not belong to the same project as the character');
    }

    const conflict = db
      .prepare(
        `
        SELECT cta.trait_id AS assigned_trait_id
        FROM character_trait_assignments cta
        LEFT JOIN character_trait_exclusions e1
          ON e1.trait_id = cta.trait_id AND e1.excluded_trait_id = ?
        LEFT JOIN character_trait_exclusions e2
          ON e2.trait_id = ? AND e2.excluded_trait_id = cta.trait_id
        WHERE cta.character_id = ?
          AND (e1.trait_id IS NOT NULL OR e2.trait_id IS NOT NULL)
        LIMIT 1
      `
      )
      .get(traitId, traitId, characterId) as { assigned_trait_id: number } | undefined;
    if (conflict) {
      throw new BadRequestError('Trait conflicts with already assigned trait');
    }

    db.prepare(
      `
      INSERT OR IGNORE INTO character_trait_assignments (character_id, trait_id) VALUES (?, ?)
    `
    ).run(characterId, traitId);
  }

  static unassign(characterId: number, traitId: number): void {
    const db = getDb();
    db.prepare(
      `
      DELETE FROM character_trait_assignments WHERE character_id = ? AND trait_id = ?
    `
    ).run(characterId, traitId);
  }

  static create(data: CreateCharacterTrait): CharacterTrait {
    this.seedPredefined(data.projectId);
    const db = getDb();
    const maxSort =
      (db
        .prepare(`SELECT COALESCE(MAX(sort_order), 0) AS m FROM character_traits WHERE project_id = ?`)
        .get(data.projectId) as { m: number })?.m ?? 0;
    const result = db
      .prepare(
        `
      INSERT INTO character_traits (project_id, name, description, image_path, is_predefined, sort_order)
      VALUES (?, ?, ?, ?, 0, ?)
    `
      )
      .run(
        data.projectId,
        data.name,
        data.description ?? '',
        data.imagePath ?? '',
        maxSort + 1
      );
    const id = result.lastInsertRowid as number;
    const created = this.getById(id);
    if (data.excludedIds && data.excludedIds.length > 0) {
      return this.setExclusions(created.id, data.excludedIds);
    }
    return created;
  }

  static delete(id: number): void {
    const db = getDb();
    const row = db.prepare(`SELECT is_predefined FROM character_traits WHERE id = ?`).get(id) as
      | { is_predefined: number }
      | undefined;
    if (!row) throw new NotFoundError('Trait');
    if (row.is_predefined === 1) throw new BadRequestError('Cannot delete predefined trait');
    db.prepare(`DELETE FROM character_traits WHERE id = ?`).run(id);
  }
}
