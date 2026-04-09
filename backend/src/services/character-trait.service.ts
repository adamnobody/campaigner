import { getDb } from '../db/connection.js';
import type { CharacterTrait, CreateCharacterTrait } from '@campaigner/shared';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';

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
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description ?? '',
    imagePath: row.image_path ?? '',
    isPredefined: row.is_predefined === 1,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CharacterTraitService {
  static seedPredefined(projectId: number): void {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO character_traits (project_id, name, description, image_path, is_predefined, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    PREDEFINED_TRAITS.forEach((t, i) => {
      stmt.run(projectId, t.name, t.description, `/traits/${t.slug}.jpg`, i);
    });
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
    return this.getById(id);
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
