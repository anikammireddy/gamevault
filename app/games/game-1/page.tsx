"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Player = "X" | "O";
type Cell = Player | null;

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(board: Cell[]): Player | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export default function TicTacToeGame() {
  const router = useRouter(); // ✅ ADD THIS

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>("X");

  const winner = useMemo(() => getWinner(board), [board]);
  const isFull = useMemo(() => board.every(Boolean), [board]);
  const gameOver = Boolean(winner) || isFull;

  const statusText = useMemo(() => {
    if (!gameOver) return `Turn: ${turn}`;
    if (winner) return `${winner} wins! 💙`;
    return "It’s a tie 💙";
  }, [gameOver, winner, turn]);

  const handleClick = (i: number) => {
    if (gameOver || board[i]) return;

    setBoard((prev) => {
      const next = [...prev];
      next[i] = turn;
      return next;
    });
    setTurn(turn === "X" ? "O" : "X");
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start px-6 py-12"
      style={{
        backgroundColor: "#FBCFE8",
      }}
    >
      {/* ✅ BACK BUTTON (add this block) */}
      <div className="w-full max-w-3xl">
        <button
          onClick={() => router.push("/")}
          className="mb-6 rounded-full bg-white/70 px-5 py-2 text-sm font-semibold text-sky-400 shadow-sm hover:bg-white/90 active:translate-y-[1px]"
        >
          ← Back
        </button>
      </div>

      {/* Title */}
      <h1
        className="text-center text-6xl font-bold text-sky-300"
        style={{
          fontFamily: '"Pacifico", cursive',
        }}
      >
        Tic Tac Toe
      </h1>

      {/* Status */}
      <div className="mt-3 text-center text-xl font-semibold text-sky-300">
        {statusText}
      </div>

      {/* Play again button (game over) */}
      {gameOver && (
        <button
          onClick={reset}
          className="mt-4 rounded-full bg-sky-300 px-8 py-3 text-lg font-bold text-pink-100 active:translate-y-[1px]"
        >
          Play again
        </button>
      )}

      {/* Board */}
      <div className="mt-10 flex justify-center">
        <div
          className="grid grid-cols-3 gap-6"
          style={{
            width: "520px",
            maxWidth: "90vw",
          }}
        >
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={gameOver || !!cell}
              className="aspect-square rounded-3xl transition active:translate-y-[1px]"
              style={{
                backgroundColor: cell ? "#7DD3FC" : "#DB2777",
              }}
            >
              <span
                className="flex h-full w-full items-center justify-center text-pink-100 font-extrabold"
                style={{
                  fontSize: "120px",
                  lineHeight: 1,
                  fontFamily:
                    'ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
                }}
              >
                {cell ?? ""}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Restart (during game) */}
      {!gameOver && (
        <button
          onClick={reset}
          className="mt-10 rounded-full bg-white/70 px-6 py-3 text-base font-semibold text-sky-400 active:translate-y-[1px]"
        >
          Restart
        </button>
      )}
    </main>
  );
}
