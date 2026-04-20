import React, { useEffect, useRef, useState } from "react";
import {
  attachVideoElement,
  startEyeTracking,
  subscribeEyeTracking,
} from "../services/eyeTracking";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

const EyeProblemDetector: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeEyeTracking(() => undefined);

    attachVideoElement(videoRef.current);
    startEyeTracking();

    return () => {
      unsubscribe();
      attachVideoElement(null);
    };
  }, []);

  const handleShapeNavigate = (shapeName: string) => {
    const shapeSlug = shapeName.toLowerCase();
    localStorage.setItem('selectedShape', shapeSlug);
    navigate(`/shapes/${shapeSlug}`);
  };

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
            background-size: cover;
            opacity:0.7 ;
            filter: drop-shadow(0 10px 30px rgba(0,0,0,0.15));
            animation: driftBg 10s ease-in-out infinite;
            z-index: 0;
            pointer-events: none;
          }
          /* 3D glossy sphere for circle card */
          .shape-sphere {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            position: relative;
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 18%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.12) 65%, rgba(0,0,0,0.18) 85%),
                        linear-gradient(145deg, rgba(255,107,107,0.9), rgba(255,107,107,0.6), rgba(255,107,107,0.85));
            box-shadow: 0 20px 40px rgba(0,0,0,0.25), inset 0 6px 12px rgba(255,255,255,0.4), inset 0 -10px 16px rgba(0,0,0,0.18);
            transform-style: preserve-3d;
            perspective: 800px;
            animation: rotateSphere 10s ease-in-out infinite;
          }
          .shape-sphere::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.85), rgba(255,255,255,0));
            transform: translateZ(2px);
            pointer-events: none;
          }
          .shape-sphere::after {
            content: "";
            position: absolute;
            top: 18%;
            left: 55%;
            width: 35%;
            height: 28%;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0));
            filter: blur(4px);
            transform: translateZ(4px) rotate(-12deg);
            pointer-events: none;
          }
          @keyframes rotateSphere {
            0% { transform: rotateX(8deg) rotateY(-8deg) translateZ(0); }
            50% { transform: rotateX(14deg) rotateY(10deg) translateZ(3px); }
            100% { transform: rotateX(8deg) rotateY(-8deg) translateZ(0); }
          }
          /* 3D cube for square card */
          .shape-cube {
            position: relative;
            width: 120px;
            height: 120px;
            transform-style: preserve-3d;
            transform: rotateX(-15deg) rotateY(25deg);
            animation: rotateCube 12s ease-in-out infinite;
          }
          .shape-cube .face {
            position: absolute;
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, #4ECDC4 0%, #35b6aa 100%);
            border: 1px solid rgba(0,0,0,0.08);
            box-shadow: inset 0 6px 10px rgba(255,255,255,0.3), inset 0 -8px 12px rgba(0,0,0,0.18);
            opacity: 0.98;
          }
          .shape-cube .front  { transform: translateZ(60px); }
          .shape-cube .back   { transform: rotateY(180deg) translateZ(60px); }
          .shape-cube .right  { transform: rotateY(90deg) translateZ(60px); }
          .shape-cube .left   { transform: rotateY(-90deg) translateZ(60px); }
          .shape-cube .top    { transform: rotateX(90deg) translateZ(60px); }
          .shape-cube .bottom { transform: rotateX(-90deg) translateZ(60px); }
          .shape-cube::after {
            content: "";
            position: absolute;
            inset: -8px;
            border-radius: 16px;
            background: radial-gradient(circle, rgba(255,255,255,0.15), rgba(255,255,255,0));
            filter: blur(8px);
            transform: translateZ(-70px);
            pointer-events: none;
          }
          @keyframes rotateCube {
            0% { transform: rotateX(-15deg) rotateY(25deg); }
            50% { transform: rotateX(20deg) rotateY(-20deg); }
            100% { transform: rotateX(-15deg) rotateY(25deg); }
          }
          /* 3D pyramid for triangle card */
          .shape-pyramid {
            position: relative;
            width: 140px;
            height: 140px;
            transform-style: preserve-3d;
            perspective: 900px;
            animation: rotatePyramid 12s ease-in-out infinite;
            filter: drop-shadow(0 16px 24px rgba(0,0,0,0.25));
            margin: 0 auto;
            transform-origin: 50% 50%;
            display: block;
          }
          .shape-pyramid:hover { animation-duration: 8s; filter: brightness(1.08) drop-shadow(0 20px 32px rgba(0,0,0,0.28)); }
          .shape-pyramid::before,
          .shape-pyramid::after {
            content: "";
            position: absolute;
            inset: 0px;
            border-radius: 18px;
            background: radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25), rgba(255,255,255,0));
            pointer-events: none;
            mix-blend-mode: screen;
          }
          .shape-pyramid::after {
            inset: -10px;
            filter: blur(10px);
            opacity: 0.45;
          }
          .pyramid-face {
            position: absolute;
            width: 140px;
            height: 250px;
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
            transform-style: preserve-3d;
            backface-visibility: hidden;
            border: 1px solid rgba(0,0,0,0.05);
            box-shadow: inset 0 4px 8px rgba(255,255,255,0.25), inset 0 -8px 12px rgba(0,0,0,0.15);
          }
          .pyramid-front  { background: linear-gradient(135deg, #FFE66D 0%, #f7d445 100%); transform: rotateY(0deg) rotateX(58deg) translateZ(70px); }
          .pyramid-right  { background: linear-gradient(135deg, #FFD166 0%, #f4b860 100%); transform: rotateY(120deg) rotateX(58deg) translateZ(70px); }
          .pyramid-left   { background: linear-gradient(135deg, #FFBE6B 0%, #f1a65a 100%); transform: rotateY(240deg) rotateX(58deg) translateZ(70px); }
          .pyramid-base   { background: linear-gradient(135deg, #f7c948 0%, #e0ad36 100%); transform: rotateX(-90deg) translateY(70px) translateZ(10px); }
          @keyframes rotatePyramid {
            0%   { transform: rotateX(8deg) rotateY(-10deg); }
            50%  { transform: rotateX(14deg) rotateY(18deg); }
            100% { transform: rotateX(8deg) rotateY(-10deg); }
          }
          /* 3D playful star for star card */
          .shape-star {
            position: relative;
            width: 140px;
            height: 140px;
            margin: 0 auto;
            display: block;
            clip-path: polygon(50% 5%, 63% 35%, 95% 38%, 70% 59%, 78% 90%, 50% 72%, 22% 90%, 30% 59%, 5% 38%, 37% 35%);
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0) 45%),
                        linear-gradient(145deg, #ffe066 0%, #ffd166 40%, #f4a261 80%, #9ad5ff 100%);
            box-shadow: 0 16px 28px rgba(0,0,0,0.2), inset 0 6px 10px rgba(255,255,255,0.6), inset 0 -10px 14px rgba(0,0,0,0.18);
            border-radius: 14px;
            transform-style: preserve-3d;
            animation: starGlow 10s ease-in-out infinite;
          }
          .shape-star::before {
            content: "";
            position: absolute;
            inset: 0;
            clip-path: inherit;
            background: linear-gradient(120deg, rgba(255,255,255,0.65), rgba(255,255,255,0));
            transform: translateX(-150%);
            transition: transform 0.6s ease-in-out;
            pointer-events: none;
            filter: blur(1px);
          }
          .shape-star::after {
            content: "";
            position: absolute;
            inset: 0;
            clip-path: inherit;
            background: radial-gradient(circle, rgba(255,255,255,0.25), rgba(255,255,255,0));
            mix-blend-mode: screen;
            pointer-events: none;
          }
          .shape-star:hover {
            filter: brightness(1.08) drop-shadow(0 20px 32px rgba(0,0,0,0.25));
            transform: scale(1.05) rotate(2deg);
            animation-duration: 7s;
          }
          .shape-star:hover::before {
            transform: translateX(140%);
          }
          @keyframes starGlow {
            0% { transform: scale(1) rotate(0deg); box-shadow: 0 16px 28px rgba(0,0,0,0.2); }
            50% { transform: scale(1.05) rotate(6deg); box-shadow: 0 20px 36px rgba(0,0,0,0.24); }
            100% { transform: scale(1) rotate(0deg); box-shadow: 0 16px 28px rgba(0,0,0,0.2); }
          }
        `}</style>
        
        {/* SVG background layer */}
        <div className="bg-hero-svg" aria-hidden="true" />
        
        {/* Floating shapes decoration with framer-motion */}
        <motion.div 
          className="floating-shape" 
          style={{ top: '10%', left: '5%', fontSize: '60px' }}
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >⭐</motion.div>
        
        <motion.div 
          className="floating-shape" 
          style={{ top: '20%', right: '10%', fontSize: '50px' }}
          animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >🎈</motion.div>
        
        <motion.div 
          className="floating-shape" 
          style={{ bottom: '15%', right: '15%', fontSize: '45px' }}
          animate={{ y: [0, -25, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >☁️</motion.div>
        
        <motion.div 
          className="floating-shape" 
          style={{ top: '40%', right: '5%', fontSize: '40px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >🎨</motion.div>
        
        <motion.div 
          className="floating-shape" 
          style={{ bottom: '25%', left: '15%', fontSize: '50px' }}
          animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >🦋</motion.div>
        
        <motion.div 
          className="floating-shape" 
          style={{ top: '70%', right: '25%', fontSize: '48px' }}
          animate={{ y: [0, -25, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >✨</motion.div>
        
        <motion.div 
          className="floating-shape" 
          style={{ top: '30%', left: '20%', fontSize: '42px' }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        >🌟</motion.div>
        
        <main className="eye-main" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ height: 20 }} />

          <motion.section 
            className="shape-videos" 
            style={{ marginBottom: '1.5rem' }}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            viewport={{ once: false, margin: "-50px", amount: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -35 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              viewport={{ once: false, margin: "0px", amount: 0.3 }}
              style={{ textAlign: 'center', margin: '0 0 1rem' }}
            >
              <img 
                src="/Learning-Shapes-12-29-2025.gif" 
                alt="Learning Shapes" 
                style={{ maxWidth: '900px', height: 'auto', margin: '0 auto', display: 'block' }}
              />
            </motion.div>

            {/* Shape Cards */}
            <motion.div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '5rem',
                marginTop: '5rem'
              }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: false, margin: "0px", amount: 0.2 }}
            >
              {[
                { name: 'Circle', emoji: '⭕', color: '#FF6B6B' },
                { name: 'Square', emoji: '📦', color: '#4ECDC4' },
                { name: 'Triangle', emoji: '🔺', color: '#FFE66D' },
                { name: 'Star', emoji: '⭐', color: '#95E1D3' }
              ].map((shape, index) => (
                <motion.div
                  key={shape.name}
                  initial={{ opacity: 0, scale: 0.6, y: 40, rotateX: -20 }}
                  whileInView={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    rotateX: 0,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 20,
                      delay: index * 0.12
                    }
                  }}
                  transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
                  viewport={{ once: false, margin: "0px", amount: 0.3 }}
                  whileHover={{ 
                    scale: 1.15,
                    y: -15,
                    rotateY: 8,
                    boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 10
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShapeNavigate(shape.name)}
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '16px',
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(238,242,247,0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                    perspective: '1000px'
                  }}
                >
                  {/* Shimmer effect on hover */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
                      borderRadius: '16px',
                      pointerEvents: 'none'
                    }}
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                  
                  <motion.div
                    style={{ fontSize: '80px', marginBottom: '5rem', position: 'relative', zIndex: 1 }}
                    animate={{ scale: [1, 1.8, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    whileHover={{
                      scale: [1.8, 1.9, 1.9],
                      rotate: [50, -10, 10, 0],
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }}
                  >
                    {shape.name === 'Circle' ? (
                      <div className="shape-sphere" aria-hidden="true" />
                    ) : shape.name === 'Square' ? (
                      <div className="shape-cube" aria-hidden="true">
                        <div className="face front" />
                        <div className="face back" />
                        <div className="face right" />
                        <div className="face left" />
                        <div className="face top" />
                        <div className="face bottom" />
                      </div>
                    ) : shape.name === 'Triangle' ? (
                      <div className="shape-pyramid" aria-hidden="true">
                        <div className="pyramid-face pyramid-front" />
                        <div className="pyramid-face pyramid-right" />
                        <div className="pyramid-face pyramid-left" />
                        <div className="pyramid-face pyramid-base" />
                      </div>
                    ) : shape.name === 'Star' ? (
                      <div className="shape-star" aria-hidden="true" />
                    ) : (
                      shape.emoji
                    )}
                  </motion.div>
                  
                  <motion.h3 
                    style={{ 
                      color: '#111', 
                      fontSize: '24px', 
                      margin: 0, 
                      fontWeight: 'bold',
                      position: 'relative',
                      zIndex: 1
                    }}
                    initial={{ y: 0, opacity: 0.9 }}
                    whileHover={{ 
                      y: -5,
                      opacity: 1,
                      transition: { duration: 0.3 }
                    }}
                  >
                    {shape.name}
                  </motion.h3>
                  
                  <motion.p 
                    style={{ 
                      color: '#4b5563', 
                      marginTop: '0.5rem', 
                      fontSize: '14px', 
                      marginBottom: '1.5rem',
                      position: 'relative',
                      zIndex: 1,
                    }}
                    initial={{ opacity: 0.7 }}
                    whileHover={{ 
                      opacity: 1,
                      transition: { duration: 0.3 }
                    }}
                  >
                    Learn & Play
                  </motion.p>
                  
                  <motion.button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleShapeNavigate(shape.name);
                    }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    whileHover={{ 
                      scale: 1.15, 
                      boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                    whileTap={{ scale: 0.9 }}
                    whileFocus={{ outline: '2px solid white' }}
                    style={{
                      background: 'white',
                      color: shape.color,
                      border: 'none',
                      padding: '12px 32px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      borderRadius: '50px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🚀 Go
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section 
            className="eye-steps"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            viewport={{ once: false, margin: "-50px", amount: 0.2 }}
          >
            <motion.h2
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              viewport={{ once: false, margin: "0px", amount: 0.3 }}
            >
              📋 Easy steps
            </motion.h2>
            <div className="eye-grid">
              {[
                { num: '1', title: 'Set up', desc: 'Sit comfy, bright room, no glare.' },
                { num: '2', title: 'Follow the shapes', desc: 'Track the colors with both eyes, then each eye.' },
                { num: '3', title: 'Check the result', desc: 'If one eye tires or wanders, tell your eye doctor.' }
              ].map((step, index) => (
                <motion.div
                  key={step.num}
                  className="eye-card"
                  initial={{ opacity: 0, x: index === 0 ? -80 : index === 2 ? 80 : 0, y: 50 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 + index * 0.15, ease: "easeOut" }}
                  viewport={{ once: false, margin: "0px", amount: 0.3 }}
                  whileHover={{ y: -15, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', scale: 1.02 }}
                >
                  <span className="eye-step">{step.num}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* 🔽 ADD THE IFRAME HERE */}
          <motion.section 
            className="eye-game"
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            viewport={{ once: false, margin: "-50px", amount: 0.2 }}
          >
            {!gameStarted ? (
              <motion.div 
                className="game-card" 
                onClick={() => setGameStarted(true)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  padding: '30px',
                  maxWidth: '600px',
                  margin: '0 auto',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  textAlign: 'center',
                  color: '#111',
                  cursor: 'pointer',
                  border: '1px solid rgba(238,242,247,0.6)'
                }}
              >
                <motion.div 
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '15px',
                    marginBottom: '20px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}
                  whileHover={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                >
                  <motion.img 
                    src="https://play-lh.googleusercontent.com/U6diDynYIwtCIKQdWrQniG5N44vrSgXUvQlSGlDQxNaVEATUoYul4sfWRyKYDxnLpPsK"
                    alt="Wolfoo Numbers and Shapes Game"
                    loading="lazy"
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      maxHeight: '300px',
                      objectFit: 'cover'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.1 }}
                  />
                </motion.div>
                
                <motion.h2 
                  style={{ 
                    fontSize: '28px', 
                    marginBottom: '15px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  🎨 Numbers & Shapes Adventure! 🌟
                </motion.h2>
                
                <motion.p 
                  style={{ 
                    fontSize: '18px',
                    marginBottom: '25px',
                    opacity: '0.95'
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Join Wolfoo to learn numbers and shapes in a fun way!
                </motion.p>
                
                <motion.div 
                  style={{
                    background: '#ffd166',
                    color: '#2d3142',
                    borderRadius: '50px',
                    padding: '18px 40px',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    display: 'inline-block'
                  }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🎮 Click to Play!
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.2)' }}
              >
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
              </motion.div>
            )}
          </motion.section>
          {/* 🔼 END OF EMBED */}

          <motion.section 
            className="eye-fun"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            viewport={{ once: false, margin: "-50px", amount: 0.2 }}
          >
            <motion.div 
              className="eye-tip-card"
              initial={{ opacity: 0, x: -80, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              viewport={{ once: false, margin: "0px", amount: 0.3 }}
              whileHover={{ y: -10, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', scale: 1.03 }}
            >
              <h3>💡 Friendly tips</h3>
              <ul>
                <li>✨ Cheer and clap.</li>
                <li>⏱️ Short rounds, quick breaks.</li>
                <li>🎁 Stickers for wins.</li>
              </ul>
            </motion.div>

          </motion.section>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EyeProblemDetector;
