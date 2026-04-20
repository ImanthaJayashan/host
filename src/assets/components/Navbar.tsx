import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav style={{ padding: "1rem", backgroundColor: "#4f46e5", color: "white" }}>
      <h1>Research Project</h1>
      <ul style={{ display: "flex", listStyle: "none", gap: "1rem" }}>
        <li>Home</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
    </nav>
  );
};

export default Navbar;
