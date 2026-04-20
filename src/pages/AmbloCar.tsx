import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Vehicle = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  type: "car" | "truck";
};

const AmbloCar: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [level, setLevel] = useState(1);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const sessionStartTime = useRef(Date.now());
  const failsCount = useRef(0);
  const mongoSavedRef = useRef(false);

  const saveGameSessionToMongoDB = async (status: "won" | "lost") => {
    try {
      const userId = localStorage.getItem("userId") || `guest_${Date.now()}`;
      const sessionData = {
        userId,
        gameType: "amblocar",
        score,
        elapsedTime: time,
        level,
        fails: failsCount.current,
        gameStatus: status,
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
        console.error("Failed to save AmbloCar session:", msg);
      }
    } catch (error) {
      console.error("Error saving AmbloCar session to MongoDB:", error);
    }
  };

  const saveTherapySessionToMongoDB = async (completedSession: any) => {
    try {
      const userId = localStorage.getItem('userId') || 'guest';
      const payload = {
        userId,
        gameTitle: completedSession.gameTitle || 'AmbloCar',
        startTime: completedSession.startTime || new Date(sessionStartTime.current).toISOString(),
        endTime: completedSession.endTime,
        duration: completedSession.duration,
        durationMs: completedSession.durationMs,
        score: completedSession.score,
        fails: completedSession.fails,
        level: completedSession.level,
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

  const size = useRef({ w: window.innerWidth, h: window.innerHeight });
  // Lane positions kept inside the white road area (top buffer 160px, bottom buffer 160px)
  const laneY = [200, 270, 340, 410, 480];

  const man = useRef({
    x: 0,
    y: 0,
    width: 20,
    height: 25,
  });
  const manStep = useRef(false);

  // Level configurations
  const getLevelConfig = (lvl: number): Vehicle[] => {
    switch (lvl) {
      case 1:
        return [
          { x: 400, y: laneY[1], width: 70, height: 24, speed: 2, color: "#FF6F6F", type: "car" },
          { x: 0, y: laneY[0], width: 110, height: 30, speed: -2.2, color: "#6FA8FF", type: "truck" },
          { x: 0, y: laneY[2], width: 75, height: 24, speed: 2.4, color: "#7ED957", type: "car" },
          { x: 450, y: laneY[3], width: 120, height: 32, speed: -2, color: "#FF6F6F", type: "truck" },
          { x: 500, y: laneY[4], width: 120, height: 32, speed: -2, color: "#FF6F6F", type: "truck" }
        ];
      case 2:
        return [
          { x: 0, y: laneY[0], width: 70, height: 24, speed: 2.8, color: "#7ED957", type: "car" },
          { x: 200, y: laneY[0], width: 70, height: 24, speed: 2.8, color: "#9F7ED9", type: "car" },
          { x: 400, y: laneY[1], width: 110, height: 30, speed: -3, color: "#FF6F6F", type: "truck" },
          { x: 0, y: laneY[2], width: 75, height: 24, speed: 3.2, color: "#7ED957", type: "car" },
          { x: 450, y: laneY[3], width: 120, height: 32, speed: -2.8, color: "#FFB347", type: "truck" },
          { x: 100, y: laneY[4], width: 75, height: 24, speed: 3, color: "#FF6F6F", type: "car" },
        ];
      case 3:
        return [
          { x: 0, y: laneY[0], width: 70, height: 24, speed: 3.5, color: "#7ED957", type: "car" },
          { x: 150, y: laneY[0], width: 70, height: 24, speed: 3.5, color: "#FF6F6F", type: "car" },
          { x: 300, y: laneY[0], width: 70, height: 24, speed: 3.5, color: "#9F7ED9", type: "car" },
          { x: 400, y: laneY[1], width: 110, height: 30, speed: -3.5, color: "#6FA8FF", type: "truck" },
          { x: 0, y: laneY[2], width: 75, height: 24, speed: 4, color: "#7ED957", type: "car" },
          { x: 200, y: laneY[2], width: 75, height: 24, speed: 4, color: "#FF6F6F", type: "car" },
          { x: 450, y: laneY[3], width: 120, height: 32, speed: -3.2, color: "#FFB347", type: "truck" },
          { x: 0, y: laneY[4], width: 75, height: 24, speed: 3.8, color: "#9F7ED9", type: "car" },
        ];
      default:
        // Endless mode - super hard
        return [
          { x: 0, y: laneY[0], width: 70, height: 24, speed: 4, color: "#FF6F6F", type: "car" },
          { x: 120, y: laneY[0], width: 70, height: 24, speed: 4, color: "#FF6F6F", type: "car" },
          { x: 240, y: laneY[0], width: 70, height: 24, speed: 4, color: "#FF6F6F", type: "car" },
          { x: 400, y: laneY[1], width: 110, height: 30, speed: -4.5, color: "#6FA8FF", type: "truck" },
          { x: 200, y: laneY[1], width: 110, height: 30, speed: -4.5, color: "#4F88DF", type: "truck" },
          { x: 0, y: laneY[2], width: 75, height: 24, speed: 5, color: "#7ED957", type: "car" },
          { x: 150, y: laneY[2], width: 75, height: 24, speed: 5, color: "#5EB937", type: "car" },
          { x: 450, y: laneY[3], width: 120, height: 32, speed: -4, color: "#FFB347", type: "truck" },
          { x: 0, y: laneY[4], width: 75, height: 24, speed: 4.5, color: "#9F7ED9", type: "car" },
          { x: 180, y: laneY[4], width: 75, height: 24, speed: 4.5, color: "#7F5EB9", type: "car" },
        ];
    }
  };

  const vehicles = useRef<Vehicle[]>(getLevelConfig(1));

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (paused || gameOver || gameWon) return;

    const timer = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [paused, gameOver, gameWon]);

  /* ---------------- BACKGROUND MUSIC ---------------- */
  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audio.src = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // Free background music
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    // Don't auto-play - wait for user interaction

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // Control music based on game state
  useEffect(() => {
    if (!audioRef.current) return;

    if (musicPlaying && !paused && !gameOver && !gameWon) {
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [musicPlaying, paused, gameOver, gameWon]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
      setMusicPlaying(true);
      setAudioInitialized(true);
    }
  };

  /* ---------------- GAME ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      size.current = { w: window.innerWidth, h: window.innerHeight };
      canvas.width = size.current.w;
      canvas.height = size.current.h;

      man.current.x = size.current.w / 2 - 10;
      man.current.y = size.current.h - 80;
    };

    resize();
    window.addEventListener("resize", resize);

    let animationId: number;

    const drawBackground = () => {
      const { w, h } = size.current;

      ctx.fillStyle = "#CDEFFD";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#A7D676";
      ctx.fillRect(0, 80, w, h - 160);

      ctx.fillStyle = "#EDEDED";
      ctx.fillRect(0, 160, w, h - 320);

      ctx.fillStyle = "#D0D0D0";
      ctx.fillRect(0, 80, w, 80);
      ctx.fillRect(0, h - 160, w, 80);
    };

    const drawMan = () => {
      const baseX = man.current.x + 10;
      const baseY = man.current.y + 6;

      // Head
      ctx.fillStyle = "#ffe0b2";
      ctx.beginPath();
      ctx.arc(baseX, baseY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(baseX - 6, baseY + 4, 12, 14);

      // Arms
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(baseX - 6, baseY + 8);
      ctx.lineTo(baseX - 12, baseY + 12);
      ctx.moveTo(baseX + 6, baseY + 8);
      ctx.lineTo(baseX + 12, baseY + 12);
      ctx.stroke();

      // Legs (alternate for simple walking animation)
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (manStep.current) {
        ctx.moveTo(baseX - 3, baseY + 18);
        ctx.lineTo(baseX - 8, baseY + 26);
        ctx.moveTo(baseX + 3, baseY + 18);
        ctx.lineTo(baseX + 10, baseY + 24);
      } else {
        ctx.moveTo(baseX - 3, baseY + 18);
        ctx.lineTo(baseX - 10, baseY + 24);
        ctx.moveTo(baseX + 3, baseY + 18);
        ctx.lineTo(baseX + 8, baseY + 26);
      }
      ctx.stroke();
    };

    const drawVehicle = (v: Vehicle) => {
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(v.x, v.y, v.width, v.height, 10);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(v.x + 10, v.y + 5, v.width / 3, v.height / 2);

      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.arc(v.x + 14, v.y + v.height, 6, 0, Math.PI * 2);
      ctx.arc(v.x + v.width - 14, v.y + v.height, 6, 0, Math.PI * 2);
      ctx.fill();
    };

    const isCollide = (a: any, b: Vehicle) =>
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;

    const update = () => {
      if (paused || gameOver || gameWon) return;

      const { w, h } = size.current;
      ctx.clearRect(0, 0, w, h);

      drawBackground();
      drawMan();

      vehicles.current.forEach((v) => {
        drawVehicle(v);
        v.x += v.speed;

        if (v.speed > 0 && v.x > w) v.x = -v.width;
        if (v.speed < 0 && v.x < -v.width) v.x = w;

        if (isCollide(man.current, v)) {
          failsCount.current += 1;
          setGameOver(true);
        }
      });

      if (man.current.y < 100) {
        setGameWon(true);
        setShowLevelComplete(true);
        setScore((s) => s + 100 * level); // Bonus points based on level
      }

      animationId = requestAnimationFrame(update);
    };

    update();

    const handleKey = (e: KeyboardEvent) => {
      if (paused || gameOver || gameWon) return;

      let moved = false;
      if (e.key === "ArrowUp") {
        man.current.y -= 25;
        moved = true;
      }
      if (e.key === "ArrowDown") {
        man.current.y += 25;
        moved = true;
      }

      if (moved) {
        manStep.current = !manStep.current;
      }

      man.current.y = Math.max(50, Math.min(man.current.y, size.current.h - 80));
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", resize);
    };
  }, [paused, gameOver, gameWon]);

  /* ---------------- SAVE GAME SESSION ---------------- */
  useEffect(() => {
    return () => {
      // Save session on unmount
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
          level: level,
          completed: gameWon
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
  }, [score, level, gameWon]);

  useEffect(() => {
    if ((gameOver || gameWon) && !mongoSavedRef.current) {
      mongoSavedRef.current = true;
      saveGameSessionToMongoDB(gameWon ? "won" : "lost");
    }
  }, [gameOver, gameWon, score, level, time]);

  /* ---------------- RESET ---------------- */
  const resetGame = () => {
    setScore(0);
    setTime(0);
    setGameOver(false);
    setGameWon(false);
    setShowLevelComplete(false);
    setPaused(false);
    setLevel(1);
    vehicles.current = getLevelConfig(1);
    man.current.y = size.current.h - 80;
    manStep.current = false;
    mongoSavedRef.current = false;
    sessionStartTime.current = Date.now();
    failsCount.current = 0;
  };

  const nextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setGameWon(false);
    setShowLevelComplete(false);
    setPaused(false);
    vehicles.current = getLevelConfig(newLevel);
    man.current.y = size.current.h - 80;
    manStep.current = false;
  };

  return (
    <div style={{ margin: 0, overflow: "hidden" }}>
      <canvas ref={canvasRef} />

      {/* TOP LEFT - SCORE */}
      <div style={uiBox("left")}>
        🏆 Score: {score}
        <br />
        🎯 Level: {level}
      </div>

      {/* TOP RIGHT - TIME + PAUSE */}
      <div style={uiBox("right")}>
        ⏱ Time: {time}s
        <br />
        <button onClick={() => setPaused((p) => !p)} style={btnStyle}>
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <br />
        <button onClick={toggleMusic} style={btnStyle}>
          {musicPlaying ? "🔊 Music On" : "🔇 Music Off"}
        </button>
      </div>

      {/* HOME BUTTON */}
      <div style={homeButtonStyle}>
        <button onClick={() => navigate("/games")} style={homeBtnStyle}>
          🏠 Back to Games
        </button>
      </div>

      {/* GAME OVER */}
      {gameOver && (
        <div style={gameOverStyle}>
          <h1>❌ GAME OVER</h1>
          <p>Score: {score}</p>
          <p>Time: {time}s</p>
          <button onClick={resetGame} style={btnStyle}>🔁 Restart</button>
        </div>
      )}

      {/* GAME WON */}
      {gameWon && (
        <div style={gameWonStyle}>
          <h1>🎉 LEVEL {level} COMPLETE!</h1>
          <p>Congratulations! You made it across safely!</p>
          <p>⏱ Time: {time}s</p>
          <p>🏆 Score: {score}</p>
          <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
            {level < 3 ? (
              <button onClick={nextLevel} style={btnStyle}>➡️ Next Level</button>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: "bold", color: "#22c55e" }}>
                  🏆 All Levels Complete! You're a champion!
                </p>
                <button onClick={nextLevel} style={btnStyle}>🔥 Try Endless Mode</button>
              </div>
            )}
            <button onClick={resetGame} style={btnStyle}>🔁 Restart Game</button>
            <button onClick={() => navigate("/games")} style={btnStyle}>🏠 Back to Games</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const uiBox = (side: "left" | "right") => ({
  position: "fixed" as const,
  top: 12,
  [side]: 20,
  background: "rgba(255,255,255,0.75)",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: "bold",
  fontSize: 16,
});

const btnStyle = {
  marginTop: 6,
  padding: "6px 12px",
  borderRadius: 8,
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
};

const homeButtonStyle = {
  position: "fixed" as const,
  bottom: 20,
  left: 20,
  zIndex: 1000,
};

const homeBtnStyle = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "none",
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  color: "white",
  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  transition: "all 0.3s ease",
};

const gameOverStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
};

const gameWonStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "linear-gradient(135deg, rgba(102, 194, 165, 0.95), rgba(35, 155, 86, 0.95))",
  color: "#fff",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  fontSize: 18,
};

export default AmbloCar;
