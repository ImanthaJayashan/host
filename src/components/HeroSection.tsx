import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section 
      className="hero-section"
      style={{
        backgroundImage: 'url(/Gemini_Generated_Image_59abxw59abxw59ab.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="hero-container">
        <div className="hero-content">
          <p className="hero-subtitle">E-learning online</p>
          <h1 className="hero-title">Let’s Learn & Play Together!</h1>
          <p className="hero-description">Discover a world of the interactive learning experience combined with intelligent health monitoring system for young learners.</p>
          <button className="hero-cta">Learn more</button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
