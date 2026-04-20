import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const VisionTherapy: React.FC = () => {
  const navigate = useNavigate();
  const [butterflyPositions, setButterflyPositions] = useState<Array<{ id: number; left: number; top: number }>>([]);
  const [showGlasses, setShowGlasses] = useState(false);

  useEffect(() => {
    setShowGlasses(true);
    // Generate random butterfly positions
    const butterflies = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: Math.random() * 80 + 10,
      top: Math.random() * 30 + 20,
    }));
    setButterflyPositions(butterflies);

    // Initialize vision therapy data if not exists
    if (!localStorage.getItem('visionTherapySessions')) {
      localStorage.setItem('visionTherapySessions', JSON.stringify([]));
    }
  }, []);

  const handleStartTherapy = () => {
    // Mark that therapy has been started
    localStorage.setItem('visionTherapyStarted', 'true');
    localStorage.setItem('visionTherapyStartDate', new Date().toISOString());
    navigate("/games");
  };

  const styles = `
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.5);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    @keyframes flutter {
      0%, 100% {
        transform: rotate(0deg) translateX(0);
      }
      25% {
        transform: rotate(10deg) translateX(10px);
      }
      50% {
        transform: rotate(0deg) translateX(0);
      }
      75% {
        transform: rotate(-10deg) translateX(-10px);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
      }
    }

    .vision-therapy-container {
      min-height: 100vh;
      background: url('/1378627_4982.svg') center / cover no-repeat;
      position: relative;
      overflow: hidden;
      padding-bottom: 8rem; /* keep buttons clear of footer */
    }

    .cloud {
      position: absolute;
      background: white;
      border-radius: 100px;
      opacity: 0.8;
    }

    .cloud1 {
      width: 100px;
      height: 40px;
      top: 10%;
      left: 5%;
      animation: float 6s ease-in-out infinite;
    }

    .cloud2 {
      width: 80px;
      height: 35px;
      top: 20%;
      right: 10%;
      animation: float 8s ease-in-out infinite 1s;
    }

    .cloud3 {
      width: 90px;
      height: 38px;
      top: 15%;
      left: 50%;
      animation: float 7s ease-in-out infinite 0.5s;
    }

    .butterfly {
      position: absolute;
      font-size: 2rem;
      animation: flutter 3s ease-in-out infinite;
      cursor: pointer;
      z-index: 10;
    }

    .main-content {
      position: relative;
      z-index: 20;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 1.5rem;
      padding: 2rem;
      padding-top: 4rem;
      padding-bottom: 6rem; /* extra breathing room above footer */
    }

    .header-text {
      font-size: 3.5rem;
      font-weight: 900;
      color: #ff1493;
      text-shadow: 3px 3px 0 #ff69b4, 6px 6px 0 #ff1493;
      text-align: center;
      margin-bottom: 2rem;
      animation: slideDown 0.8s ease-out;
      font-style: italic;
      letter-spacing: 2px;
      line-height: 1.2;
    }

    .glasses-container {
      margin: 2rem 0;
      animation: fadeInScale 0.6s ease-out 0.3s both;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .glasses {
      font-size: 8rem;
      filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
      animation: bounce 2s ease-in-out infinite;
      transform-origin: center;
    }

    .go-text {
      font-size: 8rem;
      font-weight: 900;
      color: #7fff00;
      text-shadow: 3px 3px 0 #32cd32, 6px 6px 0 #228b22;
      animation: fadeInScale 0.8s ease-out 0.6s both;
      letter-spacing: 3px;
      font-style: italic;
    }

    .go-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      margin: 0;
      transition: transform 0.2s ease, filter 0.2s ease;
    }

    .go-button:hover {
      transform: scale(1.02) translateY(-4px);
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25));
    }

    .go-button:active {
      transform: scale(0.99);
    }

    .home-button {
      position: absolute;
      top: 20px;
      right: 20px;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: bold;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      z-index: 40;
      animation: slideDown 0.6s ease-out;
    }

    .home-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }

    .home-button:active {
      transform: translateY(0px);
    }

    .flowers-container {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 150px;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      padding: 2rem 1rem 1rem;
      z-index: 30;
    }

    .flower {
      font-size: 3.5rem;
      animation: float 4s ease-in-out infinite;
    }

    .flower:nth-child(1) { animation-delay: 0s; }
    .flower:nth-child(2) { animation-delay: 0.3s; }
    .flower:nth-child(3) { animation-delay: 0.6s; }
    .flower:nth-child(4) { animation-delay: 0.9s; }
    .flower:nth-child(5) { animation-delay: 1.2s; }
    .flower:nth-child(6) { animation-delay: 1.5s; }
    .flower:nth-child(7) { animation-delay: 1.8s; }
    .flower:nth-child(8) { animation-delay: 2.1s; }
  `;

  return (
    <div>
      <style>{styles}</style>
      <Navbar />
      <div className="vision-therapy-container">

        {/* Main Content */}
        <div className="main-content">
          <button
            type="button"
            className="home-button"
            onClick={() => navigate("/")}
          >
            🏠 Home
          </button>

          <div className="glasses-container">
            <img 
              src="/put-on-your-3d-Glasses-1-18-2026.gif" 
              alt="3D Glasses"
              style={{
                width: "90vw",
                maxWidth: "1000px",
                height: "auto",
                filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))",
              }}
            />
            <img 
              src="/pngimg.com - glasses_PNG43.png" 
              alt="Glasses"
              style={{
                width: "400px",
                height: "auto",
                marginTop: "2rem",
                filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))",
              }}
            />
          </div>

          <button
            type="button"
            className="go-text go-button"
            onClick={handleStartTherapy}
            aria-label="Start vision therapy"
          >
            GO!
          </button>
        </div>

        
      </div>
      <Footer />
    </div>
  );
};

export default VisionTherapy;
