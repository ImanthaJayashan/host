import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Footer from "../components/Footer";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const games = [
    {
      title: "NUMBERS",
      image: "numbers.jpg",
      color: "#8B4513",
      route: "/games/numbers"
    },
    {
      title: "COLORS",
      image: "colors.png",
      color: "#228B22",
      route: "/games/colors"
    },
    {
      title: "LETTERS",
      image: "letters.png",
      color: "#1E3A8A",
      route: "/games/letters"
    },
    {
      title: "SHAPES",
      image: "shapes.png",
      color: "#7C3AED",
      route: "/eye-problem-detector"
    }
  ];

  const features = [
    {
      icon: "🔒",
      title: "Safe & Secure",
      description: "End-to-end encryption and COPPA-compliant data handling."
    },
    {
      icon: "🎮",
      title: "Interactive Fun",
      description: "Engaging games and activities that make learning exciting."
    },
    {
      icon: "👁️",
      title: "Health Tracking",
      description: "Monitor eye health and detect early warning signs."
    },
    {
      icon: "🏆",
      title: "Reward System",
      description: "Earn stars and badges to motivate continued learning."
    }
  ];

  return (
    <div>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
          
          <div
            style={{
              fontSize: "4rem",
              marginBottom: "2rem",
              animation: "spin 1s linear infinite",
            }}
          >
            🔍
          </div>

          <h2
            style={{
              color: "white",
              fontSize: "2rem",
              fontWeight: "bold",
              margin: "0 0 1rem 0",
              fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
            }}
          >
            Detecting Eye Health...
          </h2>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#7C3AED",
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <Navbar />
      <HeroSection />

      {/* Games Section */}
      <section className="games-section">
        <div className="games-grid">
          {games.map((game, index) => (
            <div key={index} className="game-card">
              <div className="game-image">
                <img src={game.image} alt={game.title} />
              </div>
              <h3 className="game-title">{game.title}</h3>
              <button 
                className="game-play-btn"
                style={{ backgroundColor: game.color }}
                onClick={() => {
                  if (game.title === "SHAPES") {
                    setIsLoading(true);
                    setTimeout(() => navigate(game.route), 1500);
                  } else {
                    navigate(game.route);
                  }
                }}
              >
                PLAY
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose-section">
        <div className="section-badge">
          <span className="badge-icon">⭐</span>
          <span>Why Choose Us</span>
        </div>
        <h2 className="section-title">
          Made For <span className="highlight">Little Learners</span>
        </h2>
        <p className="section-subtitle">
          Our platform is designed with your child's safety, health, and happiness in mind.
        </p>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
