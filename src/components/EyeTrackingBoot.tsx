import { useEffect } from "react";
import { startEyeTracking } from "../services/eyeTracking";

const EyeTrackingBoot = () => {
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "child") {
      startEyeTracking();
    }
  }, []);

  return null;
};

export default EyeTrackingBoot;
