import type { PersistedState } from '@/types'
import { initialUIState, initialChatSettings } from '@/store/initial-state'

interface Migration {
  version: number
  migrate: (state: PersistedState) => PersistedState
}

const migrations: Migration[] = [
  {
    version: 0,
    migrate: (state) => ({
      ...state,
      ui: { ...initialUIState, ...state.ui }
    })
  },
  {
    version: 1,
    migrate: (state) => ({
      ...state,
      ui: {
        ...state.ui,
        compact_mode: false,
        show_timestamps: true
      }
    })
  },
  {
    version: 2,
    migrate: (state) => ({
      ...state,
      chatSettings: {
        ...state.chatSettings,
        auto_title: true,
        save_history: true
      }
    })
  }
]

export function migrateState(state: PersistedState, fromVersion: number): PersistedState {
  let migratedState = { ...state }
  
  const pendingMigrations = migrations
    .filter(m => m.version > fromVersion)
    .sort((a, b) => a.version - b.version)
  
  for (const migration of pendingMigrations) {
    migratedState = migration.migrate(migratedState)
  }
  
  return migratedState
}
