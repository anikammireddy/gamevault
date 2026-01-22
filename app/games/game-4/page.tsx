"use client";

import React, { useEffect, useRef } from "react";
import type p5 from "p5";
import { useRouter } from "next/navigation";

type SavedState = {
  highScore: number;
};

const STORAGE_KEY = "stack-game:highscore:v1";

function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { highScore: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    return {
      highScore: parsed.highScore ?? 0,
    };
  } catch {
    return { highScore: 0 };
  }
}

function saveState(state: SavedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

type Block = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: p5.Color;
};

export default function StackGamePage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const p5Ref = useRef<p5 | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!hostRef.current) return;

      const initial = loadState();

      const P5 = (await import("p5")).default;
      if (!mounted || !hostRef.current) return;

      const sketch = (p: p5) => {
        let state: SavedState = initial;

        // Game constants
        const INITIAL_BLOCK_WIDTH = 160; // Bigger starting block
        const INITIAL_BLOCK_HEIGHT = 20;
        const BLOCK_SIZE_REDUCTION = 0.998; // Very tiny reduction (0.2% per block)
        const INITIAL_SPEED = 2;
        const SPEED_INCREASE = 0.3;
        const MIN_OVERLAP = 0.5; // At least 50% overlap required
        const BLOCK_SPACING = 10; // Higher spacing between blocks

        // Game variables
        let blocks: Block[] = [];
        let currentBlock: Block;
        let movingRight = true;
        let gameStarted = false;
        let gameOver = false;
        let score = 0;
        let moveSpeed = INITIAL_SPEED;
        let cameraY = 0;

        // UI elements
        let goBtn!: HTMLButtonElement;
        let restartBtn!: HTMLButtonElement;
        let backBtn!: HTMLButtonElement;

        function getColorForHeight(height: number): p5.Color {
          // Color gradient from red (bottom) to white/pink (top)
          const t = Math.min(height / 50, 1);
          const r = p.lerp(200, 255, t);
          const g = p.lerp(50, 200, t);
          const b = p.lerp(50, 200, t);
          return p.color(r, g, b);
        }

        function resetGame() {
          blocks = [];
          score = 0;
          moveSpeed = INITIAL_SPEED;
          movingRight = true;
          gameStarted = false;
          gameOver = false;
          cameraY = 0;

          // Create base block (platform)
          const baseBlock: Block = {
            x: p.width / 2 - INITIAL_BLOCK_WIDTH / 2,
            y: p.height - 100,
            width: INITIAL_BLOCK_WIDTH,
            height: INITIAL_BLOCK_HEIGHT,
            color: p.color(200, 50, 50),
          };
          blocks.push(baseBlock);

          // Create first moving block
          createNewBlock();

          if (goBtn) goBtn.style.display = "block";
          if (restartBtn) restartBtn.style.display = "none";
        }

        function createNewBlock() {
          const lastBlock = blocks[blocks.length - 1];
          const newWidth = lastBlock.width * BLOCK_SIZE_REDUCTION;
          const newHeight = INITIAL_BLOCK_HEIGHT;

          currentBlock = {
            x: 0,
            y: lastBlock.y - newHeight - BLOCK_SPACING, // Higher spacing
            width: newWidth,
            height: newHeight,
            color: getColorForHeight(blocks.length),
          };
        }

        p.setup = () => {
          p.createCanvas(600, 800);

          resetGame();

          // Create UI buttons
          const host = hostRef.current!;
          host.style.position = "relative";

          // Back button
          backBtn = document.createElement("button");
          backBtn.textContent = "← Back";
          Object.assign(backBtn.style, {
            position: "absolute",
            left: "10px",
            top: "10px",
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
            router.push("/");
          });

          // GO button
          goBtn = document.createElement("button");
          goBtn.textContent = "GO";
          Object.assign(goBtn.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "120px",
            height: "60px",
            fontSize: "32px",
            fontWeight: "700",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            zIndex: "10",
          } as CSSStyleDeclaration);
          host.appendChild(goBtn);

          goBtn.addEventListener("click", () => {
            gameStarted = true;
            goBtn.style.display = "none";
          });

          // Restart button
          restartBtn = document.createElement("button");
          restartBtn.textContent = "RESTART";
          Object.assign(restartBtn.style, {
            position: "absolute",
            left: "50%",
            top: "55%",
            transform: "translate(-50%, -50%)",
            width: "160px",
            height: "60px",
            fontSize: "24px",
            fontWeight: "700",
            backgroundColor: "#FF5722",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            zIndex: "10",
            display: "none",
          } as CSSStyleDeclaration);
          host.appendChild(restartBtn);

          restartBtn.addEventListener("click", () => {
            resetGame();
          });

          // Handle mouse click
          p.mousePressed = () => {
            if (gameStarted && !gameOver) {
              dropBlock();
            }
          };

          // Handle spacebar
          p.keyPressed = () => {
            if ((p.key === " " || p.keyCode === 32) && gameStarted && !gameOver) {
              dropBlock();
            }
          };
        };

        p.draw = () => {
          // Gradient background (teal to light)
          for (let i = 0; i < p.height; i++) {
            const inter = p.map(i, 0, p.height, 0, 1);
            const c = p.lerpColor(p.color(70, 130, 130), p.color(150, 200, 200), inter);
            p.stroke(c);
            p.line(0, i, p.width, i);
          }

          // Draw stars/sparkles
          drawSparkles();

          p.push();
          p.translate(0, cameraY);

          // Draw all stacked blocks
          blocks.forEach((block) => {
            p.fill(block.color);
            p.noStroke();
            p.rect(block.x, block.y, block.width, block.height, 2);

            // Add 3D effect with shadow
            p.fill(0, 0, 0, 30);
            p.rect(block.x + 2, block.y + block.height - 3, block.width, 3);
          });

          // Draw and move current block
          if (gameStarted && !gameOver) {
            // Move block side to side
            if (movingRight) {
              currentBlock.x += moveSpeed;
              if (currentBlock.x + currentBlock.width >= p.width) {
                movingRight = false;
              }
            } else {
              currentBlock.x -= moveSpeed;
              if (currentBlock.x <= 0) {
                movingRight = true;
              }
            }

            // Draw current block
            p.fill(currentBlock.color);
            p.noStroke();
            p.rect(currentBlock.x, currentBlock.y, currentBlock.width, currentBlock.height, 2);

            // Update camera to follow stack
            const targetY = -blocks[blocks.length - 1].y + p.height * 0.7;
            cameraY = p.lerp(cameraY, targetY, 0.1);
          }

          p.pop();

          // Draw UI (not affected by camera)
          drawUI();
        };

        function drawSparkles() {
          p.fill(255, 255, 255, 150);
          p.noStroke();
          
          // Random sparkles
          const sparklePositions = [
            { x: 50, y: 100 },
            { x: 150, y: 250 },
            { x: 400, y: 150 },
            { x: 500, y: 300 },
            { x: 250, y: 450 },
            { x: 100, y: 600 },
          ];

          sparklePositions.forEach((pos) => {
            const size = 2 + Math.sin(p.frameCount * 0.05 + pos.x) * 1;
            p.circle(pos.x, pos.y, size);
          });
        }

        function drawUI() {
          // Draw score
          p.fill(255);
          p.textAlign(p.CENTER);
          p.textSize(48);
          p.textStyle(p.BOLD);
          p.text(score, p.width / 2, 60);

          // Draw high score (smaller)
          p.textSize(18);
          p.textStyle(p.NORMAL);
          p.text(`High Score: ${state.highScore}`, p.width / 2, 85);

          // Draw game over
          if (gameOver) {
            p.fill(255);
            p.textAlign(p.CENTER);
            p.textSize(64);
            p.textStyle(p.BOLD);
            p.text(score, p.width / 2, p.height / 2 - 20);
          }
        }

        function dropBlock() {
          const lastBlock = blocks[blocks.length - 1];

          // Calculate overlap
          const overlapLeft = Math.max(currentBlock.x, lastBlock.x);
          const overlapRight = Math.min(
            currentBlock.x + currentBlock.width,
            lastBlock.x + lastBlock.width
          );
          const overlapWidth = overlapRight - overlapLeft;

          // Check if at least 50% of the current block overlaps
          const overlapPercentage = overlapWidth / currentBlock.width;

          if (overlapPercentage >= MIN_OVERLAP) {
            // Success! Add block to stack
            const stackedBlock: Block = {
              x: overlapLeft,
              y: currentBlock.y,
              width: overlapWidth,
              height: currentBlock.height,
              color: currentBlock.color,
            };

            blocks.push(stackedBlock);
            score++;

            // Update high score
            if (score > state.highScore) {
              state.highScore = score;
              saveState(state);
            }

            // Increase speed every 8 blocks
            if (score % 8 === 0) {
              moveSpeed += SPEED_INCREASE;
            }

            // Create next block
            createNewBlock();
          } else {
            // Failed! Game over
            endGame();
          }
        }

        function endGame() {
          gameOver = true;
          restartBtn.style.display = "block";
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

      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [router]);

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div ref={hostRef} />
    </div>
  );
}