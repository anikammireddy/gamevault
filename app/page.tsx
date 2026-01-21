import Link from "next/link";
import { GAMES } from "../lib/games";

function SearchIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="black" strokeWidth="2.2" />
      <path
        d="M16.5 16.5L21 21"
        stroke="black"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* push content down ~1.5 grid squares (grid is 28px) */}
      <div className="pt-[42px]" />

      {/* 2 gridlines of side padding = 56px */}
      <div className="px-[56px]">
        {/* Search bar row */}
        <div className="mx-auto flex max-w-6xl items-center gap-10">
          {/* bar (solid white) */}
          <div
            className="flex-1 rounded-[6px] border-[3px] border-black py-[18px] text-center text-[44px] font-bold leading-none"
            style={{ backgroundColor: "#ffffff" }}
          >
            [“GameVault”]
          </div>

          {/* icon OUTSIDE the bar */}
          <div className="shrink-0">
            <SearchIcon />
          </div>
        </div>

        {/* Tiles grid */}
        <div className="mx-auto mt-[56px] max-w-6xl">
          <div
            className="grid justify-between"
            style={{
              gridTemplateColumns: "repeat(5, 210px)",
              rowGap: "56px",
            }}
          >
            {GAMES.map((g) => (
              <Link key={g.id} href={g.href} className="block">
                {/* outer card */}
                <div
                  className="h-[235px] w-[210px] rounded-[18px] border border-black"
                  style={{ backgroundColor: "#ffffff" }}
                >

                  {/* header strip (light grey) */}
                  <div className="h-[22px] rounded-t-[18px] border-b border-black bg-[#ededed]" />

                  {/* text */}
                  <div className="px-[26px] pt-[30px] text-[40px] font-bold leading-[1.02] whitespace-pre-line">
                    {g.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
