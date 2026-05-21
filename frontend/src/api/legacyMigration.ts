import type {
  LegacyMigrationPreview,
  LegacyMigrationReport,
} from '@/types/generated/bindings';

import { transport } from '@/api/transport';

export const legacyMigrationApi = {
  checkAvailable: async (): Promise<LegacyMigrationPreview | null> => {
    return transport.request<LegacyMigrationPreview | null>({
      command: 'check_legacy_migration_available',
    });
  },

  run: async (): Promise<LegacyMigrationReport> => {
    return transport.request<LegacyMigrationReport>({
      command: 'run_legacy_migration',
    });
  },

  skip: async (): Promise<void> => {
    await transport.request<void>({
      command: 'skip_legacy_migration',
    });
  },
};
