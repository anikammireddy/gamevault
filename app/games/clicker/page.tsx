"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGameSave, setGameSave } from "../../../lib/save";

type ClickerSave = { highScore?: number };
const GAME_ID = "clicker";

export default function ClickerGame() {
  const [ready, setReady] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    (async () => {
      const game = await getGameSave<ClickerSave>(GAME_ID);
      setHighScore(game.highScore ?? 0);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      await setGameSave(GAME_ID, { highScore });
    })();
  }, [highScore, ready]);

  function click() {
    const next = score + 1;
    setScore(next);
    if (next > highScore) setHighScore(next);
  }

  function resetRun() {
    setScore(0);
  }

  async function resetHigh() {
    setScore(0);
    setHighScore(0);
    await setGameSave(GAME_ID, { highScore: 0 });
  }

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clicker</h1>
        <Link className="text-blue-600 hover:underline" href="/">
          ← Back
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <div className="text-slate-600">Score</div>
          <div className="mt-2 text-5xl font-bold">{score}</div>

          <button
            onClick={click}
            className="mt-6 w-full rounded-2xl bg-black px-4 py-4 text-white text-xl font-semibold active:scale-[0.99]"
          >
            CLICK
          </button>

          <button
            onClick={resetRun}
            className="mt-3 w-full rounded-2xl border px-4 py-3 font-medium hover:bg-slate-50"
          >
            Reset run
          </button>
        </div>

        <div className="rounded-2xl border p-6">
          <div className="text-slate-600">High score (saved on this device)</div>
          <div className="mt-2 text-5xl font-bold">{ready ? highScore : "—"}</div>

          <button
            onClick={resetHigh}
            className="mt-6 w-full rounded-2xl border px-4 py-3 font-medium hover:bg-slate-50"
          >
            Reset high score
          </button>

          <p className="mt-4 text-slate-600">
            Test: set a high score, refresh — it should stay.
          </p>
        </div>
      </div>
    </main>
  );
}
