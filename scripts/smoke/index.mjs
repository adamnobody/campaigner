import pc from 'picocolors';
import { API_BASE, logError } from './lib.mjs';
import { createSmokeContext } from './context.mjs';
import { cleanup } from './cleanup.mjs';

import { smokeHealth } from './scenarios/health.mjs';
import { smokeProjects } from './scenarios/projects.mjs';
import { smokeTags } from './scenarios/tags.mjs';
import { smokeCharacters, smokeCharacterRelationships } from './scenarios/characters.mjs';
import { smokeNotes } from './scenarios/notes.mjs';
import { smokeWiki } from './scenarios/wiki.mjs';
import { smokeTimeline, smokeTimelineReorder } from './scenarios/timeline.mjs';
import { smokeDogmas, smokeDogmaReorder } from './scenarios/dogmas.mjs';
import { smokeSearch } from './scenarios/search.mjs';
import {
  smokeFactions,
  smokeFactionRanks,
  smokeFactionMembers,
  smokeFactionRelations,
} from './scenarios/factions.mjs';
import { smokeDynasties } from './scenarios/dynasties.mjs';

async function main() {
  const ctx = createSmokeContext();

  console.log(pc.bold(pc.magenta('\nCampaigner Smoke Test')));
  console.log(pc.dim(`API: ${API_BASE}\n`));

  try {
    await smokeHealth();
    await smokeProjects(ctx);
    await smokeTags(ctx);
    await smokeCharacters(ctx);
    await smokeCharacterRelationships(ctx);
    await smokeNotes(ctx);
    await smokeWiki(ctx);
    await smokeTimeline(ctx);
    await smokeTimelineReorder(ctx);
    await smokeDogmas(ctx);
    await smokeDogmaReorder(ctx);
    await smokeSearch(ctx);
    await smokeFactions(ctx);
    await smokeFactionRanks(ctx);
    await smokeFactionMembers(ctx);
    await smokeFactionRelations(ctx);
    await smokeDynasties(ctx);

    console.log(pc.green(pc.bold('\n✔ Smoke test passed\n')));
    process.exitCode = 0;
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    try {
      await cleanup(ctx);
    } catch (cleanupError) {
      logError(`Cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
  }
}

main();