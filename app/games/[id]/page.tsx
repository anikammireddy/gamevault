import { GAMES } from "../../../lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default function PlaceholderGamePage() {
  return <main className="min-h-screen bg-gray-300" />;
}
