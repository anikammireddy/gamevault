"use client";

import React, { useEffect, useRef } from "react";
import type p5 from "p5";
import { useRouter } from "next/navigation";

type SavedState = {
  guessed: string[]; // lowercased country names
  timerStarted: boolean;
  isPaused: boolean;

  // Timing model that survives tab closes:
  // elapsedMs = pausedElapsedMs + (Date.now() - startWallTimeMs) when running
  pausedElapsedMs: number; // accumulated elapsed while not running
  startWallTimeMs: number; // when running started (Date.now)
  running: boolean; // true when timer is actively running

  bestCount: number; // high score = most countries
  bestCountTimeMs: number;
};

const STORAGE_KEY = "arcade:game-2:name-all-countries:v1";

function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        guessed: [],
        timerStarted: false,
        isPaused: false,
        pausedElapsedMs: 0,
        startWallTimeMs: 0,
        running: false,
        bestCount: 0,
        bestCountTimeMs: 0,
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    return {
      guessed: parsed.guessed ?? [],
      timerStarted: parsed.timerStarted ?? false,
      isPaused: parsed.isPaused ?? false,
      pausedElapsedMs: parsed.pausedElapsedMs ?? 0,
      startWallTimeMs: parsed.startWallTimeMs ?? 0,
      running: parsed.running ?? false,
      bestCount: parsed.bestCount ?? 0,
      bestCountTimeMs: parsed.bestCountTimeMs ?? 0,
    };
  } catch {
    return {
      guessed: [],
      timerStarted: false,
      isPaused: false,
      pausedElapsedMs: 0,
      startWallTimeMs: 0,
      running: false,
      bestCount: 0,
      bestCountTimeMs: 0,
    };
  }
}

function saveState(state: SavedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function Game2CountriesPage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const p5Ref = useRef<p5 | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!hostRef.current) return;

      const initial = loadState();

      // Helper to compute elapsed that "keeps running" across tab closes.
      const getElapsedMs = (s: SavedState) => {
        if (s.running) {
          return s.pausedElapsedMs + (Date.now() - s.startWallTimeMs);
        }
        return s.pausedElapsedMs;
      };

      // ---- GAME DATA ----
      const countryData: Record<string, { continent: string; x: number; y: number }> = {
        // North America
        Canada: { continent: "North America", x: 0.131, y: 0.169 },
        USA: { continent: "North America", x: 0.141, y: 0.315 },
        Mexico: { continent: "North America", x: 0.126, y: 0.408 },
        Belize: { continent: "North America", x: 0.16, y: 0.46 },
        "Costa Rica": { continent: "North America", x: 0.172, y: 0.515 },
        "El Salvador": { continent: "North America", x: 0.158, y: 0.488 },
        Guatemala: { continent: "North America", x: 0.155, y: 0.475 },
        Honduras: { continent: "North America", x: 0.165, y: 0.477 },
        Nicaragua: { continent: "North America", x: 0.169, y: 0.494 },
        Panama: { continent: "North America", x: 0.18, y: 0.528 },
        "Antigua and Barbuda": {
          continent: "North America",
          x: 0.239,
          y: 0.457,
        },
        Bahamas: { continent: "North America", x: 0.204, y: 0.413 },
        Barbados: { continent: "North America", x: 0.242, y: 0.469 },
        Cuba: { continent: "North America", x: 0.194, y: 0.428 },
        Dominica: { continent: "North America", x: 0.239, y: 0.466 },
        "Dominican Republic": {
          continent: "North America",
          x: 0.216,
          y: 0.449,
        },
        Grenada: { continent: "North America", x: 0.238, y: 0.501 },
        Haiti: { continent: "North America", x: 0.209, y: 0.446 },
        Jamaica: { continent: "North America", x: 0.194, y: 0.454 },
        "Saint Kitts and Nevis": {
          continent: "North America",
          x: 0.236,
          y: 0.455,
        },
        "Saint Lucia": { continent: "North America", x: 0.241, y: 0.482 },
        "Saint Vincent and the Grenadines": {
          continent: "North America",
          x: 0.242,
          y: 0.489,
        },
        "Trinidad and Tobago": {
          continent: "North America",
          x: 0.239,
          y: 0.512,
        },

        // South America
        Argentina: { continent: "South America", x: 0.241, y: 0.869 },
        Bolivia: { continent: "South America", x: 0.228, y: 0.72 },
        Brazil: { continent: "South America", x: 0.271, y: 0.678 },
        Chile: { continent: "South America", x: 0.222, y: 0.873 },
        Colombia: { continent: "South America", x: 0.202, y: 0.567 },
        Ecuador: { continent: "South America", x: 0.188, y: 0.597 },
        Guyana: { continent: "South America", x: 0.246, y: 0.569 },
        Paraguay: { continent: "South America", x: 0.249, y: 0.763 },
        Peru: { continent: "South America", x: 0.199, y: 0.68 },
        Suriname: { continent: "South America", x: 0.254, y: 0.562 },
        Uruguay: { continent: "South America", x: 0.264, y: 0.844 },
        Venezuela: { continent: "South America", x: 0.226, y: 0.537 },

        // Europe
        Albania: { continent: "Europe", x: 0.478, y: 0.285 },
        Andorra: { continent: "Europe", x: 0.427, y: 0.27 },
        Austria: { continent: "Europe", x: 0.462, y: 0.231 },
        Belarus: { continent: "Europe", x: 0.496, y: 0.189 },
        Belgium: { continent: "Europe", x: 0.437, y: 0.209 },
        "Bosnia and Herzegovina": { continent: "Europe", x: 0.471, y: 0.257 },
        Bulgaria: { continent: "Europe", x: 0.49, y: 0.269 },
        Croatia: { continent: "Europe", x: 0.464, y: 0.252 },
        Cyprus: { continent: "Europe", x: 0.515, y: 0.325 },
        Czechia: { continent: "Europe", x: 0.463, y: 0.216 },
        Denmark: { continent: "Europe", x: 0.449, y: 0.171 },
        Estonia: { continent: "Europe", x: 0.49, y: 0.149 },
        Finland: { continent: "Europe", x: 0.49, y: 0.121 },
        France: { continent: "Europe", x: 0.433, y: 0.234 },
        Germany: { continent: "Europe", x: 0.45, y: 0.207 },
        Greece: { continent: "Europe", x: 0.485, y: 0.307 },
        Hungary: { continent: "Europe", x: 0.475, y: 0.236 },
        Iceland: { continent: "Europe", x: 0.385, y: 0.111 },
        Ireland: { continent: "Europe", x: 0.406, y: 0.189 },
        Italy: { continent: "Europe", x: 0.459, y: 0.272 },
        Kosovo: { continent: "Europe", x: 0.479, y: 0.27 },
        Latvia: { continent: "Europe", x: 0.49, y: 0.164 },
        Liechtenstein: { continent: "Europe", x: 0.449, y: 0.236 },
        Lithuania: { continent: "Europe", x: 0.486, y: 0.175 },
        Luxembourg: { continent: "Europe", x: 0.44, y: 0.215 },
        Malta: { continent: "Europe", x: 0.462, y: 0.319 },
        Moldova: { continent: "Europe", x: 0.499, y: 0.235 },
        Monaco: { continent: "Europe", x: 0.443, y: 0.26 },
        Montenegro: { continent: "Europe", x: 0.475, y: 0.267 },
        Netherlands: { continent: "Europe", x: 0.44, y: 0.195 },
        "North Macedonia": { continent: "Europe", x: 0.482, y: 0.276 },
        Norway: { continent: "Europe", x: 0.449, y: 0.135 },
        Poland: { continent: "Europe", x: 0.474, y: 0.197 },
        Portugal: { continent: "Europe", x: 0.401, y: 0.284 },
        Romania: { continent: "Europe", x: 0.49, y: 0.245 },
        Russia: { continent: "Europe", x: 0.592, y: 0.139 },
        "San Marino": { continent: "Europe", x: 0.457, y: 0.26 },
        Serbia: { continent: "Europe", x: 0.479, y: 0.257 },
        Slovakia: { continent: "Europe", x: 0.473, y: 0.226 },
        Slovenia: { continent: "Europe", x: 0.463, y: 0.244 },
        Spain: { continent: "Europe", x: 0.414, y: 0.289 },
        Sweden: { continent: "Europe", x: 0.462, y: 0.148 },
        Switzerland: { continent: "Europe", x: 0.444, y: 0.237 },
        Turkey: { continent: "Europe", x: 0.519, y: 0.295 },
        Ukraine: { continent: "Europe", x: 0.509, y: 0.221 },
        "United Kingdom": { continent: "Europe", x: 0.421, y: 0.196 },
        "Vatican City": { continent: "Europe", x: 0.459, y: 0.279 },

        // Africa
        Algeria: { continent: "Africa", x: 0.429, y: 0.384 },
        Angola: { continent: "Africa", x: 0.471, y: 0.688 },
        Benin: { continent: "Africa", x: 0.427, y: 0.51 },
        Botswana: { continent: "Africa", x: 0.491, y: 0.761 },
        "Burkina Faso": { continent: "Africa", x: 0.416, y: 0.495 },
        Burundi: { continent: "Africa", x: 0.509, y: 0.617 },
        "Cabo Verde": { continent: "Africa", x: 0.354, y: 0.462 },
        Cameroon: { continent: "Africa", x: 0.456, y: 0.557 },
        "Central African Republic": { continent: "Africa", x: 0.484, y: 0.54 },
        Chad: { continent: "Africa", x: 0.476, y: 0.478 },
        Comoros: { continent: "Africa", x: 0.551, y: 0.692 },
        Congo: { continent: "Africa", x: 0.467, y: 0.592 },
        "Democratic Republic of the Congo": { continent: "Africa", x: 0.489, y: 0.609 },
        "Ivory Coast": { continent: "Africa", x: 0.404, y: 0.535 },
        Djibouti: { continent: "Africa", x: 0.546, y: 0.503 },
        Egypt: { continent: "Africa", x: 0.504, y: 0.393 },
        "Equatorial Guinea": { continent: "Africa", x: 0.451, y: 0.579 },
        Eritrea: { continent: "Africa", x: 0.533, y: 0.471 },
        Eswatini: { continent: "Africa", x: 0.512, y: 0.792 },
        Ethiopia: { continent: "Africa", x: 0.537, y: 0.53 },
        Gabon: { continent: "Africa", x: 0.454, y: 0.594 },
        Gambia: { continent: "Africa", x: 0.376, y: 0.489 },
        Ghana: { continent: "Africa", x: 0.415, y: 0.535 },
        Guinea: { continent: "Africa", x: 0.387, y: 0.509 },
        "Guinea-Bissau": { continent: "Africa", x: 0.377, y: 0.501 },
        Kenya: { continent: "Africa", x: 0.532, y: 0.59 },
        Lesotho: { continent: "Africa", x: 0.502, y: 0.814 },
        Liberia: { continent: "Africa", x: 0.392, y: 0.541 },
        Libya: { continent: "Africa", x: 0.476, y: 0.391 },
        Madagascar: { continent: "Africa", x: 0.557, y: 0.737 },
        Malawi: { continent: "Africa", x: 0.52, y: 0.695 },
        Mali: { continent: "Africa", x: 0.415, y: 0.451 },
        Mauritania: { continent: "Africa", x: 0.39, y: 0.448 },
        Mauritius: { continent: "Africa", x: 0.57, y: 0.759 },
        Morocco: { continent: "Africa", x: 0.406, y: 0.351 },
        Mozambique: { continent: "Africa", x: 0.534, y: 0.698 },
        Namibia: { continent: "Africa", x: 0.471, y: 0.766 },
        Niger: { continent: "Africa", x: 0.451, y: 0.464 },
        Nigeria: { continent: "Africa", x: 0.446, y: 0.523 },
        Rwanda: { continent: "Africa", x: 0.508, y: 0.606 },
        "Republic of Congo": { continent: "Africa", x: 0.467, y: 0.594 },
        "Sao Tome and Principe": { continent: "Africa", x: 0.443, y: 0.579 },
        Senegal: { continent: "Africa", x: 0.376, y: 0.474 },
        Seychelles: { continent: "Africa", x: 0.57, y: 0.589 },
        "Sierra Leone": { continent: "Africa", x: 0.385, y: 0.527 },
        Somalia: { continent: "Africa", x: 0.549, y: 0.574 },
        "South Africa": { continent: "Africa", x: 0.486, y: 0.821 },
        "South Sudan": { continent: "Africa", x: 0.512, y: 0.541 },
        Sudan: { continent: "Africa", x: 0.511, y: 0.461 },
        Tanzania: { continent: "Africa", x: 0.522, y: 0.645 },
        Togo: { continent: "Africa", x: 0.424, y: 0.531 },
        Tunisia: { continent: "Africa", x: 0.447, y: 0.335 },
        Uganda: { continent: "Africa", x: 0.517, y: 0.579 },
        Zambia: { continent: "Africa", x: 0.496, y: 0.703 },
        Zimbabwe: { continent: "Africa", x: 0.508, y: 0.738 },

        // Asia
        Afghanistan: { continent: "Asia", x: 0.607, y: 0.338 },
        Armenia: { continent: "Asia", x: 0.545, y: 0.285 },
        Azerbaijan: { continent: "Asia", x: 0.553, y: 0.285 },
        Bahrain: { continent: "Asia", x: 0.567, y: 0.395 },
        Bangladesh: { continent: "Asia", x: 0.681, y: 0.408 },
        Bhutan: { continent: "Asia", x: 0.68, y: 0.383 },
        Brunei: { continent: "Asia", x: 0.76, y: 0.557 },
        Cambodia: { continent: "Asia", x: 0.729, y: 0.496 },
        China: { continent: "Asia", x: 0.717, y: 0.332 },
        Georgia: { continent: "Asia", x: 0.54, y: 0.272 },
        India: { continent: "Asia", x: 0.65, y: 0.423 },
        Indonesia: { continent: "Asia", x: 0.738, y: 0.642 },
        Iran: { continent: "Asia", x: 0.575, y: 0.342 },
        Iraq: { continent: "Asia", x: 0.545, y: 0.342 },
        Israel: { continent: "Asia", x: 0.521, y: 0.343 },
        Japan: { continent: "Asia", x: 0.808, y: 0.319 },
        Jordan: { continent: "Asia", x: 0.525, y: 0.359 },
        Kazakhstan: { continent: "Asia", x: 0.603, y: 0.225 },
        Kuwait: { continent: "Asia", x: 0.557, y: 0.369 },
        Kyrgyzstan: { continent: "Asia", x: 0.627, y: 0.273 },
        Laos: { continent: "Asia", x: 0.719, y: 0.44 },
        Lebanon: { continent: "Asia", x: 0.523, y: 0.331 },
        Malaysia: { continent: "Asia", x: 0.757, y: 0.574 },
        Maldives: { continent: "Asia", x: 0.638, y: 0.566 },
        Mongolia: { continent: "Asia", x: 0.692, y: 0.239 },
        Myanmar: { continent: "Asia", x: 0.701, y: 0.426 },
        Nepal: { continent: "Asia", x: 0.66, y: 0.377 },
        "North Korea": { continent: "Asia", x: 0.769, y: 0.29 },
        Oman: { continent: "Asia", x: 0.586, y: 0.436 },
        Pakistan: { continent: "Asia", x: 0.619, y: 0.367 },
        Palestine: { continent: "Asia", x: 0.52, y: 0.356 },
        Philippines: { continent: "Asia", x: 0.775, y: 0.47 },
        Qatar: { continent: "Asia", x: 0.569, y: 0.401 },
        "Saudi Arabia": { continent: "Asia", x: 0.547, y: 0.416 },
        Singapore: { continent: "Asia", x: 0.73, y: 0.584 },
        "South Korea": { continent: "Asia", x: 0.778, y: 0.315 },
        "Sri Lanka": { continent: "Asia", x: 0.661, y: 0.536 },
        Syria: { continent: "Asia", x: 0.531, y: 0.323 },
        Taiwan: { continent: "Asia", x: 0.771, y: 0.411 },
        Tajikistan: { continent: "Asia", x: 0.622, y: 0.299 },
        Thailand: { continent: "Asia", x: 0.719, y: 0.474 },
        "Timor-Leste": { continent: "Asia", x: 0.793, y: 0.659 },
        Turkmenistan: { continent: "Asia", x: 0.586, y: 0.295 },
        UAE: { continent: "Asia", x: 0.578, y: 0.411 },
        Uzbekistan: { continent: "Asia", x: 0.597, y: 0.28 },
        Vietnam: { continent: "Asia", x: 0.725, y: 0.423 },
        Yemen: { continent: "Asia", x: 0.562, y: 0.471 },

        // Oceania
        Australia: { continent: "Oceania", x: 0.81, y: 0.788 },
        "Papua New Guinea": { continent: "Oceania", x: 0.846, y: 0.635 },
        "New Zealand": { continent: "Oceania", x: 0.889, y: 0.914 },
        Fiji: { continent: "Oceania", x: 0.944, y: 0.722 },
        "Solomon Islands": { continent: "Oceania", x: 0.891, y: 0.654 },
        Micronesia: { continent: "Oceania", x: 0.871, y: 0.535 },
        Vanuatu: { continent: "Oceania", x: 0.912, y: 0.707 },
        Samoa: { continent: "Oceania", x: 0.951, y: 0.662 },
        Kiribati: { continent: "Oceania", x: 0.935, y: 0.591 },
        Tonga: { continent: "Oceania", x: 0.962, y: 0.733 },
        "Marshall Islands": { continent: "Oceania", x: 0.92, y: 0.527 },
        Palau: { continent: "Oceania", x: 0.818, y: 0.534 },
        Tuvalu: { continent: "Oceania", x: 0.921, y: 0.639 },
        Nauru: { continent: "Oceania", x: 0.913, y: 0.605 },
      };

      // Load p5 on the client only
      const P5 = (await import("p5")).default;
      if (!mounted || !hostRef.current) return;

      const sketch = (p: p5) => {
        const continentData: Record<string, string[]> = {
          "North America": [],
          "South America": [],
          Europe: [],
          Africa: [],
          Asia: [],
          Oceania: [],
        };

        let guessedCountries = new Set<string>(initial.guessed);
        let worldMap: p5.Image | undefined;

        // HTML UI elements (no p5.dom)
        let inputEl!: HTMLInputElement;
        let pauseBtn!: HTMLButtonElement;
        let restartBtn!: HTMLButtonElement;
        let backBtn!: HTMLButtonElement;

        let messageText = "";
        let messageColor: p5.Color;
        let messageTimer = 0;

        let state: SavedState = initial;

        let mapY = 120;
        let continentListY = 0;
        let mapHeight = 0;

        const setRunning = (running: boolean) => {
          if (running === state.running) return;

          if (running) {
            state.startWallTimeMs = Date.now();
            state.running = true;
          } else {
            state.pausedElapsedMs = getElapsedMs(state);
            state.running = false;
            state.startWallTimeMs = 0;
          }
          saveState(state);
        };

        const pauseIfHidden = () => {
          if (
            document.visibilityState === "hidden" &&
            state.running &&
            !state.isPaused
          ) {
            setRunning(false);
          }
        };

        const stopTimerIfRunning = () => {
          if (state.running) setRunning(false);
        };


        p.setup = () => {
          p.createCanvas(1400, 2400);

          p.loadImage(
            "/eflyj4550khe1.jpeg",
            (img) => { worldMap = img; },
            () => { worldMap = undefined; }
          );

          // populate continents
          Object.keys(countryData).forEach((country) => {
            const cont = countryData[country].continent;
            continentData[cont].push(country);
          });
          Object.keys(continentData).forEach((c) => continentData[c].sort());

          // pause when hidden / closing
          document.addEventListener("visibilitychange", pauseIfHidden);
          window.addEventListener("beforeunload", pauseIfHidden);

          // ===== HTML UI (overlay) =====
          const host = hostRef.current!;
          host.style.position = "relative";

          // Back button
          backBtn = document.createElement("button");
          backBtn.textContent = "← Back";
          Object.assign(backBtn.style, {
            position: "absolute",
            left: "20px",
            top: "80px",
            width: "80px",
            height: "35px",
            fontSize: "16px",
            fontWeight: "600",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            zIndex: "10",
          } as CSSStyleDeclaration);
          host.appendChild(backBtn);

          backBtn.addEventListener("click", () => {
            stopTimerIfRunning();
            router.push("/");
          });


          // Input
          inputEl = document.createElement("input");
          inputEl.type = "text";
          inputEl.placeholder = "Type a country name...";
          Object.assign(inputEl.style, {
            position: "absolute",
            left: "20px",
            top: "20px",
            width: "400px",
            height: "40px",
            fontSize: "18px",
            padding: "10px",
            border: "3px solid #FFD700",
            borderRadius: "8px",
            outline: "none",
            background: "white",
          } as CSSStyleDeclaration);
          host.appendChild(inputEl);

          // Buttons
          const btnW = 120;
          const gap = 10;

          restartBtn = document.createElement("button");
          restartBtn.textContent = "↻ Restart";
          Object.assign(restartBtn.style, {
            position: "absolute",
            top: "20px",
            left: `${1400 - btnW * 2 - gap - 20}px`,
            width: `${btnW}px`,
            height: "40px",
            fontSize: "16px",
            fontWeight: "700",
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          } as CSSStyleDeclaration);
          host.appendChild(restartBtn);

          pauseBtn = document.createElement("button");
          pauseBtn.textContent = state.isPaused ? "▶ Resume" : "⏸ Pause";
          Object.assign(pauseBtn.style, {
            position: "absolute",
            top: "20px",
            left: `${1400 - btnW - 20}px`,
            width: `${btnW}px`,
            height: "40px",
            fontSize: "16px",
            fontWeight: "700",
            backgroundColor: state.isPaused ? "#27ae60" : "#3498db",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          } as CSSStyleDeclaration);
          host.appendChild(pauseBtn);

          // Start timer on first typing
          inputEl.addEventListener("input", () => {
            const val = inputEl.value.trim();
            if (!state.timerStarted && !state.isPaused && val.length > 0) {
              state.timerStarted = true;
              saveState(state);
              setRunning(true);
            }
          });

          // Enter key guesses
          inputEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleGuess();
          });

          pauseBtn.addEventListener("click", togglePause);
          restartBtn.addEventListener("click", restartGame);

          if (state.isPaused) inputEl.disabled = true;

          // Auto-resume timer when reopening the page (if it had started and isn't paused)
          if (state.timerStarted && !state.isPaused && !state.running) {
            setRunning(true);
          }

          // Ensure cleanup when p5 removes
          const originalRemove = (p as any).remove?.bind(p);
          (p as any).remove = () => {
            stopTimerIfRunning();
            document.removeEventListener("visibilitychange", pauseIfHidden);
            window.removeEventListener("beforeunload", pauseIfHidden);

            inputEl?.remove();
            pauseBtn?.remove();
            restartBtn?.remove();
            backBtn?.remove();

            if (originalRemove) originalRemove();
          };


        };

        p.draw = () => {
          p.background(30, 60, 114);

          const elapsedMs = state.timerStarted ? getElapsedMs(state) : 0;

          // Title
          p.textAlign(p.CENTER);
          p.fill(255, 215, 0);
          p.textSize(36);
          p.textStyle(p.BOLD);
          p.text("🌍 NAME ALL COUNTRIES 🌎", p.width / 2, 50);

          // Timer (top-right)
          p.textAlign(p.RIGHT);
          p.fill(255, 215, 0);
          p.textSize(28);
          p.textStyle(p.BOLD);
          const btnW = 120;
          const gap = 10;
          const rightPad = 20;
          const timerX = p.width - btnW * 2 - gap - rightPad - 10;
          p.text(formatTime(elapsedMs), timerX, 50);

          if (state.bestCount > 0) {
            p.textSize(16);
            p.textStyle(p.NORMAL);
            p.text(
              `Best: ${state.bestCount} in ${formatTime(state.bestCountTimeMs)}`,
              timerX,
              75
            );
          }

          // Counter
          p.textAlign(p.CENTER);
          p.fill(255, 215, 0);
          p.textSize(28);
          p.textStyle(p.BOLD);
          p.text(
            `${guessedCountries.size} / ${Object.keys(countryData).length}`,
            p.width / 2,
            90
          );

          // Map
          if (worldMap) {
            const mapWidth = p.width - 40;
            mapHeight = mapWidth * (worldMap.height / worldMap.width);
            p.image(worldMap, 20, mapY, mapWidth, mapHeight);
            drawStars(mapWidth, mapHeight);
            continentListY = mapY + mapHeight + 20;
          } else {
            p.fill(100, 150, 200);
            mapHeight = 500;
            p.rect(20, mapY, p.width - 40, mapHeight);
            p.fill(255);
            p.textSize(20);
            p.text(
              "Put your world map image in public/eflyj4550khe1.jpeg",
              p.width / 2,
              mapY + 250
            );
            drawStars(p.width - 40, mapHeight);
            continentListY = mapY + mapHeight + 20;
          }

          // Message
          if (messageTimer > 0) {
            p.fill(messageColor);
            p.textSize(20);
            p.textAlign(p.CENTER);
            p.text(messageText, p.width / 2, 105);
            messageTimer--;
          }

          drawContinentLists();
        };

        function drawStars(mapWidth: number, mapHeight: number) {
          Object.keys(countryData).forEach((country) => {
            if (!guessedCountries.has(country.toLowerCase())) {
              const data = countryData[country];
              const x = 20 + data.x * mapWidth;
              const y = mapY + data.y * mapHeight;
              drawStar(x, y, 1.5, 3, 5);
            }
          });
        }

        function drawStar(
          x: number,
          y: number,
          radius1: number,
          radius2: number,
          npoints: number
        ) {
          p.push();
          p.translate(x, y);

          const pulse = 1 + Math.sin(p.frameCount * 0.1) * 0.15;
          p.scale(pulse);

          // glow
          p.fill(255, 215, 0, 80);
          p.noStroke();
          const angle = p.TWO_PI / npoints;
          const halfAngle = angle / 2.0;
          p.beginShape();
          for (
            let a = -p.PI / 2;
            a < p.TWO_PI - p.PI / 2;
            a += angle
          ) {
            let sx = Math.cos(a) * (radius2 + 3);
            let sy = Math.sin(a) * (radius2 + 3);
            p.vertex(sx, sy);
            sx = Math.cos(a + halfAngle) * (radius1 + 3);
            sy = Math.sin(a + halfAngle) * (radius1 + 3);
            p.vertex(sx, sy);
          }
          p.endShape(p.CLOSE);

          // star
          p.fill(255, 215, 0);
          p.stroke(255, 165, 0);
          p.strokeWeight(1.5);
          p.beginShape();
          for (
            let a = -p.PI / 2;
            a < p.TWO_PI - p.PI / 2;
            a += angle
          ) {
            let sx = Math.cos(a) * radius2;
            let sy = Math.sin(a) * radius2;
            p.vertex(sx, sy);
            sx = Math.cos(a + halfAngle) * radius1;
            sy = Math.sin(a + halfAngle) * radius1;
            p.vertex(sx, sy);
          }
          p.endShape(p.CLOSE);

          p.pop();
        }

        function showMessage(text: string, col: p5.Color) {
          messageText = text;
          messageColor = col;
          messageTimer = 60;
        }

        function handleGuess() {
          if (state.isPaused) return;

          const guess = inputEl.value.trim();
          if (!guess) return;

          const normalizedGuess = guess.toLowerCase();

          if (guessedCountries.has(normalizedGuess)) {
            showMessage("Already guessed!", p.color(241, 196, 15));
            inputEl.value = "";
            return;
          }

          let foundCountry: string | null = null;
          for (const country of Object.keys(countryData)) {
            if (country.toLowerCase() === normalizedGuess) {
              foundCountry = country;
              break;
            }
          }

          if (foundCountry) {
            guessedCountries.add(normalizedGuess);
            state.guessed = Array.from(guessedCountries);
            saveState(state);

            const countNow = guessedCountries.size;
            const elapsedNow = getElapsedMs(state);

            if (
              countNow > state.bestCount ||
              (countNow === state.bestCount &&
                (state.bestCountTimeMs === 0 ||
                  elapsedNow < state.bestCountTimeMs))
            ) {
              state.bestCount = countNow;
              state.bestCountTimeMs = elapsedNow;
              saveState(state);
            }

            showMessage("✓ " + foundCountry, p.color(46, 204, 113));

            if (guessedCountries.size === Object.keys(countryData).length) {
              setRunning(false);
              setTimeout(() => {
                alert("🎉 Congratulations! You named all countries! 🎉");
              }, 400);
            }
          } else {
            showMessage("Not a valid country", p.color(231, 76, 60));
          }

          inputEl.value = "";
        }

        function togglePause() {
          state.isPaused = !state.isPaused;

          if (state.isPaused) {
            pauseBtn.textContent = "▶ Resume";
            pauseBtn.style.backgroundColor = "#27ae60";
            inputEl.disabled = true;
            if (state.running) setRunning(false);
          } else {
            pauseBtn.textContent = "⏸ Pause";
            pauseBtn.style.backgroundColor = "#3498db";
            inputEl.disabled = false;
            if (state.timerStarted) setRunning(true);
          }

          saveState(state);
        }

        function restartGame() {
          guessedCountries = new Set<string>();
          state.guessed = [];
          state.timerStarted = false;
          state.isPaused = false;
          state.pausedElapsedMs = 0;
          state.startWallTimeMs = 0;
          state.running = false;

          messageText = "";
          messageTimer = 0;

          inputEl.value = "";
          inputEl.disabled = false;
          pauseBtn.textContent = "⏸ Pause";
          pauseBtn.style.backgroundColor = "#3498db";

          saveState(state);
        }

        function drawContinentLists() {
          const startY = continentListY;
          let col = 0;
          let row = 0;
          const boxWidth = (p.width - 80) / 3;
          const boxHeight = 350;
          const gap = 20;

          const continents = Object.keys(continentData);

          continents.forEach((continent) => {
            const x = 20 + col * (boxWidth + gap);
            const y = startY + row * (boxHeight + gap);

            p.fill(40, 70, 120, 150);
            p.stroke(255, 215, 0, 100);
            p.strokeWeight(2);
            p.rect(x, y, boxWidth, boxHeight, 10);

            p.fill(255, 215, 0);
            p.noStroke();
            p.textAlign(p.LEFT);
            p.textSize(18);
            p.textStyle(p.BOLD);
            p.text(continent, x + 15, y + 30);

            p.textStyle(p.NORMAL);

            const countries = continentData[continent];
            const availableHeight = boxHeight - 60;
            const columnsInBox = 3;
            const rowsNeeded = Math.ceil(countries.length / columnsInBox);

            let itemHeight = availableHeight / rowsNeeded;
            itemHeight = p.constrain(itemHeight, 12, 16);

            const maxItemsPerColumn = Math.ceil(availableHeight / itemHeight);
            p.textSize(itemHeight <= 13 ? 12 : 13);

            countries.forEach((country, i) => {
              const columnIndex = Math.floor(i / maxItemsPerColumn);
              const rowIndex = i % maxItemsPerColumn;

              const columnWidth = (boxWidth - 40) / columnsInBox;
              const listX = x + 15 + columnIndex * columnWidth;
              const listY = y + 50 + rowIndex * itemHeight;

              const num = i + 1;

              if (guessedCountries.has(country.toLowerCase())) {
                p.fill(46, 204, 113);
                p.text(`${num}. ${country}`, listX, listY);
              } else {
                p.fill(100, 100, 100);
                p.text(`${num}. ---`, listX, listY);
              }
            });

            col++;
            if (col >= 3) {
              col = 0;
              row++;
            }
          });
        }
      };

      try {
        p5Ref.current = new P5(sketch, hostRef.current);
      } catch (error) {
        console.error("Failed to initialize p5:", error);
      }
    })();

    return () => {
      mounted = false;
      p5Ref.current?.remove();
      p5Ref.current = null;

      // extra safety: clear any leftover HTML in the host
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [router]);

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div ref={hostRef} />
    </div>
  );
}