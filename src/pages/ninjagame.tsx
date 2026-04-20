import React, { useEffect, useRef, useState } from "react";

type ShapeType = "circle" | "square" | "triangle" | "star";

type Shape = {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  gravity: number;
  type: ShapeType;
  color: string;
  alive: boolean;
  sliced?: boolean;
  fullyShown?: boolean;
};

type SliceTrail = {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  radius: number;
};

type BloodSpot = {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  radius: number;
};

const COLORS = ["#ff7675", "#74b9ff", "#55efc4", "#ffeaa7"];
const TARGET_COLORS = ["#FF6B6B", "#FFD700", "#FFA500", "#FF7F50"]; // softer red / yellow palette for target shapes

const SHAPE_ICONS: { [key in ShapeType]: string } = {
  circle: "⭕",
  square: "🟦",
  triangle: "🔺",
  star: "⭐",
};

const SHAPE_NAMES: { [key in ShapeType]: string } = {
  circle: "CIRCLE",
  square: "SQUARE",
  triangle: "TRIANGLE",
  star: "STAR",
};

const ShapeNinja: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapes = useRef<Shape[]>([]);
  const sliceTrails = useRef<SliceTrail[]>([]);
  const bloodSpots = useRef<BloodSpot[]>([]);
  const mouse = useRef({ x: 0, y: 0, slicing: false });
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // Randomly select initial target shape
  const getRandomShape = (): ShapeType => {
    const types: ShapeType[] = ["circle", "square", "triangle", "star"];
    return types[Math.floor(Math.random() * types.length)];
  };

  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [targetShape, setTargetShape] = useState<ShapeType>(getRandomShape());
  const [showWrongPopup, setShowWrongPopup] = useState(false);
  const [wrongShapeType, setWrongShapeType] = useState<ShapeType | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [misses, setMisses] = useState(0);
  const MAX_MISSES = 5;
  const [gameOver, setGameOver] = useState(false);
  const pausedRef = useRef(false);
  const gameStartedRef = useRef(false);
  const gameOverRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const sessionStartTime = useRef(Date.now());
  const failsCount = useRef(0);

  const saveGameSessionToMongoDB = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'guest';
      const sessionData = {
        userId,
        gameType: "ninja_game",
        score,
        targetShape,
        elapsedTime,
        misses,
        fails: failsCount.current,
        sessionStartTime: new Date(sessionStartTime.current).toISOString(),
        sessionEndTime: new Date().toISOString(),
        gameStatus: gameOver ? "game_over" : "running",
        timestamp: new Date().toISOString(),
      };

      const res = await fetch('/api/games/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error('Failed to save Ninja game session:', msg);
      }
    } catch (error) {
      console.error('Error saving Ninja game session to MongoDB:', error);
    }
  };

  const saveTherapySessionToMongoDB = async (completedSession: any) => {
    try {
      const userId = localStorage.getItem('userId') || 'guest';
      const payload = {
        userId,
        gameTitle: completedSession.gameTitle || 'Ninja Game',
        startTime: completedSession.startTime || new Date(sessionStartTime.current).toISOString(),
        endTime: completedSession.endTime,
        duration: completedSession.duration,
        durationMs: completedSession.durationMs,
        score: completedSession.score,
        fails: completedSession.fails,
        misses: completedSession.misses,
        completed: completedSession.completed,
        route: completedSession.route,
        icon: completedSession.icon,
      };

      const res = await fetch('/api/therapy/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error('Failed to save therapy session:', msg);
      }
    } catch (error) {
      console.error('Error saving therapy session to MongoDB:', error);
    }
  };

  const playMissSound = async () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.18);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      // ignore audio errors
    }
  };

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  /* ---------- FULL SCREEN ---------- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Load background image
    const img = new Image();
    img.src = "/ninja.svg";
    img.onload = () => {
      backgroundImageRef.current = img;
    };

    return () => window.removeEventListener("resize", resize);
  }, []);

  /* ---------- SPAWN SHAPES (SLOW) ---------- */
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (!gameStarted || isPaused) return;
      // Count alive shapes
      const aliveCount = shapes.current.filter(s => s.alive).length;
      
      // Only spawn if less than 3 shapes on screen
      if (aliveCount < 3) {
        // Randomly spawn 1, 2, or 3 shapes at once (but not exceeding max of 3 total)
        const maxToSpawn = 3 - aliveCount; // remaining slots
        const shapeCount = Math.min(
          Math.random() < 0.5 ? 1 : Math.random() < 0.7 ? 2 : 3,
          maxToSpawn
        );
        
        for (let i = 0; i < shapeCount; i++) {
          spawnShape();
        }
      }
    }, 1400); // slower spawn

    return () => clearInterval(spawnInterval);
  }, [gameStarted, isPaused]);

  /* ---------- FIXED TARGET SHAPE (no auto change) ---------- */
  useEffect(() => {
    if (!gameStarted) return;
    // Keep the same target shape during the game
  }, [gameStarted]);

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (!gameStarted || isPaused) return;

    const timerInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000); // Update every second

    return () => clearInterval(timerInterval);
  }, [gameStarted, isPaused]);

  /* ---------- GAME LOOP ---------- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background image
      if (backgroundImageRef.current) {
        ctx.globalAlpha = 0.15; // semi-transparent
        ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0; // reset
      }

      // If not started or paused, skip updates
      if (!gameStartedRef.current || pausedRef.current) {
        if (pausedRef.current) {
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 48px Arial";
          ctx.textAlign = "center";
          ctx.fillText(gameOverRef.current ? "GAME OVER" : "PAUSED", canvas.width / 2, canvas.height / 2);
        }
        requestAnimationFrame(gameLoop);
        return;
      }

      shapes.current.forEach((s) => {
        if (!s.alive) return;

        // Slow physics
        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity;

        // Keep shapes within screen bounds
        const padding = s.size + 20;
        // Mark as fully shown once the entire shape is inside the canvas
        const fullyInside =
          s.x - s.size >= 0 &&
          s.x + s.size <= canvas.width &&
          s.y - s.size >= 0 &&
          s.y + s.size <= canvas.height;
        if (fullyInside) s.fullyShown = true;
        
        // Bounce off left/right edges
        if (s.x - padding < 0) {
          s.x = padding;
          s.vx = Math.abs(s.vx); // bounce right
        }
        if (s.x + padding > canvas.width) {
          s.x = canvas.width - padding;
          s.vx = -Math.abs(s.vx); // bounce left
        }

        // Bounce off top edge
        if (s.y - padding < 0) {
          s.y = padding;
          s.vy = Math.abs(s.vy); // bounce down
        }

        // Bottom edge - target missed only if fully outside and was fully visible before
        if (s.y - s.size > canvas.height) {
          if (!s.sliced && s.type === targetShape && s.fullyShown) {
            playMissSound();
            setMisses((prev) => {
              const next = prev + 1;
              if (next >= MAX_MISSES) {
                setGameOver(true);
                setIsPaused(true);
              }
              return next;
            });
          }
          s.alive = false;
        }

        drawShape(ctx, s);

        // Slice detection
        if (
          mouse.current.slicing &&
          Math.hypot(mouse.current.x - s.x, mouse.current.y - s.y) < s.size
        ) {
          s.sliced = true;
          s.alive = false;
          
          // Check if correct shape
          if (s.type === targetShape) {
            setScore((prev) => prev + 1);
          } else {
            // Wrong shape sliced!
            failsCount.current += 1;
            setScore((prev) => Math.max(0, prev - 2)); // Decrease by 2, minimum 0
            playMissSound();
            setWrongShapeType(s.type);
            setShowWrongPopup(true);
            
            // Create blood spots
            for (let i = 0; i < 8; i++) {
              const angle = (Math.PI * 2 * i) / 8;
              const distance = 30 + Math.random() * 40;
              bloodSpots.current.push({
                x: s.x + Math.cos(angle) * distance,
                y: s.y + Math.sin(angle) * distance,
                age: 0,
                maxAge: 120,
                radius: 10 + Math.random() * 15,
              });
            }
            
            // Increment misses and check game over
            setMisses((prev) => {
              const next = prev + 1;
              if (next >= MAX_MISSES) {
                setGameOver(true);
                setIsPaused(true);
              }
              return next;
            });

            // Hide popup after 1.5 seconds
            setTimeout(() => {
              setShowWrongPopup(false);
              setWrongShapeType(null);
            }, 1500);
          }
        }
      });

      // Update and draw slice trails
      sliceTrails.current.forEach((trail) => {
        trail.age += 1;
      });

      sliceTrails.current = sliceTrails.current.filter(
        (trail) => trail.age < trail.maxAge
      );

      sliceTrails.current.forEach((trail) => {
        const alpha = 1 - trail.age / trail.maxAge; // fade out
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.radius * (1 - trail.age / trail.maxAge), 0, Math.PI * 2);
        ctx.fill();

        // Draw glow
        ctx.strokeStyle = `rgba(255, 150, 0, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.radius * (1.5 - trail.age / trail.maxAge), 0, Math.PI * 2);
        ctx.stroke();
      });

      // Update and draw blood spots
      bloodSpots.current.forEach((spot) => {
        spot.age += 1;
      });

      bloodSpots.current = bloodSpots.current.filter(
        (spot) => spot.age < spot.maxAge
      );

      bloodSpots.current.forEach((spot) => {
        const alpha = 1 - spot.age / spot.maxAge;
        ctx.fillStyle = `rgba(220, 20, 20, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add darker center
        ctx.fillStyle = `rgba(150, 0, 0, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Remove shapes when gone
      shapes.current = shapes.current.filter(
        (s) => s.y < canvas.height + 120 && s.alive
      );

      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, []);

  /* ---------- SPAWN FUNCTION ---------- */
  const spawnShape = () => {
    const canvas = canvasRef.current!;
    const types: ShapeType[] = ["circle", "square", "triangle", "star"];

    // Random angle and speed for free movement
    const angle = Math.random() * Math.PI * 2; // 0 to 360 degrees
    const speed = 1.5 + Math.random() * 1.5; // slower speed (1.5 to 3)

    const shapeType = types[Math.floor(Math.random() * types.length)];
    const palette = shapeType === targetShape ? TARGET_COLORS : COLORS;

    shapes.current.push({
      x: Math.random() * canvas.width,
      y: canvas.height + 40,
      size: 100,
      vx: Math.cos(angle) * speed, // free horizontal movement
      vy: Math.sin(angle) * speed, // free vertical movement
      gravity: 0.001,               // very very low gravity to reach much higher
      type: shapeType,
      color: palette[Math.floor(Math.random() * palette.length)],
      alive: true,
      sliced: false,
      fullyShown: false,
    });
  };

  /* ---------- DRAW SHAPES ---------- */
  const drawShape = (ctx: CanvasRenderingContext2D, s: Shape) => {
    ctx.fillStyle = s.color;
    ctx.beginPath();

    switch (s.type) {
      case "circle":
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        break;

      case "square":
        ctx.rect(s.x - s.size, s.y - s.size, s.size * 2, s.size * 2);
        break;

      case "triangle":
        ctx.moveTo(s.x, s.y - s.size);
        ctx.lineTo(s.x - s.size, s.y + s.size);
        ctx.lineTo(s.x + s.size, s.y + s.size);
        ctx.closePath();
        break;

      case "star":
        drawStar(ctx, s.x, s.y, 5, s.size, s.size / 2);
        break;
    }

    ctx.fill();
  };

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    points: number,
    outer: number,
    inner: number
  ) => {
    let angle = Math.PI / points;
    ctx.moveTo(x, y - outer);

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      ctx.lineTo(x + Math.sin(i * angle) * r, y - Math.cos(i * angle) * r);
    }
    ctx.closePath();
  };

  /* ---------- INPUT ---------- */
  const movePointer = (x: number, y: number) => {
    mouse.current.x = x;
    mouse.current.y = y;

    // Create slice trail when slicing
    if (mouse.current.slicing && gameStarted && !isPaused) {
      sliceTrails.current.push({
        x: x,
        y: y,
        age: 0,
        maxAge: 100,
        radius: 20,
      });
    }
  };

  const togglePause = () => {
    if (gameOver) return; // cannot unpause during game over
    setIsPaused((prev) => {
      if (!prev) {
        // just paused
        mouse.current.slicing = false;
      }
      return !prev;
    });
  };

  const restartGame = () => {
    // reset state
    setScore(0);
    setElapsedTime(0);
    setShowWrongPopup(false);
    setWrongShapeType(null);
    setIsPaused(false);
    setMisses(0);
    setGameOver(false);
    setTargetShape(getRandomShape());
    // clear entities
    shapes.current = [];
    sliceTrails.current = [];
    bloodSpots.current = [];
    // ensure game is started
    setGameStarted(true);
    // Reset session tracking
    sessionStartTime.current = Date.now();
    failsCount.current = 0;
  };

  /* ---------------- SAVE GAME SESSION ---------------- */
  useEffect(() => {
    return () => {
      // Save session on unmount
      if (!gameStarted) return; // Don't save if game never started
      
      try {
        const currentSession = localStorage.getItem('currentVisionTherapySession');
        if (!currentSession) return;
        
        const sessionData = JSON.parse(currentSession);
        const duration = Date.now() - sessionStartTime.current;
        const completedSession = {
          ...sessionData,
          endTime: new Date().toISOString(),
          duration: Math.round(duration / 60000), // Convert to minutes
          durationMs: duration,
          score: score,
          fails: failsCount.current,
          misses: misses,
          completed: !gameOver || score > 0
        };
        
        // Get existing sessions
        const sessionsStr = localStorage.getItem('visionTherapySessions') || '[]';
        const sessions = JSON.parse(sessionsStr);
        sessions.push(completedSession);
        
        // Save back
        localStorage.setItem('visionTherapySessions', JSON.stringify(sessions));
        localStorage.removeItem('currentVisionTherapySession');
        saveTherapySessionToMongoDB(completedSession);
      } catch (error) {
        console.error('Error saving vision therapy session:', error);
      }
    };
  }, [score, misses, gameOver, gameStarted]);

  // Save to MongoDB when game ends
  useEffect(() => {
    if (gameOver) {
      saveGameSessionToMongoDB();
    }
  }, [gameOver]);

  return (
    <>
      {/* GAME OVER OVERLAY */}
      {gameOver && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: "2rem 2.5rem",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              maxWidth: 420,
            }}
          >
            <h2 style={{ fontSize: "2.2rem", margin: 0, marginBottom: "0.25rem" }}>GAME OVER</h2>
            <p style={{ margin: 0, color: "#6b7280", marginBottom: "1rem" }}>You missed 5 times</p>
            <p style={{ margin: 0, fontWeight: 700, marginBottom: "1.5rem" }}>Score: {score}</p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#10b981", marginBottom: "1.5rem" }}>✓ Game session saved to MongoDB</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={restartGame}
                style={{
                  padding: "0.8rem 1.4rem",
                  border: "none",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🔄 Restart
              </button>
              <button
                onClick={() => (window.location.href = "/games")}
                style={{
                  padding: "0.8rem 1.4rem",
                  border: "none",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🏠 Home
              </button>
            </div>
          </div>
        </div>
      )}
      {/* START SCREEN / RULES */}
      {!gameStarted && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
          }}
        >
          <h1
            style={{
              color: "white",
              fontSize: "3.5rem",
              marginBottom: "2rem",
              textShadow: "3px 3px 6px rgba(0,0,0,0.3)",
              fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
            }}
          >
            🥷 Ninja Slicer Rules
          </h1>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "30px",
              padding: "3rem 2rem",
              maxWidth: "600px",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#333",
                marginBottom: "2rem",
                fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
              }}
            >
              👇 Click and Slice ONLY the {SHAPE_ICONS[targetShape]} {SHAPE_NAMES[targetShape]} shapes!
            </p>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              {["circle", "square", "triangle", "star"].map((shape) => (
                <div
                  key={shape}
                  style={{
                    padding: "1rem",
                    borderRadius: "15px",
                    background: targetShape === shape ? "#FFD700" : "#f0f0f0",
                    border: targetShape === shape ? "4px solid #FFA500" : "2px solid #ccc",
                    fontSize: "3rem",
                    opacity: targetShape === shape ? 1 : 0.5,
                    transform: targetShape === shape ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {SHAPE_ICONS[shape as ShapeType]}
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#f5f5f5",
                borderRadius: "15px",
                padding: "2rem",
                marginBottom: "2rem",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#555",
                  marginBottom: "1rem",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                📋 <strong>How to Play:</strong>
              </p>
              <ul
                style={{
                  fontSize: "1rem",
                  color: "#666",
                  marginLeft: "2rem",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                <li>✨ Shapes will float across the screen</li>
                <li>🎯 Click and drag to slice shapes</li>
                <li>⭐ Only slice the target shape shown at top-right</li>
                <li>⚠️ Wrong shapes will DECREASE your score by 2!</li>
                <li>🔒 Target shape stays the same during the game</li>
                <li>🧠 Stay focused and be quick!</li>
              </ul>
            </div>

            <button
              onClick={() => setGameStarted(true)}
              style={{
                padding: "1.2rem 3rem",
                fontSize: "1.5rem",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "#333",
                border: "none",
                borderRadius: "30px",
                cursor: "pointer",
                fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
                boxShadow: "0 8px 20px rgba(255, 165, 0, 0.4)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              🚀 START GAME
            </button>
          </div>
        </div>
      )}

      {/* SCORE + MISSES */}
      {gameStarted && (
        <div style={{ position: "fixed", top: 20, left: 20, zIndex: 10 }}>
          <div
            style={{
              color: "#000",
              fontSize: 22,
              fontWeight: "bold",
              background: "rgba(255, 255, 255, 0.9)",
              padding: "1rem 1.5rem",
              borderRadius: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              marginBottom: "0.5rem",
            }}
          >
            Score: {score}
          </div>
          <div
            style={{
              color: misses >= MAX_MISSES - 1 ? "#b91c1c" : "#111827",
              fontSize: 16,
              fontWeight: 700,
              background: "rgba(255, 255, 255, 0.9)",
              padding: "0.6rem 1rem",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            Misses: {misses}/{MAX_MISSES}
          </div>
        </div>
      )}

      {/* TIMER */}
      {gameStarted && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#fff",
            fontSize: "2rem",
            fontWeight: "bold",
            zIndex: 10,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "1rem 2rem",
            borderRadius: "15px",
            boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
            fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
          }}
        >
          ⏱️ {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, "0")}
        </div>
      )}

      {/* CONTROL BUTTONS */}
      {gameStarted && (
        <>
          {/* Restart */}
          <button
            onClick={restartGame}
            style={{
              position: "fixed",
              bottom: 170,
              right: 30,
              padding: "0.9rem 1.6rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 8px 25px rgba(34, 197, 94, 0.4)",
              transition: "all 0.3s ease",
              zIndex: 10,
              fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(34, 197, 94, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(34, 197, 94, 0.4)";
            }}
          >
            🔄 RESTART
          </button>

          {/* Pause/Resume */}
          <button
            onClick={togglePause}
            style={{
              position: "fixed",
              bottom: 100,
              right: 30,
              padding: "0.9rem 1.6rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 8px 25px rgba(245, 158, 11, 0.4)",
              transition: "all 0.3s ease",
              zIndex: 10,
              fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(245, 158, 11, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(245, 158, 11, 0.4)";
            }}
          >
            {isPaused ? "▶️ RESUME" : "⏸️ PAUSE"}
          </button>

          {/* Home */}
          <button
            onClick={() => window.location.href = "/games"}
            style={{
              position: "fixed",
              bottom: 30,
              right: 30,
              padding: "1rem 2rem",
              fontSize: "1.3rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s ease",
              zIndex: 10,
              fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(102, 126, 234, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.4)";
            }}
          >
            🏠 HOME
          </button>
        </>
      )}

      {/* TARGET INDICATOR */}
      {gameStarted && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: "linear-gradient(135deg, #FFD700, #FFA500)",
            padding: "1.2rem 1.5rem",
            borderRadius: "20px",
            boxShadow: "0 8px 25px rgba(255, 0, 0, 0.4)",
            textAlign: "center",
            zIndex: 10,
            border: "4px solid #FF0000",
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              color: "#8B0000",
              margin: "0 0 0.3rem 0",
              fontWeight: "bold",
              textShadow: "1px 1px 2px rgba(255, 215, 0, 0.5)",
            }}
          >
            SELECT:
          </p>
          <p
            style={{
              fontSize: "2.5rem",
              margin: "0",
            }}
          >
            {SHAPE_ICONS[targetShape]}
          </p>
        </div>
      )}

      {/* WRONG SHAPE POPUP */}
      {showWrongPopup && wrongShapeType && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) scale(1.1)",
            background: "linear-gradient(135deg, #ff4757, #ff6348)",
            padding: "3rem 4rem",
            borderRadius: "30px",
            boxShadow: "0 20px 60px rgba(255, 0, 0, 0.5)",
            zIndex: 2000,
            textAlign: "center",
            border: "6px solid #ff2e2e",
            animation: "shake 0.3s ease-in-out",
          }}
        >
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
              25% { transform: translate(-50%, -50%) rotate(-5deg); }
              75% { transform: translate(-50%, -50%) rotate(5deg); }
            }
          `}</style>
          <p
            style={{
              fontSize: "5rem",
              margin: "0 0 1rem 0",
            }}
          >
            ❌
          </p>
          <p
            style={{
              fontSize: "3rem",
              fontWeight: "900",
              color: "white",
              margin: "0 0 1rem 0",
              fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
              textShadow: "3px 3px 6px rgba(0,0,0,0.5)",
            }}
          >
            MISSED!
          </p>
          <p
            style={{
              fontSize: "1.8rem",
              color: "white",
              margin: "0 0 0.5rem 0",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            You sliced {SHAPE_ICONS[wrongShapeType]} {SHAPE_NAMES[wrongShapeType]}
          </p>
          <p
            style={{
              fontSize: "1.5rem",
              color: "#ffeb3b",
              margin: "0",
              fontWeight: "bold",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            -2 Points! 💔
          </p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ background: "#ffffff", display: gameStarted ? "block" : "none" }}
        onMouseDown={() => { if (!isPaused) mouse.current.slicing = true; }}
        onMouseUp={() => (mouse.current.slicing = false)}
        onMouseMove={(e) => movePointer(e.clientX, e.clientY)}
        onTouchStart={() => { if (!isPaused) mouse.current.slicing = true; }}
        onTouchEnd={() => (mouse.current.slicing = false)}
        onTouchMove={(e) =>
          movePointer(e.touches[0].clientX, e.touches[0].clientY)
        }
      />
    </>
  );
};

export default ShapeNinja;
