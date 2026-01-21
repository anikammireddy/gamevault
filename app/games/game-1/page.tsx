"use client";

import { useEffect, useMemo, useState } from "react";
import { get, set } from "idb-keyval";

type SaveData = {
  clicks: number;
  best: number;
  updatedAt: number;
};

const SAVE_KEY = "gamevault:clicker:v1";

export default function ClickerGame() {
  const [clicks, setClicks] = useState(0);
  const [best, setBest] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Load save (per device/browser)
  useEffect(() => {
    (async () => {
      try {
        const data = (await get(SAVE_KEY)) as SaveData | undefined;
        if (data) {
          setClicks(data.clicks ?? 0);
          setBest(data.best ?? 0);
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Save whenever state changes (after initial load)
  useEffect(() => {
    if (!loaded) return;
    const data: SaveData = {
      clicks,
      best,
      updatedAt: Date.now(),
    };
    set(SAVE_KEY, data);
  }, [clicks, best, loaded]);

  const onClick = () => {
    const next = clicks + 1;
    setClicks(next);
    if (next > best) setBest(next);
  };

  const reset = async () => {
    setClicks(0);
    // keep best, or reset both—your choice; for now keep best
    await set(SAVE_KEY, { clicks: 0, best, updatedAt: Date.now() } satisfies SaveData);
  };

  const statusText = useMemo(() => {
    if (!loaded) return "Loading save…";
    return "Progress saves automatically on this device (no login).";
  }, [loaded]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Clicker</h1>
        <p className="mt-2 text-sm opacity-80">{statusText}</p>

        <div className="mt-8 rounded-2xl border border-black/20 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm opacity-70">Clicks</div>
              <div className="text-5xl font-extrabold">{clicks}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-70">Best</div>
              <div className="text-3xl font-bold">{best}</div>
            </div>
          </div>

          <button
            onClick={onClick}
            className="mt-6 w-full rounded-2xl border-2 border-black bg-white px-4 py-4 text-xl font-semibold active:translate-y-[1px]"
          >
            Tap me
          </button>

          <button
            onClick={reset}
            className="mt-3 w-full rounded-2xl border border-black/30 bg-white px-4 py-3 text-sm opacity-80 hover:opacity-100"
          >
            Reset clicks (keeps best)
          </button>
        </div>
      </div>
    </main>
  );
}
