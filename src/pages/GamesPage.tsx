import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGame, setLoadingGame] = useState("");
  const [selectedGame, setSelectedGame] = useState<{ title: string; icon: string; color1: string; color2: string } | null>(null);

  const sliderImages = [
    "/games_tablet_02.jpg",
    "/maxresdefault.jpg",
    "/Can_Video_Games_Treat_Amblyopia_AmblyoPlay_Blog.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const handlePlayGame = (route: string, gameTitle: string, color1: string, color2: string, icon: string) => {
    // First show selection square
    setSelectedGame({ title: gameTitle, icon, color1, color2 });
    
    // Track vision therapy session
    const sessionData = {
      gameTitle,
      startTime: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      route,
      icon
    };
    localStorage.setItem('currentVisionTherapySession', JSON.stringify(sessionData));
    
    // Then navigate after delay
    setTimeout(() => {
      setIsLoading(true);
      setLoadingGame(gameTitle);
      
      setTimeout(() => {
        navigate(route);
      }, 1500);
    }, 800); // Show selection square for 800ms
  };

  const games = [
    {
      title: "AmbloCar",
      level: "LEVEL 1",
      color1: "#FF4444",
      color2: "#4444FF",
      route: "/games/amblocar",
      image: "/ablocar.png",
      icon: "🚗"
    },
    {
      title: "Ninja",
      level: "LEVEL 2",
      color1: "#FF4444",
      color2: "#4444FF",
      route: "/games/ninjagame",
      image: "/ninja.png",
      icon: "🗡️"
    },
    {
      title: "TRIANGLE",
      level: "LEVEL 3",
      color1: "#FF4444",
      color2: "#4444FF",
      route: "/games/snakegame",
      image: "/snake.png",
      icon: "🐍"
    }
  ];

  const styles = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    @keyframes shimmer {
      0% {
        background-position: -200% center;
      }
      100% {
        background-position: 200% center;
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    @keyframes loadingPulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 1;
      }
      50% { 
        transform: scale(1.2);
        opacity: 0.8;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .games-page {
      min-height: 100vh;
      background: radial-gradient(circle at 20% 20%, rgba(255, 221, 255, 0.6), transparent 30%),
        radial-gradient(circle at 80% 0%, rgba(197, 225, 255, 0.55), transparent 28%),
        linear-gradient(180deg, #e7f2ff 0%, #fef5f4 50%, #f3e5f5 100%);
      position: relative;
      padding-top: 0;
      padding-bottom: 4rem;
    }

    .games-container {
      max-width: 1500px;
      margin: 0 auto;
      padding: 0 1.5rem 1rem;
    }

    .games-header {
      text-align: center;
      padding: 3rem 2rem 2rem;
      background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7));
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.8s ease-out;
    }

    .games-title {
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 900;
      background: linear-gradient(135deg, #FF6B9D, #C44569, #FFA726);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
      font-family: 'Fredoka One', 'Baloo 2', 'Comic Sans MS', sans-serif;
      letter-spacing: 2px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      animation: float 3s ease-in-out infinite;
    }

    .games-subtitle {
      font-size: clamp(1.1rem, 2vw, 1.5rem);
      color: #5D4E6D;
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-family: 'Nunito', sans-serif;
    }

    .slider-container {
      width: 100%;
      margin: 2.5rem 0;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      border-radius: 0;
    }

    .slider-wrapper {
      display: flex;
      transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .slide {
      min-width: 100%;
      position: relative;
    }

    .tablet-image {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
      max-height: 550px;
    }

    .slider-dots {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      z-index: 10;
      padding: 12px 24px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 30px;
      backdrop-filter: blur(10px);
    }

    .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.4s ease;
      border: 2px solid transparent;
    }

    .dot:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: scale(1.2);
    }

    .dot.active {
      background: white;
      width: 40px;
      border-radius: 7px;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
    }

    .games-grid-section {
      padding: 3rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .section-title {
      text-align: center;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      color: #2d3142;
      margin-bottom: 3rem;
      font-family: 'Fredoka One', sans-serif;
      position: relative;
      animation: fadeInUp 0.8s ease-out 0.3s both;
    }

    .section-title::after {
      content: '';
      display: block;
      width: 100px;
      height: 6px;
      background: linear-gradient(90deg, #FF6B9D, #FFA726);
      margin: 1rem auto 0;
      border-radius: 3px;
    }

    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      padding: 0 0.5rem;
    }

    .game-card {
      background: rgba(255, 255, 255, 0.92);
      border-radius: 30px;
      padding: 2.4rem 2rem 2rem;
      box-shadow: 0 18px 50px rgba(20, 24, 62, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.6rem;
      transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
      position: relative;
      overflow: hidden;
      animation: fadeInUp 0.6s ease-out both;
    }

    .game-card:nth-child(1) { animation-delay: 0.4s; }
    .game-card:nth-child(2) { animation-delay: 0.5s; }
    .game-card:nth-child(3) { animation-delay: 0.6s; }
    .game-card:nth-child(4) { animation-delay: 0.7s; }

    .game-card:hover {
      transform: translateY(-10px) scale(1.04);
      box-shadow: 0 260px 600px rgba(300, 42, 74, 0.18);
      border-color: rgba(255, 255, 255, 0.9);
    }

    .game-card::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 29px;
      background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.15), transparent 40%),
        radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.12), transparent 35%);
      pointer-events: none;
      z-index: 0;
    }

    .game-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 30px;
      background: linear-gradient(135deg, var(--color1), var(--color2));
      opacity: 0.12;
      filter: blur(30px);
      z-index: 0;
      transition: opacity 0.35s ease;
    }

    .game-card:hover::after {
      opacity: 0.22;
    }

    .game-level {
      font-size: 0.95rem;
      font-weight: 800;
      color: #9575CD;
      letter-spacing: 2px;
      text-transform: uppercase;
      background: linear-gradient(135deg, #E1BEE7, #F3E5F5);
      padding: 0.5rem 1.5rem;
      border-radius: 20px;
      font-family: 'Nunito', sans-serif;
    }

    .game-title-box {
      background: linear-gradient(135deg, var(--color1), var(--color2));
      width: 100%;
      padding: 2.5rem 1.5rem;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 140px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    .game-title-box::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 3s infinite;
    }

    .game-title-text {
      font-size: clamp(2rem, 4vw, 2.8rem);
      font-weight: 900;
      color: white;
      text-align: center;
      letter-spacing: 4px;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
      font-family: 'Fredoka One', 'Comic Sans MS', sans-serif;
      position: relative;
      z-index: 1;
    }

    .game-visual {
      width: 200px;
      height: 200px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6));
      box-shadow: inset 0 8px 20px rgba(0, 0, 0, 0.08), 0 10px 24px rgba(0, 0, 0, 0.1);
      display: grid;
      place-items: center;
      overflow: hidden;
      position: relative;
      transition: transform 0.35s ease;
    }

    .game-visual::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(145deg, rgba(255,255,255,0.15), transparent);
      pointer-events: none;
    }

    .game-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.35s ease;
    }

    .game-icon {
      font-size: 5rem;
      z-index: 1;
      animation: bounce 2s ease-in-out infinite;
    }

    .game-card:hover .game-visual {
      transform: scale(1.05);
    }

    .game-card:hover .game-image {
      transform: scale(1.08);
    }

    .play-button {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #2d3142;
      border: none;
      border-radius: 50px;
      padding: 1.2rem 3.5rem;
      font-size: 1.6rem;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(255, 165, 0, 0.4);
      transition: all 0.3s ease;
      letter-spacing: 3px;
      font-family: 'Fredoka One', 'Comic Sans MS', sans-serif;
      text-transform: uppercase;
      width: 100%;
      max-width: 220px;
      position: relative;
      overflow: hidden;
    }

    .play-button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    .play-button:hover::before {
      width: 300px;
      height: 300px;
    }

    .play-button:hover {
      transform: scale(1.08);
      box-shadow: 0 12px 30px rgba(255, 165, 0, 0.5);
    }

    .play-button:active {
      transform: scale(0.95);
    }

    .home-button {
      position: fixed;
      top: 100px;
      right: 30px;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      z-index: 1000;
      font-family: 'Nunito', sans-serif;
      letter-spacing: 0.5px;
    }

    .home-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    }

    .home-button:active {
      transform: translateY(-1px);
    }

    @media (max-width: 1024px) {
      .games-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 2rem;
      }
    }

    @media (max-width: 768px) {
      .games-header {
        padding: 2rem 1rem;
      }

      .games-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
        padding: 0;
      }

      .game-card {
        padding: 2rem 1.5rem;
      }

      .slider-dots {
        bottom: 15px;
        padding: 8px 16px;
      }

      .home-button {
        top: 90px;
        right: 15px;
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
      }

      .tablet-image {
        max-height: 300px;
      }
    }

    @media (max-width: 480px) {
      .game-title-box {
        padding: 2rem 1rem;
        min-height: 110px;
      }

      .play-button {
        padding: 1rem 2.5rem;
        font-size: 1.3rem;
      }
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeInUp 0.3s ease-out;
    }

    .loading-content {
      text-align: center;
      color: white;
    }

    .loading-spinner {
      width: 80px;
      height: 80px;
      border: 8px solid rgba(255, 255, 255, 0.3);
      border-top: 8px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 2rem;
    }

    .loading-game-icon {
      font-size: 5rem;
      animation: bounce 1s ease-in-out infinite;
      margin-bottom: 1rem;
    }

    .loading-text {
      font-size: 2.5rem;
      font-weight: 900;
      font-family: 'Fredoka One', 'Comic Sans MS', sans-serif;
      margin-bottom: 1rem;
      animation: loadingPulse 1.5s ease-in-out infinite;
    }

    .loading-subtext {
      font-size: 1.3rem;
      font-weight: 600;
      opacity: 0.9;
      font-family: 'Nunito', sans-serif;
    }

    .loading-dots {
      display: inline-block;
      margin-left: 0.5rem;
    }

    .loading-dots span {
      animation: loadingPulse 1.4s infinite;
      display: inline-block;
    }

    .loading-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .loading-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }
  `;

  return (
    <div>
      <style>{styles}</style>
      <Navbar />
      
      {/* SELECTION SQUARE CONTAINER */}
      {selectedGame && !isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5000,
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${selectedGame.color1}, ${selectedGame.color2})`,
              borderRadius: "40px",
              padding: "4rem 3rem",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              transform: "scale(1)",
              animation: "pulse 0.5s ease-out",
            }}
          >
            <div
              style={{
                fontSize: "6rem",
                marginBottom: "1.5rem",
                animation: "bounce 1s ease-in-out infinite",
              }}
            >
              {selectedGame.icon}
            </div>
            <h2
              style={{
                color: "white",
                fontSize: "3rem",
                fontWeight: "900",
                margin: "1rem 0",
                textShadow: "3px 3px 6px rgba(0,0,0,0.3)",
                fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
                letterSpacing: "2px",
              }}
            >
              {selectedGame.title}
            </h2>
            <p
              style={{
                color: "white",
                fontSize: "1.3rem",
                fontWeight: "600",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              ✨ Get Ready! ✨
            </p>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-game-icon">
              {loadingGame === "AmbloCar" && "🚗"}
              {loadingGame === "Ninja" && "🗡️"}
              {loadingGame === "TRIANGLE" && "🐍"}
            </div>
            <div className="loading-spinner"></div>
            <div className="loading-text">
              Loading {loadingGame} Game
              <span className="loading-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
            <div className="loading-subtext">Get ready to play!</div>
          </div>
        </div>
      )}

      <div className="games-page">
        <button
          type="button"
          className="home-button"
          onClick={() => navigate("/")}
        >
          🏠 Home
        </button>

        <div className="games-container">
          <div className="games-header">
            <h1 className="games-title">🎮 Choose Your Level!</h1>
            <p className="games-subtitle">Select a shape to start learning</p>
          </div>

          <div className="slider-container">
            <div 
              className="slider-wrapper" 
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {sliderImages.map((image, index) => (
                <div key={index} className="slide">
                  <img 
                    src={image} 
                    alt={`Game slide ${index + 1}`}
                    className="tablet-image"
                  />
                </div>
              ))}
            </div>
            <div className="slider-dots">
              {sliderImages.map((_, index) => (
                <div
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>

          <div className="games-grid-section">
            <h2 className="section-title">🎯 Select Your Adventure</h2>
            <div className="games-grid">
            {games.map((game, index) => (
              <div 
                key={index} 
                className="game-card"
                onClick={() => handlePlayGame(game.route, game.title, game.color1, game.color2, game.icon)}
                style={{
                  '--color1': game.color1,
                  '--color2': game.color2,
                  cursor: 'pointer'
                } as React.CSSProperties}
              >
                <div className="game-level">{game.level}</div>
                <div className="game-title-box">
                  <div className="game-title-text">{game.title}</div>
                </div>
                <div className="game-visual">
                  {game.image ? (
                    <img src={game.image} alt={`${game.title} preview`} className="game-image" />
                  ) : (
                    <span className="game-icon">{game.icon}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="play-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayGame(game.route, game.title, game.color1, game.color2, game.icon);
                  }}
                >
                  PLAY
                </button>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GamesPage;
