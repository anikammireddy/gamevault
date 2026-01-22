"use client";

import React, { useEffect, useRef } from "react";
import type p5 from "p5";
import { useRouter } from "next/navigation";

type SavedState = {
  highScore: number;
};

const STORAGE_KEY = "flappy-bird:highscore:v1";

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

export default function FlappyBirdPage() {
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
        const PIPE_WIDTH = 80;
        const PIPE_GAP = 200;
        const PIPE_SPACING = 350; // 7x the visual spacing
        const TOTAL_PIPES = 50;
        const INITIAL_SPEED = 3;
        const SPEED_INCREASE = 0.3;
        const BIRD_SIZE = 40;
        const GRAVITY = 0.6;
        const FLAP_STRENGTH = -12;

        // Game variables
        let bird: { x: number; y: number; velocity: number };
        let pipes: Array<{ x: number; topHeight: number; scored: boolean }> = [];
        let gameStarted = false;
        let gameOver = false;
        let score = 0;
        let gameSpeed = INITIAL_SPEED;
        let birdImage: p5.Image;

        // UI elements
        let goBtn!: HTMLButtonElement;
        let playAgainBtn!: HTMLButtonElement;
        let backBtn!: HTMLButtonElement;

        function resetGame() {
          bird = {
            x: 150,
            y: p.height / 2,
            velocity: 0,
          };

          pipes = [];
          for (let i = 0; i < TOTAL_PIPES; i++) {
            pipes.push({
              x: p.width + i * PIPE_SPACING,
              topHeight: p.random(100, p.height - PIPE_GAP - 100),
              scored: false,
            });
          }

          score = 0;
          gameSpeed = INITIAL_SPEED;
          gameStarted = false;
          gameOver = false;

          if (goBtn) goBtn.style.display = "block";
          if (playAgainBtn) playAgainBtn.style.display = "none";
        }

        p.setup = () => {
          p.createCanvas(800, 600);

          // Load bird image
          p.loadImage(
            "/mnt/user-data/uploads/flappy-bird.webp",
            (img) => {
              birdImage = img;
            },
            () => {
              console.log("Failed to load bird image");
            }
          );

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

          // Play Again button
          playAgainBtn = document.createElement("button");
          playAgainBtn.textContent = "PLAY AGAIN";
          Object.assign(playAgainBtn.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "200px",
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
          host.appendChild(playAgainBtn);

          playAgainBtn.addEventListener("click", () => {
            resetGame();
          });

          // Handle spacebar and up arrow
          p.keyPressed = () => {
            if (
              ((p.key === "ArrowUp") || (p.key === " ")) &&
              gameStarted &&
              !gameOver
            ) {
              bird.velocity = FLAP_STRENGTH;
            }
          };
        };

        p.draw = () => {
          // Sky blue background
          p.background(135, 206, 235);

          // Draw clouds
          drawClouds();

          // Draw pipes
          pipes.forEach((pipe) => {
            // Top pipe
            p.fill(76, 175, 80);
            p.stroke(56, 142, 60);
            p.strokeWeight(4);
            p.rect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

            // Pipe cap (top)
            p.rect(pipe.x - 5, pipe.topHeight - 30, PIPE_WIDTH + 10, 30);

            // Bottom pipe
            const bottomY = pipe.topHeight + PIPE_GAP;
            p.rect(pipe.x, bottomY, PIPE_WIDTH, p.height - bottomY);

            // Pipe cap (bottom)
            p.rect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 30);
          });

          // Update and draw bird
          if (gameStarted && !gameOver) {
            bird.velocity += GRAVITY;
            bird.y += bird.velocity;

            // Move pipes
            pipes.forEach((pipe) => {
              pipe.x -= gameSpeed;
            });

            // Loop pipes and check for scoring
            pipes.forEach((pipe) => {
              if (pipe.x + PIPE_WIDTH < 0) {
                const lastPipe = pipes[pipes.length - 1];
                pipe.x = lastPipe.x + PIPE_SPACING;
                pipe.topHeight = p.random(100, p.height - PIPE_GAP - 100);
                pipe.scored = false; // Reset scored flag
              }

              // Check if bird passed pipe (score) - using scored flag
              if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
                pipe.scored = true;
                score++;

                // Increase speed every 10 pipes
                if (score % 10 === 0) {
                  gameSpeed += SPEED_INCREASE;
                }
              }
            });

            // Collision detection
            pipes.forEach((pipe) => {
              if (
                bird.x + BIRD_SIZE > pipe.x &&
                bird.x < pipe.x + PIPE_WIDTH
              ) {
                if (
                  bird.y < pipe.topHeight ||
                  bird.y + BIRD_SIZE > pipe.topHeight + PIPE_GAP
                ) {
                  endGame();
                }
              }
            });

            // Check ground and ceiling collision
            if (bird.y + BIRD_SIZE > p.height || bird.y < 0) {
              endGame();
            }
          }

          // Draw bird
          if (birdImage) {
            const angle = gameOver ? p.PI / 2 : p.constrain(bird.velocity * 0.05, -0.5, 0.5);
            p.push();
            p.translate(bird.x + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2);
            p.rotate(angle);
            p.image(birdImage, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
            p.pop();
          } else {
            // Fallback: draw yellow circle
            p.fill(255, 215, 0);
            p.noStroke();
            p.circle(bird.x + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2, BIRD_SIZE);
          }

          // Draw score
          p.fill(255);
          p.textAlign(p.LEFT);
          p.textSize(32);
          p.textStyle(p.BOLD);
          p.text(`Score: ${score}`, 20, 50);

          // Draw high score
          p.textAlign(p.RIGHT);
          p.text(`High Score: ${state.highScore}`, p.width - 20, 50);

          // Draw game over message
          if (gameOver) {
            p.textAlign(p.CENTER);
            p.fill(255, 0, 0);
            p.textSize(48);
            p.text("GAME OVER", p.width / 2, p.height / 2 - 80);

            p.fill(255);
            p.textSize(32);
            p.text(`Final Score: ${score}`, p.width / 2, p.height / 2 - 30);
          }
        };

        function drawClouds() {
          p.fill(255, 255, 255, 180);
          p.noStroke();

          // Static clouds for decoration
          const clouds = [
            { x: 100, y: 100 },
            { x: 400, y: 80 },
            { x: 650, y: 120 },
          ];

          clouds.forEach((cloud) => {
            p.ellipse(cloud.x, cloud.y, 60, 40);
            p.ellipse(cloud.x + 25, cloud.y, 60, 40);
            p.ellipse(cloud.x + 50, cloud.y, 60, 40);
          });
        }

        function endGame() {
          gameOver = true;

          // Update high score
          if (score > state.highScore) {
            state.highScore = score;
            saveState(state);
          }

          playAgainBtn.style.display = "block";
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