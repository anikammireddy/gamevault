export const GAMES = [
  { id: "game-1", name: "Flappy\nBird" },
  { id: "game-2", name: "PacMan" },
  { id: "game-3", name: "Tic-\nTac-\nToe" },
  { id: "game-4", name: "2048" },
  { id: "game-5", name: "Snake" },

  { id: "game-6", name: "Connect\nFour" },
  { id: "game-7", name: "Sudoku" },
  { id: "game-8", name: "Stack" },
  { id: "game-9", name: "Block\nBlast" },
  { id: "game-10", name: "Water\nSort" },

  { id: "game-11", name: "Game 11" },
  { id: "game-12", name: "Game 12" },
  { id: "game-13", name: "Game 13" },
  { id: "game-14", name: "Game 14" },
  { id: "game-15", name: "Game 15" },
  { id: "game-16", name: "Game 16" },
  { id: "game-17", name: "Game 17" },
  { id: "game-18", name: "Game 18" },
  { id: "game-19", name: "Game 19" },
  { id: "game-20", name: "Game 20" },
].map((g) => ({ ...g, href: `/games/${g.id}` }));
