import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { startEyeTracking } from "../services/eyeTracking";

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"child" | "parent" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = async (role: "child" | "parent") => {
    setSelected(role);
    setIsLoading(true);
    localStorage.setItem("userRole", role);
    
    // Trigger eye tracking if child
    if (role === "child") {
      await startEyeTracking();
    }
    
    setTimeout(() => navigate("/"), 800);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          textAlign: "center",
          maxWidth: "600px",
        }}
      >
        <h1 style={{
          color: "white",
          fontSize: "3rem",
          fontWeight: "bold",
          marginBottom: "20px",
          fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif",
        }}>
          👋 Welcome!
        </h1>
        
        <p style={{
          color: "rgba(255,255,255,0.9)",
          fontSize: "1.2rem",
          marginBottom: "50px",
        }}>
          Are you a Child or a Parent?
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginBottom: "40px",
          opacity: isLoading ? 0.5 : 1,
          pointerEvents: isLoading ? "none" : "auto",
        }}>
          {/* Child Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleRoleSelect("child")}
            disabled={isLoading}
            style={{
              padding: "40px 20px",
              borderRadius: "20px",
              border: selected === "child" ? "4px solid #fff" : "none",
              background: "rgba(255,255,255,0.95)",
              cursor: isLoading ? "wait" : "pointer",
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: "#667eea",
              transition: "all 0.3s ease",
              boxShadow: selected === "child" ? "0 10px 40px rgba(0,0,0,0.3)" : "0 5px 20px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "10px" }}>👧👦</div>
            <div>I'm a Child</div>
          </motion.button>

          {/* Parent Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleRoleSelect("parent")}
            disabled={isLoading}
            style={{
              padding: "40px 20px",
              borderRadius: "20px",
              border: selected === "parent" ? "4px solid #fff" : "none",
              background: "rgba(255,255,255,0.95)",
              cursor: isLoading ? "wait" : "pointer",
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: "#764ba2",
              transition: "all 0.3s ease",
              boxShadow: selected === "parent" ? "0 10px 40px rgba(0,0,0,0.3)" : "0 5px 20px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "10px" }}>👨‍👩‍👧‍👦</div>
            <div>I'm a Parent</div>
          </motion.button>
        </div>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            ✓ {selected === "child" ? "Starting eye checking..." : "Welcome, Parent!"}
          </motion.div>
        )}

        {!isLoading && (
          <p style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "0.9rem",
          }}>
            {selected === "child" && "✓ Eye checking will start automatically"}
            {selected === "parent" && "✓ Eye checking is disabled for parents"}
            {!selected && "Select your role to continue"}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default RoleSelection;
