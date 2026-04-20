import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import EyeTrackingBoot from "./components/EyeTrackingBoot";
import RoleSelection from "./pages/RoleSelection";
import Home from "./pages/Home";
import EyeProblemDetector from "./pages/EyeProblemDetector";
import VisionTherapy from "./pages/VisionTherapy";
import GamesPage from "./pages/GamesPage";
import CircleShape from "./pages/CircleShape";
import SquareShape from "./pages/SquareShape";
import TriangleShape from "./pages/TriangleShape_new";
import StarShape from "./pages/StarShape";
import ShapeNinja from "./pages/ninjagame";
import AmbloCar from "./pages/AmbloCar";
import SnakeGame from "./pages/snake";
import ParentsDashboard from "./pages/ParentsDashboard";

const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const userRole = localStorage.getItem("userRole");
  return userRole ? element : <Navigate to="/role-selection" replace />;
};

const App: React.FC = () => (
  <>
    <EyeTrackingBoot />
    <Routes>
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/" element={<ProtectedRoute element={<Home />} />} />
      <Route path="/eye-problem-detector" element={<ProtectedRoute element={<EyeProblemDetector />} />} />
      <Route path="/vision-therapy" element={<ProtectedRoute element={<VisionTherapy />} />} />
      <Route path="/games" element={<ProtectedRoute element={<GamesPage />} />} />
      <Route path="/games/amblocar" element={<ProtectedRoute element={<AmbloCar />} />} />
      <Route path="/games/ninjagame" element={<ProtectedRoute element={<ShapeNinja />} />} />
      <Route path="/games/snakegame" element={<ProtectedRoute element={<SnakeGame />} />} />
      <Route path="/shapes/circle" element={<ProtectedRoute element={<CircleShape />} />} />
      <Route path="/shapes/square" element={<ProtectedRoute element={<SquareShape />} />} />
      <Route path="/shapes/triangle" element={<ProtectedRoute element={<TriangleShape />} />} />
      <Route path="/shapes/star" element={<ProtectedRoute element={<StarShape />} />} />
      <Route path="/parents-dashboard" element={<ProtectedRoute element={<ParentsDashboard />} />} />
    </Routes>
  </>
);

export default App;
