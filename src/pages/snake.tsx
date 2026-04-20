import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CELL_SIZE = 20;

type Point = { x: number; y: number };
type ShapeType = "circle" | "square" | "triangle" | "star";

const randomShape = (): ShapeType => {
  const shapes: ShapeType[] = ["circle", "square", "triangle", "star"];
  return shapes[Math.floor(Math.random() * shapes.length)];
};

const SnakeGame: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);

  const [snake, setSnake] = useState<Point[]>([
    { x: 5, y: 5 },
    { x: 4, y: 5 },
  ]);
  const [direction, setDirection] = useState<Point>({ x: 1, y: 0 });
  const [food, setFood] = useState<Point>({ x: 10, y: 10 });
  const [foodShape, setFoodShape] = useState<ShapeType>("circle");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(false);
  const [foodsEaten, setFoodsEaten] = useState(0);
  const pulse = useRef(0);

  // Vision therapy session tracking
  const sessionStartTime = useRef(Date.now());
  const failsCount = useRef(0); // Track self-collisions
  const mongoSavedRef = useRef(false);

  const saveGameSessionToMongoDB = async () => {
    try {
      const userId = localStorage.getItem("userId") || `guest_${Date.now()}`;
      const sessionData = {
        userId,
        gameType: "snake_game",
        score,
        elapsedTime: time,
        foodsEaten,
        fails: failsCount.current,
        gameStatus: "game_over",
        sessionStartTime: new Date(sessionStartTime.current).toISOString(),
        sessionEndTime: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      const res = await fetch("/api/games/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error("Failed to save Snake session:", msg);
      }
    } catch (error) {
      console.error("Error saving Snake session to MongoDB:", error);
    }
  };

  /* ---------------- Full Screen Resize ---------------- */
  useEffect(() => {
    const resize = () => {
      const w = Math.floor(window.innerWidth / CELL_SIZE);
      const h = Math.floor((window.innerHeight - 140) / CELL_SIZE);
      setCols(w);
      setRows(h);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* ---------------- Food ---------------- */
  const generateFood = (snakeBody: Point[]) => {
    let f;
    do {
      f = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    } while (snakeBody.some(s => s.x === f.x && s.y === f.y));

    setFood(f);
    setFoodShape(randomShape());
  };

  /* ---------------- Controls ---------------- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowUp" && direction.y !== 1) setDirection({ x: 0, y: -1 });
      if (e.key === "ArrowDown" && direction.y !== -1) setDirection({ x: 0, y: 1 });
      if (e.key === "ArrowLeft" && direction.x !== 1) setDirection({ x: -1, y: 0 });
      if (e.key === "ArrowRight" && direction.x !== -1) setDirection({ x: 1, y: 0 });
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [direction]);

  /* ---------------- Timer ---------------- */
  useEffect(() => {
    if (gameOver || paused) return;
    
    const timer = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, paused]);

  /* ---------------- Game Loop ---------------- */
  useEffect(() => {
    if (gameOver || cols === 0 || rows === 0 || paused) return;

    const interval = setInterval(() => {
      setSnake(prev => {
        const head = prev[0];
        let newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // Wrap around edges instead of game over
        newHead.x = (newHead.x + cols) % cols;
        newHead.y = (newHead.y + rows) % rows;

        if (prev.some(p => p.x === newHead.x && p.y === newHead.y)) {
          setGameOver(true);
          failsCount.current += 1; // Track self-collision as fail
          return prev;
        }

        let next = [newHead, ...prev];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 1);
          setFoodsEaten(f => f + 1);
          generateFood(next);
        } else {
          next.pop();
        }

        return next;
      });
    }, 110);

    return () => clearInterval(interval);
  }, [direction, food, gameOver, cols, rows, paused]);

  /* ---------------- Drawing ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = cols * CELL_SIZE;
    canvas.height = rows * CELL_SIZE;

    pulse.current += 0.08;
    const glow = 1 + Math.sin(pulse.current) * 0.2;

    // Calculate food size: start big (40x40 for first 10), then gradually shrink
    const maxSize = CELL_SIZE * 2; // 40px (2x cell size)
    const minSize = CELL_SIZE * 0.5; // 10px (0.5x cell size)
    const shapeSize = Math.max(minSize, maxSize - (foodsEaten * 3)); // 3px decrease per food

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Snake with realistic appearance
    snake.forEach((s, index) => {
      const isHead = index === 0;
      const isTail = index === snake.length - 1;
      
      // Gradient body color - darker at head, lighter at tail
      const tailAlpha = isTail ? 0.5 : 1;
      const headGradient = isHead ? "#1ea34f" : "#22c55e";
      ctx.fillStyle = isHead ? headGradient : `rgba(34, 197, 94, ${tailAlpha})`;
      
      // Draw body segment as rounded rectangle
      const x = s.x * CELL_SIZE;
      const y = s.y * CELL_SIZE;
      const radius = CELL_SIZE / 4;
      
      // Rounded rectangle
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + CELL_SIZE - radius, y);
      ctx.quadraticCurveTo(x + CELL_SIZE, y, x + CELL_SIZE, y + radius);
      ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE - radius);
      ctx.quadraticCurveTo(x + CELL_SIZE, y + CELL_SIZE, x + CELL_SIZE - radius, y + CELL_SIZE);
      ctx.lineTo(x + radius, y + CELL_SIZE);
      ctx.quadraticCurveTo(x, y + CELL_SIZE, x, y + CELL_SIZE - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      
      // Add border for definition
      ctx.strokeStyle = isHead ? "#15803d" : "#16a34a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw head with eyes and mouth
      if (isHead) {
        // Eyes
        ctx.fillStyle = "white";
        const eyeOffset = CELL_SIZE / 6;
        const eyeSize = CELL_SIZE / 8;
        
        // Determine eye positions based on direction
        if (direction.x > 0) { // Moving right
          ctx.fillRect(x + eyeOffset + 3, y + eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(x + eyeOffset + 3, y + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
        } else if (direction.x < 0) { // Moving left
          ctx.fillRect(x + CELL_SIZE - eyeOffset - 3 - eyeSize, y + eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(x + CELL_SIZE - eyeOffset - 3 - eyeSize, y + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
        } else if (direction.y > 0) { // Moving down
          ctx.fillRect(x + eyeOffset, y + eyeOffset + 3, eyeSize, eyeSize);
          ctx.fillRect(x + CELL_SIZE - eyeOffset - eyeSize, y + eyeOffset + 3, eyeSize, eyeSize);
        } else { // Moving up
          ctx.fillRect(x + eyeOffset, y + CELL_SIZE - eyeOffset - 3 - eyeSize, eyeSize, eyeSize);
          ctx.fillRect(x + CELL_SIZE - eyeOffset - eyeSize, y + CELL_SIZE - eyeOffset - 3 - eyeSize, eyeSize, eyeSize);
        }
        
        // Pupils (looking in direction of movement)
        ctx.fillStyle = "#000";
        const pupilSize = eyeSize / 2.5;
        if (direction.x > 0) {
          ctx.fillRect(x + eyeOffset + 5, y + eyeOffset + 1, pupilSize, pupilSize);
          ctx.fillRect(x + eyeOffset + 5, y + CELL_SIZE - eyeOffset - pupilSize - 1, pupilSize, pupilSize);
        } else if (direction.x < 0) {
          ctx.fillRect(x + CELL_SIZE - eyeOffset - 5 - pupilSize, y + eyeOffset + 1, pupilSize, pupilSize);
          ctx.fillRect(x + CELL_SIZE - eyeOffset - 5 - pupilSize, y + CELL_SIZE - eyeOffset - pupilSize - 1, pupilSize, pupilSize);
        } else if (direction.y > 0) {
          ctx.fillRect(x + eyeOffset + 1, y + eyeOffset + 5, pupilSize, pupilSize);
          ctx.fillRect(x + CELL_SIZE - eyeOffset - pupilSize - 1, y + eyeOffset + 5, pupilSize, pupilSize);
        } else {
          ctx.fillRect(x + eyeOffset + 1, y + CELL_SIZE - eyeOffset - 5 - pupilSize, pupilSize, pupilSize);
          ctx.fillRect(x + CELL_SIZE - eyeOffset - pupilSize - 1, y + CELL_SIZE - eyeOffset - 5 - pupilSize, pupilSize, pupilSize);
        }
      }
      
      // Add tail scaling effect
      if (isTail) {
        ctx.fillStyle = `rgba(34, 197, 94, 0.3)`;
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Food Shapes
    ctx.save();
    ctx.translate(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2
    );
    ctx.scale(glow, glow);
    
    // Alternate colors based on food position
    const colorIndex = (food.x + food.y) % 2;
    ctx.fillStyle = colorIndex === 0 ? "#FFD700" : "#fa0707";
    //ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 15;

    const r = shapeSize / 2;

    if (foodShape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (foodShape === "square") {
      ctx.fillRect(-r, -r, shapeSize, shapeSize);
    }

    if (foodShape === "triangle") {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r, r);
      ctx.lineTo(-r, r);
      ctx.closePath();
      ctx.fill();
    }

    if (foodShape === "star") {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          Math.cos((18 + i * 72) * Math.PI / 180) * r,
          -Math.sin((18 + i * 72) * Math.PI / 180) * r
        );
        ctx.lineTo(
          Math.cos((54 + i * 72) * Math.PI / 180) * (r / 2),
          -Math.sin((54 + i * 72) * Math.PI / 180) * (r / 2)
        );
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }, [snake, food, foodShape, cols, rows, foodsEaten]);

  const restart = () => {
    setSnake([{ x: 5, y: 5 }, { x: 4, y: 5 }]);
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setFoodsEaten(0);
    setGameOver(false);
    generateFood([{ x: 5, y: 5 }]);
    
    // Reset tracking for new session
    sessionStartTime.current = Date.now();
    failsCount.current = 0;
    mongoSavedRef.current = false;
  };

  // Save session data on component unmount
  useEffect(() => {
    return () => {
      const currentSession = localStorage.getItem('currentVisionTherapySession');
      if (currentSession) {
        const session = JSON.parse(currentSession);
        const endTime = Date.now();
        const durationMs = endTime - sessionStartTime.current;
        const durationMinutes = Math.round(durationMs / 60000);

        const completedSession = {
          ...session,
          endTime,
          duration: `${durationMinutes} min`,
          durationMs,
          score,
          fails: failsCount.current,
          foodsEaten,
          completed: score > 0, // Completed if they ate at least 1 food
        };

        const existingSessions = JSON.parse(localStorage.getItem('visionTherapySessions') || '[]');
        existingSessions.push(completedSession);
        localStorage.setItem('visionTherapySessions', JSON.stringify(existingSessions));
        localStorage.removeItem('currentVisionTherapySession');
        saveTherapySessionToMongoDB(completedSession);
      }
    };
  }, [score, foodsEaten]);

  useEffect(() => {
    if (gameOver && !mongoSavedRef.current) {
      mongoSavedRef.current = true;
      saveGameSessionToMongoDB();
    }
  }, [gameOver, score, foodsEaten, time]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f9fafb" }}>
      <div 
        style={{
          padding: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontWeight: "bold",
          fontSize: "1.2rem",
        }}
      >
        <button
          onClick={() => navigate("/games")}
          style={{
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            fontWeight: "bold",
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            border: "2px solid rgba(255, 255, 255, 0.4)",
            borderRadius: "15px",
            cursor: "pointer",
            fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          🏠 Home
        </button>
        <div>🐍 Score: {score}</div>
        <div>⏱️ Time: {time}s</div>
        <button
          onClick={() => setPaused(!paused)}
          style={{
            padding: "0.5rem 1.5rem",
            fontSize: "1rem",
            fontWeight: "bold",
            background: paused ? "#00FF88" : "#FFD700",
            color: "#333",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>

      <canvas ref={canvasRef} />

      {gameOver && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            animation: "fadeInOverlay 0.3s ease-out",
          }}
        >
          <style>{`
            @keyframes slideInBounce {
              0% {
                transform: scale(0.5) translateY(-50px);
                opacity: 0;
              }
              50% {
                transform: scale(1.05);
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }

            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              75% { transform: translateX(5px); }
            }

            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }

            @keyframes fadeInOverlay {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}</style>

          <div
            style={{
              background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E72 100%)",
              borderRadius: "40px",
              padding: "4rem 3rem",
              textAlign: "center",
              boxShadow: "0 30px 80px rgba(255, 107, 107, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
              maxWidth: "500px",
              animation: "slideInBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              position: "relative",
              border: "3px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            {/* Shock Icon */}
            <div
              style={{
                fontSize: "4rem",
                marginBottom: "1rem",
                animation: "shake 0.5s ease-in-out",
              }}
            >
              💥
            </div>

            {/* Game Over Title */}
            <h1
              style={{
                color: "white",
                fontSize: "3.5rem",
                fontWeight: "900",
                margin: "0 0 1.5rem 0",
                fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
                textShadow: "3px 3px 8px rgba(0,0,0,0.4)",
                letterSpacing: "2px",
              }}
            >
              GAME OVER
            </h1>

            {/* Stats Box */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "25px",
                padding: "2rem",
                marginBottom: "2rem",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  gap: "2rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: "1rem",
                      margin: "0 0 0.5rem 0",
                      fontWeight: "600",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    Score
                  </p>
                  <p
                    style={{
                      color: "white",
                      fontSize: "2.5rem",
                      fontWeight: "900",
                      margin: 0,
                      fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
                    }}
                  >
                    {score}
                  </p>
                </div>
                <div
                  style={{
                    width: "2px",
                    background: "rgba(255, 255, 255, 0.3)",
                  }}
                />
                <div>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: "1rem",
                      margin: "0 0 0.5rem 0",
                      fontWeight: "600",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    Time
                  </p>
                  <p
                    style={{
                      color: "white",
                      fontSize: "2.5rem",
                      fontWeight: "900",
                      margin: 0,
                      fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
                    }}
                  >
                    {time}s
                  </p>
                </div>
              </div>

              {/* Motivational Message */}
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  margin: 0,
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {score > 20
                  ? "🌟 Amazing Performance!"
                  : score > 10
                  ? "👏 Great Effort!"
                  : "💪 Keep Practicing!"}
              </p>
            </div>

            {/* Restart Button */}
            <button
              onClick={restart}
              style={{
                padding: "1.2rem 3.5rem",
                fontSize: "1.3rem",
                fontWeight: "900",
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "#333",
                border: "none",
                borderRadius: "30px",
                cursor: "pointer",
                fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
                boxShadow: "0 10px 30px rgba(255, 165, 0, 0.4)",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                textTransform: "uppercase",
                letterSpacing: "2px",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow =
                  "0 15px 40px rgba(255, 165, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(255, 165, 0, 0.4)";
              }}
            >
              🔄 Try Again
            </button>

            {/* Decorative corners */}
            <div
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                width: "30px",
                height: "30px",
                background: "#FFD700",
                borderRadius: "50%",
                opacity: 0.6,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-10px",
                left: "-10px",
                width: "40px",
                height: "40px",
                background: "#FFA500",
                borderRadius: "50%",
                opacity: 0.6,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
