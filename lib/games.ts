export const GAMES = [
  { id: "game-1", name: "TBD 1" },
  { id: "game-2", name: "TBD 2" },
  { id: "game-3", name: "TBD 3" },
  { id: "game-4", name: "TBD 4" },
  { id: "game-5", name: "TBD 5" },

  { id: "game-6", name: "TBD 6" },
  { id: "game-7", name: "TBD 7" },
  { id: "game-8", name: "TBD 8" },
  { id: "game-9", name: "TBD 9" },
  { id: "game-10", name: "TBD 10" },

  { id: "game-11", name: "TBD 11" },
  { id: "game-12", name: "TBD 12" },
  { id: "game-13", name: "TBD 13" },
  { id: "game-14", name: "TBD 14" },
  { id: "game-15", name: "TBD 15" },
  { id: "game-16", name: "TBD 16" },
  { id: "game-17", name: "TBD 17" },
  { id: "game-18", name: "TBD 18" },
  { id: "game-19", name: "TBD 19" },
  { id: "game-20", name: "TBD 20" },
].map((g) => ({ ...g, href: `/games/${g.id}` }));
