import { get, set } from "idb-keyval";

type GameSave = Record<string, any>;

export type SaveData = {
  version: number;
  global: {
    totalSiteLoads: number;
  };
  games: Record<string, GameSave>;
};

const KEY = "arcade_save_v1";

const defaultSave: SaveData = {
  version: 1,
  global: { totalSiteLoads: 0 },
  games: {},
};

// ---------- helpers ----------

function safeParse(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------- core ----------

export async function loadSave(): Promise<SaveData> {
  // 1) Try IndexedDB first
  const dbSave = await get<SaveData>(KEY);
  if (dbSave) return { ...defaultSave, ...dbSave };

  // 2) Fallback: migrate from localStorage if present
  if (typeof window !== "undefined") {
    const local = safeParse(localStorage.getItem(KEY));
    if (local) {
      await set(KEY, local);
      return { ...defaultSave, ...local };
    }
  }

  // 3) Default
  return defaultSave;
}

export async function writeSave(save: SaveData) {
  await set(KEY, save);
}

// ---------- convenience ----------

export async function bumpSiteLoads() {
  const save = await loadSave();
  save.global.totalSiteLoads += 1;
  await writeSave(save);
}

export async function getGameSave<T extends GameSave = GameSave>(
  gameId: string
): Promise<T> {
  const save = await loadSave();
  return (save.games[gameId] ?? {}) as T;
}

export async function setGameSave(gameId: string, patch: GameSave) {
  const save = await loadSave();
  save.games[gameId] = { ...(save.games[gameId] ?? {}), ...patch };
  await writeSave(save);
}
