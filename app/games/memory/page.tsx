"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGameSave, setGameSave } from "../../../lib/save";

type MemorySave = {
  wins?: number;
  bestTimeMs?: number; // lower is better
};

const GAME_ID = "memory";

// 8 pairs = 16 cards
const EMOJIS = ["🍎", "🍌", "🍇", "🍓", "🍒", "🍍", "🥝", "🍉"];

type Card = {
  id: string;
  face: string;
  matched: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck(): Card[] {
  const pairs = EMOJIS.flatMap((e) => [e, e]);
  const shuffled = shuffle(pairs);
  return shuffled.map((face, idx) => ({
    id: `${face}-${idx}-${Math.random().toString(16).slice(2)}`,
    face,
    matched: false,
  }));
}

export default function MemoryMatch() {
  const [ready, setReady] = useState(false);

  // saved progress
  const [wins, setWins] = useState(0);
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(null);

  // game state
  const [deck, setDeck] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]); // indexes currently flipped
  const [moves, setMoves] = useState(0);

  // timer
  const [running, setRunning] = useState(false);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Load saved progress + make deck ONLY on the client (avoids hydration mismatch)
  useEffect(() => {
    (async () => {
      const s = await getGameSave<MemorySave>(GAME_ID);
      setWins(s.wins ?? 0);
      setBestTimeMs(typeof s.bestTimeMs === "number" ? s.bestTimeMs : null);

      setDeck(makeDeck());
      setReady(true);
    })();
  }, []);

  // Timer tick while running
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNowMs(Date.now()), 100);
    return () => clearInterval(t);
  }, [running]);

  // Persist progress whenever it changes (after ready)
  useEffect(() => {
    if (!ready) return;
    (async () => {
      await setGameSave(GAME_ID, {
        wins,
        bestTimeMs: bestTimeMs ?? undefined,
      });
    })();
  }, [wins, bestTimeMs, ready]);

  const elapsedMs =
    running && startMs !== null ? Math.max(0, nowMs - startMs) : 0;

  const elapsedLabel =
    startMs === null ? "0.0s" : `${Math.round((elapsedMs / 1000) * 10) / 10}s`;

  const bestLabel =
    bestTimeMs === null ? "—" : `${Math.round((bestTimeMs / 1000) * 10) / 10}s`;

  function startIfNeeded() {
    if (!running) {
      setRunning(true);
      setStartMs(Date.now());
      setNowMs(Date.now());
    }
  }

  function resetRound() {
    setDeck(makeDeck());
    setFlipped([]);
    setMoves(0);
    setRunning(false);
    setStartMs(null);
    setNowMs(Date.now());
  }

  async function resetProgress() {
    setWins(0);
    setBestTimeMs(null);
    await setGameSave(GAME_ID, { wins: 0, bestTimeMs: undefined });
  }

  function isShowing(i: number) {
    return flipped.includes(i) || deck[i]?.matched;
  }

  function onCardClick(i: number) {
    if (!ready) return;
    if (deck[i]?.matched) return;
    if (flipped.includes(i)) return;
    if (flipped.length === 2) return;

    startIfNeeded();

    const next = [...flipped, i];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);

      const [a, b] = next;
      const same = deck[a].face === deck[b].face;

      if (same) {
        // mark matched
        setDeck((d) => {
          const nd = [...d];
          nd[a] = { ...nd[a], matched: true };
          nd[b] = { ...nd[b], matched: true };
          return nd;
        });

        // clear flipped quickly
        setTimeout(() => setFlipped([]), 350);

        // check win
        setTimeout(() => {
          const allMatched = deck.every((c, idx) => {
            if (idx === a || idx === b) return true;
            return c.matched;
          });

          if (allMatched && startMs !== null) {
            const finishMs = Date.now() - startMs;
            setRunning(false);

            setWins((w) => w + 1);
            setBestTimeMs((best) =>
              best === null ? finishMs : Math.min(best, finishMs)
            );
          }
        }, 10);
      } else {
        // flip back
        setTimeout(() => setFlipped([]), 750);
      }
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Memory Match</h1>
        <Link className="text-blue-600 hover:underline" href="/">
          ← Back
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border p-5 lg:col-span-1">
          <div className="text-slate-600">Round</div>

          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Time</div>
              <div className="mt-1 text-xl font-semibold">
                {startMs === null ? "—" : elapsedLabel}
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Moves</div>
              <div className="mt-1 text-xl font-semibold">{moves}</div>
            </div>
          </div>

          <button
            onClick={resetRound}
            className="mt-4 w-full rounded-2xl bg-black px-4 py-3 text-white font-semibold active:scale-[0.99]"
          >
            New round
          </button>

          <div className="mt-6 border-t pt-5">
            <div className="text-slate-600">Saved progress (this device)</div>

            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border p-3">
                <div className="text-slate-500">Best time</div>
                <div className="mt-1 text-xl font-semibold">{bestLabel}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-slate-500">Wins</div>
                <div className="mt-1 text-xl font-semibold">{wins}</div>
              </div>
            </div>

            <button
              onClick={resetProgress}
              className="mt-4 w-full rounded-2xl border px-4 py-3 font-medium hover:bg-slate-50"
            >
              Reset saved progress
            </button>

            <p className="mt-3 text-sm text-slate-500">
              Tip: the timer starts on your first flip.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border p-5 lg:col-span-2">
          <div className="text-slate-600">Match all pairs</div>

          {!ready ? (
            <div className="mt-6 text-slate-500">Loading deck…</div>
          ) : (
            <div className="mt-6 grid grid-cols-4 gap-3">
              {deck.map((card, i) => {
                const showing = isShowing(i);
                return (
                  <button
                    key={card.id}
                    onClick={() => onCardClick(i)}
                    className="aspect-square rounded-2xl border text-3xl font-semibold hover:bg-slate-50 active:scale-[0.99] flex items-center justify-center"
                    aria-label="card"
                  >
                    {showing ? card.face : " "}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
