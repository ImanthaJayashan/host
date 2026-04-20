import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EyeProblemDetector: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="eye-page">
      <Navbar />

      <div className="eye-bg-shell" style={{
        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #ffeaa7 100%)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated floating shapes and SVG background */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes float2 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-30px) translateX(10px); }
          }
          @keyframes float3 {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-25px) scale(1.1); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes driftBg {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-18px) scale(1.02); }
          }
          .floating-shape {
            position: absolute;
            opacity: 0.6;
            pointer-events: none;
            z-index: 0;
          }
          .bg-hero-svg {
            position: absolute;
            inset: 0;
            background-image: url('/vecteezy_happy-school-kids-go-to-school_10195647.svg');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            opacity: 0.35;
            filter: drop-shadow(0 10px 30px rgba(0,0,0,0.15));
            animation: driftBg 10s ease-in-out infinite;
            z-index: 0;
            pointer-events: none;
          }
        `}</style>
        
        {/* SVG background layer */}
        <div className="bg-hero-svg" aria-hidden="true" />
        
        {/* Floating shapes decoration */}
        <div className="floating-shape" style={{ top: '10%', left: '5%', fontSize: '60px', animation: 'float 6s ease-in-out infinite' }}>⭐</div>
        <div className="floating-shape" style={{ top: '20%', right: '10%', fontSize: '50px', animation: 'float2 5s ease-in-out infinite', animationDelay: '1s' }}>🎈</div>
        <div className="floating-shape" style={{ bottom: '15%', right: '15%', fontSize: '45px', animation: 'float 5.5s ease-in-out infinite', animationDelay: '0.5s' }}>☁️</div>
        <div className="floating-shape" style={{ top: '40%', right: '5%', fontSize: '40px', animation: 'spin 10s linear infinite' }}>🎨</div>
        <div className="floating-shape" style={{ bottom: '25%', left: '15%', fontSize: '50px', animation: 'float2 6.5s ease-in-out infinite', animationDelay: '1.5s' }}>🦋</div>
        <div className="floating-shape" style={{ top: '70%', right: '25%', fontSize: '48px', animation: 'float3 6s ease-in-out infinite' }}>✨</div>
        <div className="floating-shape" style={{ top: '30%', left: '20%', fontSize: '42px', animation: 'float 7s ease-in-out infinite', animationDelay: '3s' }}>🌟</div>
        
        <main className="eye-main" style={{ position: 'relative', zIndex: 1 }}>
        <div className="eye-hero" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eye-bubble eye-bubble-1" />
          <div className="eye-bubble eye-bubble-2" />
          <div className="eye-bubble eye-bubble-3" />

          <div className="eye-hero-content">
            <div className="eye-left">
              <Link className="eye-back" to="/">
                ← Back to tools
              </Link>
              <p className="eye-tag">Ages 5-6 · Gentle checks</p>
              <h1>Eye Problem Detector</h1>
              <p className="eye-sub">Follow the bright shapes with your eyes. Quick, kind, and no scary stuff.</p>

              <div className="eye-actions">
                <button type="button" className="eye-btn">Start</button>
                <button type="button" className="eye-btn ghost">Steps</button>
              </div>

              <div className="eye-badges">
                <span className="eye-badge">Bright colors</span>
                <span className="eye-badge">Super quick</span>
              </div>
            </div>

            <div className="eye-right">
              <div className="eye-illustration">
                <div className="eye-face" aria-hidden="true">👀</div>
                <p className="eye-illu-text">Follow the bouncing star!</p>
                <div className="eye-stars" aria-hidden="true">
                  <span>★</span>
                  <span>✦</span>
                  <span>★</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="eye-steps">
          <h2>Easy steps</h2>
          <div className="eye-grid">
            <div className="eye-card">
              <span className="eye-step">1</span>
              <h3>Set up</h3>
              <p>Sit comfy, bright room, no glare.</p>
            </div>
            <div className="eye-card">
              <span className="eye-step">2</span>
              <h3>Follow the shapes</h3>
              <p>Track the colors with both eyes, then each eye.</p>
            </div>
            <div className="eye-card">
              <span className="eye-step">3</span>
              <h3>Check the result</h3>
              <p>If one eye tires or wanders, tell your eye doctor.</p>
            </div>
          </div>
        </section>

        {/* 🔽 ADD THE IFRAME HERE */}
        <section className="eye-game">
          {!gameStarted ? (
            <div 
              className="game-card" 
              onClick={() => setGameStarted(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '600px',
                margin: '0 auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                textAlign: 'center',
                color: 'white',
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
              }}
            >
              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '15px',
                marginBottom: '20px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src="https://play-lh.googleusercontent.com/U6diDynYIwtCIKQdWrQniG5N44vrSgXUvQlSGlDQxNaVEATUoYul4sfWRyKYDxnLpPsK"
                  alt="Wolfoo Numbers and Shapes Game"
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    maxHeight: '300px',
                    objectFit: 'cover'
                  }}
                />
              </div>
              
              <h2 style={{ 
                fontSize: '28px', 
                marginBottom: '15px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
              }}>
                🎨 Numbers & Shapes Adventure! 🌟
              </h2>
              
              <p style={{ 
                fontSize: '18px',
                marginBottom: '25px',
                opacity: '0.95'
              }}>
                Join Wolfoo to learn numbers and shapes in a fun way!
              </p>
              
              <div style={{
                background: '#ffd166',
                color: '#2d3142',
                borderRadius: '50px',
                padding: '18px 40px',
                fontSize: '22px',
                fontWeight: 'bold',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                display: 'inline-block'
              }}>
                🎮 Click to Play!
              </div>
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.2)' }}>
              <iframe 
                src="https://www.madkidgames.com/full/wolfoo-learns-numbers-and-shapes"
                width="100%" 
                height="540" 
                frameBorder="0" 
                allowFullScreen 
                scrolling="no"
                style={{ display: 'block', backgroundColor: '#ffffff', opacity: 1 }}
              >
              </iframe>
            </div>
          )}
        </section>
        {/* 🔼 END OF EMBED */}

        <section className="eye-fun">
          <div className="eye-tip-card">
            <h3>Friendly tips</h3>
            <ul>
              <li>Cheer and clap.</li>
              <li>Short rounds, quick breaks.</li>
              <li>Stickers for wins.</li>
            </ul>
          </div>

          <div className="eye-tip-card">
            <h3>Next: add your flow</h3>
            <p>Plug in your camera or API later. Show a fun progress bar and a happy chime.</p>
          </div>
        </section>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EyeProblemDetector;
