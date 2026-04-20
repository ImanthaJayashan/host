import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section style={{ textAlign: "center", padding: "4rem 1rem", backgroundColor: "#e0e7ff" }}>
      <h2>Welcome to Our Research Project</h2>
      <p>Interactive e-learning system with eye health monitoring for preschool children.</p>
      <button style={{ padding: "0.5rem 1rem", marginTop: "1rem", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "5px" }}>
        Learn More
      </button>
    </section>
  );
};

export default HeroSection;
