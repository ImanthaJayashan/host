import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ParentsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"eye" | "writing" | "reading" | "auditory" | "insights" | "detailed">("eye");
  const [latestEyeResult, setLatestEyeResult] = useState<any>(null);
  const [eyeStatus, setEyeStatus] = useState("Waiting for detection...");
  const [historyPeriod, setHistoryPeriod] = useState<7 | 14 | 21>(7);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [visionTherapySessions, setVisionTherapySessions] = useState<any[]>([]);
  const [learningStats, setLearningStats] = useState({
    circle: { ms: 0, visits: 0, lastVisit: null as string | null },
    square: { ms: 0, visits: 0, lastVisit: null as string | null },
    triangle: { ms: 0, visits: 0, lastVisit: null as string | null },
    star: { ms: 0, visits: 0, lastVisit: null as string | null },
    lastUpdated: null as string | null,
  });

  const apiBase = (import.meta as any).env?.VITE_BACKEND_URL?.replace(/\/$/, "") || "";
  const latestUrl = apiBase ? `${apiBase}/latest` : "/api/latest";
  const historyUrl = apiBase ? `${apiBase}/history` : "/api/history";
  const minConfidence = 0.55;
  const minSmoothCount = 3;
  const maxStaleMs = 15000;

  const normalizeEyeResult = (data: any) => {
    if (!data || data.message === "no results yet") return null;
    const label = data.smooth_label ?? data.label;
    const confidence = data.smooth_confidence ?? data.confidence;
    const smoothCount = data.smooth_count ?? 0;
    const isUncertain = Boolean(data.is_uncertain);
    const timestamp = data.timestamp ? new Date(data.timestamp).getTime() : null;
    const isStale = timestamp ? Date.now() - timestamp > maxStaleMs : false;

    if (!label || typeof confidence !== "number" || isUncertain || isStale) return null;
    if (data.smooth_label && smoothCount < minSmoothCount) return null;
    if (confidence < minConfidence) return null;

    return { ...data, label, confidence };
  };

  useEffect(() => {
    if (activeTab !== "eye") return;

    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch(latestUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("No data");
        const data = await res.json();
        if (!isMounted) return;
        const normalized = normalizeEyeResult(data);
        if (normalized) {
          setLatestEyeResult(normalized);
          setEyeStatus("Live updates");
        } else {
          setEyeStatus("Waiting for detection...");
        }
      } catch {
        if (!isMounted) return;
        const cached = localStorage.getItem("latestEyeDetection");
        if (cached) {
          const normalized = normalizeEyeResult(JSON.parse(cached));
          if (normalized) {
            setLatestEyeResult(normalized);
            setEyeStatus("Local cache");
          } else {
            setEyeStatus("Waiting for detection...");
          }
        } else {
          setEyeStatus("Waiting for detection...");
        }
      }
    };

    fetchLatest();
    const id = window.setInterval(fetchLatest, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(id);
    };
  }, [activeTab, latestUrl]);

  useEffect(() => {
    const readLearningStats = () => {
      const circleMs = Number(localStorage.getItem("learningTime_circle") || "0");
      const squareMs = Number(localStorage.getItem("learningTime_square") || "0");
      const triangleMs = Number(localStorage.getItem("learningTime_triangle") || "0");
      const starMs = Number(localStorage.getItem("learningTime_star") || "0");

      const circleVisits = Number(localStorage.getItem("learningVisits_circle") || "0");
      const squareVisits = Number(localStorage.getItem("learningVisits_square") || "0");
      const triangleVisits = Number(localStorage.getItem("learningVisits_triangle") || "0");
      const starVisits = Number(localStorage.getItem("learningVisits_star") || "0");

      const circleLast = localStorage.getItem("learningLastVisit_circle");
      const squareLast = localStorage.getItem("learningLastVisit_square");
      const triangleLast = localStorage.getItem("learningLastVisit_triangle");
      const starLast = localStorage.getItem("learningLastVisit_star");

      setLearningStats({
        circle: { ms: circleMs, visits: circleVisits, lastVisit: circleLast },
        square: { ms: squareMs, visits: squareVisits, lastVisit: squareLast },
        triangle: { ms: triangleMs, visits: triangleVisits, lastVisit: triangleLast },
        star: { ms: starMs, visits: starVisits, lastVisit: starLast },
        lastUpdated: localStorage.getItem("learningLastUpdated"),
      });
    };

    readLearningStats();
    const id = window.setInterval(readLearningStats, 5000);
    return () => window.clearInterval(id);
  }, []);

  // Load vision therapy sessions
  useEffect(() => {
    const loadSessions = () => {
      try {
        const sessionsStr = localStorage.getItem('visionTherapySessions');
        if (sessionsStr) {
          const sessions = JSON.parse(sessionsStr);
          setVisionTherapySessions(sessions);
        }
      } catch (error) {
        console.error('Error loading vision therapy sessions:', error);
      }
    };

    loadSessions();
    const id = window.setInterval(loadSessions, 5000);
    return () => window.clearInterval(id);
  }, []);

  // Fetch eye check history
  useEffect(() => {
    if (activeTab !== "eye") return;

    let isMounted = true;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`${historyUrl}?days=${historyPeriod}`, { cache: "no-store" });
        if (!res.ok) throw new Error("No history data");
        const data = await res.json();
        if (!isMounted) return;
        setHistoryData(data);
      } catch (err) {
        if (!isMounted) return;
        setHistoryData(null);
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [activeTab, historyPeriod, historyUrl]);

  const formatDuration = (ms: number) => {
    if (!ms) return "0 min";
    if (ms < 60000) return "<1 min";
    const minutes = Math.round(ms / 60000);
    return `${minutes} min`;
  };

  const formatLastVisit = (iso: string | null) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Colombo'
    });
  };

  const formatRangeDate = (iso: string | null) => {
    if (!iso) return "N/A";
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Colombo",
    });
  };

  const historyRecords = Array.isArray(historyData?.records) ? historyData.records : [];
  const validHistoryRecords = historyRecords
    .map((record: any) => ({
      ...record,
      parsedTime: record?.timestamp ? new Date(record.timestamp).getTime() : NaN,
    }))
    .filter((record: any) => Number.isFinite(record.parsedTime));

  const periodStartIso = validHistoryRecords.length > 0
    ? new Date(Math.min(...validHistoryRecords.map((record: any) => record.parsedTime))).toISOString()
    : null;
  const periodEndIso = validHistoryRecords.length > 0
    ? new Date(Math.max(...validHistoryRecords.map((record: any) => record.parsedTime))).toISOString()
    : null;

  const normalChecks = historyData?.daily_summary?.reduce(
    (total: number, day: any) => total + (day.normal_count || 0),
    0
  ) || 0;
  const attentionChecks = historyData?.daily_summary?.reduce(
    (total: number, day: any) => total + (day.lazy_eye_count || 0),
    0
  ) || 0;
  const hasHistoryForHealth = validHistoryRecords.length > 0;

  const overallEyeHealth = hasHistoryForHealth
    ? attentionChecks === 0
      ? {
        icon: "✅",
        title: "All Systems Normal",
        message: "No concerning patterns detected across selected days",
        bgColor: "#f0fdf4",
        borderColor: "#10b981",
        titleColor: "#10b981",
        messageColor: "#059669",
      }
      : normalChecks >= attentionChecks
        ? {
          icon: "⚠️",
          title: "Mostly Normal",
          message: "Some attention-needed patterns observed in selected days",
          bgColor: "#fffbeb",
          borderColor: "#f59e0b",
          titleColor: "#d97706",
          messageColor: "#b45309",
        }
        : {
          icon: "🚨",
          title: "Attention Needed",
          message: "Concerning patterns are dominant in selected days",
          bgColor: "#fef2f2",
          borderColor: "#ef4444",
          titleColor: "#dc2626",
          messageColor: "#b91c1c",
        }
    : {
      icon: "ℹ️",
      title: "Not Enough Data",
      message: "No valid checks found for selected days",
      bgColor: "#f3f4f6",
      borderColor: "#9ca3af",
      titleColor: "#4b5563",
      messageColor: "#6b7280",
    };

  const StatCard = ({ icon, title, value, change, color }: any) => (
    <div style={{
      background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
      border: `2px solid ${color}40`,
      padding: "20px",
      borderRadius: "16px",
      transition: "all 0.3s ease",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`;
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <span style={{ fontSize: "2rem" }}>{icon}</span>
        <span style={{ fontSize: "0.75rem", color: change > 0 ? "#10b981" : "#ef4444", fontWeight: "bold" }}>
          {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
        </span>
      </div>
      <h4 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "0.9rem", fontWeight: "600" }}>{title}</h4>
      <p style={{ margin: "0", color: color, fontSize: "1.8rem", fontWeight: "bold" }}>{value}</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "60px 20px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          top: "-100px",
          right: "-100px"
        }} />
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1
        }}>
          <h1 style={{
            fontSize: "3rem",
            fontWeight: "bold",
            marginBottom: "10px",
            fontFamily: "'Fredoka One', 'Comic Sans MS', sans-serif"
          }}>
            👋 Welcome Back!
          </h1>
          <p style={{ fontSize: "1.2rem", opacity: "0.9", marginBottom: "20px" }}>
            Emma's Learning Journey is Amazing! Keep up the fantastic work.
          </p>
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            {[
              { emoji: "🎉", text: "2 Achievements Unlocked" },
              { emoji: "🔥", text: "7-Day Streak" },
              { emoji: "⭐", text: "85/100 Rating" }
            ].map((badge, idx) => (
              <div key={idx} style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "10px 20px",
                borderRadius: "24px",
                fontSize: "0.95rem",
                fontWeight: "600",
                backdropFilter: "blur(10px)"
              }}>
                {badge.emoji} {badge.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Quick Stats - Changes based on active tab */}
        <div style={{ marginBottom: "50px" }}>
          <h2 style={{
            fontSize: "1.8rem",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "24px"
          }}>
            Quick Overview - {
              activeTab === "eye" ? "👁️ Eye Health & Vision" :
              activeTab === "writing" ? "✏️ Writing Issues" :
              activeTab === "reading" ? "📖 Reading & Speech" :
              "👂 Auditory Response"
            }
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px"
          }}>
            {activeTab === "eye" && (
              <>
                <StatCard 
                  icon="👁️" 
                  title="Eye Health Status" 
                  value={
                    latestEyeResult 
                      ? (latestEyeResult.label === "normal_eye" ? "Excellent" : "Needs Care")
                      : "Pending"
                  }
                  change={latestEyeResult ? (latestEyeResult.label === "normal_eye" ? 8 : -5) : 0}
                  color="#0284c7" 
                />
                <StatCard 
                  icon="🎯" 
                  title="Latest Detection" 
                  value={latestEyeResult ? latestEyeResult.label.replace(/_/g, " ").toUpperCase() : "No Data"}
                  change={0}
                  color="#f59e0b" 
                />
                <StatCard 
                  icon="📊" 
                  title="Confidence Score" 
                  value={latestEyeResult ? `${(latestEyeResult.confidence * 100).toFixed(0)}%` : "N/A"}
                  change={latestEyeResult ? Math.round((latestEyeResult.confidence - 0.5) * 20) : 0}
                  color="#10b981" 
                />
                <StatCard 
                  icon="⏱️" 
                  title="Last Update" 
                  value={
                    latestEyeResult && latestEyeResult.timestamp
                      ? new Date(latestEyeResult.timestamp).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })
                      : "N/A"
                  }
                  change={0}
                  color="#ec4899" 
                />
              </>
            )}

            {activeTab === "writing" && (
              <>
                <StatCard icon="✏️" title="Writing Skills" value="Good" change={12} color="#f59e0b" />
                <StatCard icon="🖊️" title="Handwriting Score" value="85%" change={10} color="#667eea" />
                <StatCard icon="📝" title="Practice Sessions" value="24" change={18} color="#ec4899" />
                <StatCard icon="⭐" title="Improvement Rate" value="9%" change={7} color="#10b981" />
              </>
            )}

            {activeTab === "reading" && (
              <>
                <StatCard icon="📖" title="Reading Level" value="Advanced" change={12} color="#0284c7" />
                <StatCard icon="🗣️" title="Speech Clarity" value="95%" change={8} color="#10b981" />
                <StatCard icon="📚" title="Books Completed" value="18" change={22} color="#667eea" />
                <StatCard icon="🎯" title="Comprehension" value="92%" change={14} color="#ec4899" />
              </>
            )}

            {activeTab === "auditory" && (
              <>
                <StatCard icon="👂" title="Hearing Assessment" value="Normal" change={0} color="#8b5cf6" />
                <StatCard icon="🔊" title="Sound Recognition" value="90%" change={11} color="#0284c7" />
                <StatCard icon="🎵" title="Listening Skills" value="Excellent" change={9} color="#10b981" />
                <StatCard icon="⚡" title="Response Time" value="Fast" change={6} color="#f59e0b" />
              </>
            )}
          </div>
        </div>

        {activeTab === "eye" && (
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "40px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#1f2937" }}>📊 Real-time Eye Detection Results</h3>
              <span style={{ 
                fontSize: "0.85rem", 
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: "20px",
                background: eyeStatus === "Live updates" ? "#d1fae5" : "#fef3c7",
                color: eyeStatus === "Live updates" ? "#065f46" : "#92400e"
              }}>
                {eyeStatus}
              </span>
            </div>

            {latestEyeResult ? (
              <div style={{ display: "grid", gap: "20px" }}>
                {/* Eye Health Summary */}
                <div style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                  border: "2px solid #86efac",
                  padding: "20px",
                  borderRadius: "12px"
                }}>
                  <h4 style={{ margin: "0 0 16px 0", color: "#15803d", fontSize: "1.1rem", fontWeight: 700 }}>
                    ✨ Vision Coordination Monitoring
                  </h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    {/* Condition Type */}
                    <div style={{
                      background: "white",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #d1fae5"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "1.2rem" }}>✓</span>
                        <span style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>Condition Type</span>
                      </div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: latestEyeResult.label === "normal_eye" ? "#10b981" : "#f59e0b" }}>
                        {latestEyeResult.label === "normal_eye" ? "Normal" : "Attention Needed"}
                      </div>
                    </div>

                    {/* Overall Status */}
                    <div style={{
                      background: "white",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #d1fae5"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "1.2rem" }}>💪</span>
                        <span style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>Overall Status</span>
                      </div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: latestEyeResult.confidence > 0.8 ? "#10b981" : "#f59e0b" }}>
                        {latestEyeResult.confidence > 0.8 ? "Healthy" : "Good"}
                      </div>
                    </div>

                    {/* Development Pattern */}
                    <div style={{
                      background: "white",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #d1fae5"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "1.2rem" }}>📈</span>
                        <span style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>Development</span>
                      </div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0284c7" }}>
                        Normal Pattern
                      </div>
                    </div>
                  </div>

                  {latestEyeResult.gaze_analysis && (
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #d1fae5" }}>
                      <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "10px" }}>
                        <strong>Visual Attention:</strong>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", fontSize: "0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{latestEyeResult.gaze_analysis.looking_at_screen ? "✓" : "○"}</span>
                          <span>Looking at Screen</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{latestEyeResult.gaze_analysis.eye_openness === "normal" ? "✓" : "○"}</span>
                          <span>Eyes Open</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{latestEyeResult.gaze_analysis.horizontal_alignment === "centered" ? "✓" : "○"}</span>
                          <span>Aligned Properly</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Detection Result */}
                <div style={{
                  background: latestEyeResult.label === "normal_eye" 
                    ? "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)" 
                    : "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
                  borderLeft: `5px solid ${latestEyeResult.label === "normal_eye" ? "#10b981" : "#ef4444"}`,
                  padding: "16px",
                  borderRadius: "8px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div>
                      <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "4px" }}>Detection Result</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: latestEyeResult.label === "normal_eye" ? "#059669" : "#dc2626" }}>
                        {latestEyeResult.label === "normal_eye" ? "✓ Normal Eye" : "⚠️ Lazy Eye Detected"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "4px" }}>Confidence</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                        {(latestEyeResult.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {latestEyeResult.is_uncertain && (
                    <div style={{ color: "#b45309", fontSize: "0.9rem", fontWeight: 600 }}>
                      ⚠️ {latestEyeResult.uncertainty_reason}
                    </div>
                  )}
                </div>

                {/* Detailed Metrics */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px"
                }}>
                  <div style={{ background: "#f3f4f6", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Lazy Eye Score</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ef4444" }}>
                      {latestEyeResult.lazy_eye_confidence !== null && latestEyeResult.lazy_eye_confidence !== undefined
                        ? `${(latestEyeResult.lazy_eye_confidence * 100).toFixed(1)}%`
                        : "N/A"}
                    </div>
                  </div>
                  
                  <div style={{ background: "#f3f4f6", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Smoothed Label</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0284c7" }}>
                      {latestEyeResult.smooth_label ? latestEyeResult.smooth_label.replace(/_/g, " ").toUpperCase() : "N/A"}
                    </div>
                  </div>

                  <div style={{ background: "#f3f4f6", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Smooth Confidence</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b" }}>
                      {latestEyeResult.smooth_confidence !== null && latestEyeResult.smooth_confidence !== undefined
                        ? `${(latestEyeResult.smooth_confidence * 100).toFixed(1)}%`
                        : "N/A"}
                    </div>
                  </div>

                  <div style={{ background: "#f3f4f6", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Last Updated</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                      {latestEyeResult.timestamp ? (
                        <>
                          <div>{new Date(latestEyeResult.timestamp).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric'
                          })}</div>
                          <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "4px" }}>
                            {new Date(latestEyeResult.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              second: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </>
                      ) : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Gaze Analysis if available */}
                {latestEyeResult.gaze_analysis && (
                  <div style={{
                    background: "#f0f9ff",
                    border: "1px solid #bfdbfe",
                    padding: "16px",
                    borderRadius: "8px"
                  }}>
                    <h4 style={{ margin: "0 0 12px 0", color: "#1e40af", fontSize: "1rem" }}>🔍 Gaze Analysis</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", fontSize: "0.9rem" }}>
                      <div>
                        <span style={{ color: "#6b7280" }}>Looking at Screen:</span> 
                        <span style={{ fontWeight: 600, marginLeft: "8px" }}>
                          {latestEyeResult.gaze_analysis.looking_at_screen ? "✓ Yes" : "✗ No"}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#6b7280" }}>Gaze Direction:</span>
                        <span style={{ fontWeight: 600, marginLeft: "8px" }}>
                          {latestEyeResult.gaze_analysis.gaze_direction}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#6b7280" }}>Eye Openness:</span>
                        <span style={{ fontWeight: 600, marginLeft: "8px" }}>
                          {latestEyeResult.gaze_analysis.eye_openness}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#6b7280" }}>Alignment:</span>
                        <span style={{ fontWeight: 600, marginLeft: "8px" }}>
                          {latestEyeResult.gaze_analysis.horizontal_alignment}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                background: "#fef3c7", 
                border: "1px solid #fcd34d",
                padding: "16px", 
                borderRadius: "8px",
                color: "#92400e"
              }}>
                📹 No eye detection results yet. Start eye tracking on the Eye Problem Detector page to see live data here.
              </div>
            )}
          </div>
        )}

        {/* Eye Check History Analytics - NEW SECTION */}
        {activeTab === "eye" && (
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "28px",
            marginBottom: "40px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb"
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "1.4rem", color: "#1f2937", fontWeight: 900 }}>
                📊 Eye Check History & Analytics
              </h3>
            </div>

            {/* Period Tabs */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
              {[
                { days: 7, label: "7 Days" },
                { days: 14, label: "14 Days" },
                { days: 21, label: "21 Days" }
              ].map(period => (
                <button
                  key={period.days}
                  onClick={() => setHistoryPeriod(period.days as 7 | 14 | 21)}
                  style={{
                    padding: "10px 24px",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: historyPeriod === period.days ? "white" : "#6b7280",
                    background: historyPeriod === period.days 
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                      : "#f3f4f6",
                    border: historyPeriod === period.days ? "2px solid #667eea" : "2px solid #e5e7eb",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: historyPeriod === period.days ? "0 4px 12px rgba(102, 126, 234, 0.3)" : "none"
                  }}
                  onMouseEnter={(e) => {
                    if (historyPeriod !== period.days) {
                      e.currentTarget.style.background = "#e5e7eb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (historyPeriod !== period.days) {
                      e.currentTarget.style.background = "#f3f4f6";
                    }
                  }}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Loading State */}
            {historyLoading && (
              <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#6b7280",
                fontSize: "0.95rem"
              }}>
                ⏳ Loading history data...
              </div>
            )}

            {/* No Data State */}
            {!historyLoading && (!historyData || historyData.total_checks === 0) && (
              <div style={{
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                padding: "24px",
                borderRadius: "12px",
                color: "#92400e",
                textAlign: "center"
              }}>
                📭 No eye check history available for the selected period. Start eye tracking to collect data!
              </div>
            )}

            {/* History Data Display */}
            {!historyLoading && historyData && historyData.total_checks > 0 && (
              <div>
                {/* Summary Stats */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px",
                  marginBottom: "28px"
                }}>
                  <div style={{
                    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                    padding: "18px",
                    borderRadius: "12px",
                    border: "2px solid #0284c7"
                  }}>
                    <div style={{ fontSize: "0.85rem", color: "#0c4a6e", fontWeight: 600, marginBottom: "8px" }}>
                      Total Checks
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0284c7" }}>
                      {historyData.total_checks}
                    </div>
                  </div>

                  <div style={{
                    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                    padding: "18px",
                    borderRadius: "12px",
                    border: "2px solid #10b981"
                  }}>
                    <div style={{ fontSize: "0.85rem", color: "#065f46", fontWeight: 600, marginBottom: "8px" }}>
                      Normal Checks
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#10b981" }}>
                      {historyData.daily_summary?.filter((d: any) => d.normal_count > 0).reduce((acc: number, d: any) => acc + d.normal_count, 0) || 0}
                    </div>
                  </div>

                  <div style={{
                    background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                    padding: "18px",
                    borderRadius: "12px",
                    border: "2px solid #ef4444"
                  }}>
                    <div style={{ fontSize: "0.85rem", color: "#991b1b", fontWeight: 600, marginBottom: "8px" }}>
                      Attention Needed
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ef4444" }}>
                      {historyData.daily_summary?.filter((d: any) => d.lazy_eye_count > 0).reduce((acc: number, d: any) => acc + d.lazy_eye_count, 0) || 0}
                    </div>
                  </div>

                  <div style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    padding: "18px",
                    borderRadius: "12px",
                    border: "2px solid #f59e0b"
                  }}>
                    <div style={{ fontSize: "0.85rem", color: "#92400e", fontWeight: 600, marginBottom: "8px" }}>
                      Active Days
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#f59e0b" }}>
                      {historyData.daily_summary?.length || 0}/{historyPeriod}
                    </div>
                  </div>
                </div>

                {/* Day-by-Day Timeline */}
                <div style={{
                  background: "#f9fafb",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb"
                }}>
                  <h4 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", color: "#1f2937", fontWeight: 900 }}>
                    📅 Day-by-Day Analysis
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {historyData.daily_summary?.map((day: any, idx: number) => {
                      const normalPercent = day.total_checks > 0 ? (day.normal_count / day.total_checks) * 100 : 0;
                      const lazyPercent = day.total_checks > 0 ? (day.lazy_eye_count / day.total_checks) * 100 : 0;
                      
                      return (
                        <div key={idx} style={{
                          background: "white",
                          padding: "18px",
                          borderRadius: "10px",
                          border: "2px solid #e5e7eb",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                          e.currentTarget.style.borderColor = "#667eea";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.borderColor = "#e5e7eb";
                        }}>
                          {/* Day Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                            <div>
                              <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#1f2937" }}>
                                {new Date(day.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "4px" }}>
                                {day.total_checks} check{day.total_checks !== 1 ? 's' : ''} performed
                              </div>
                            </div>
                            <div style={{
                              background: day.status === 'normal' 
                                ? "linear-gradient(135deg, #10b981, #059669)" 
                                : "linear-gradient(135deg, #f59e0b, #d97706)",
                              color: "white",
                              padding: "8px 16px",
                              borderRadius: "20px",
                              fontSize: "0.85rem",
                              fontWeight: 900
                            }}>
                              {day.status === 'normal' ? '✓ Normal Day' : '⚠️ Needs Care'}
                            </div>
                          </div>

                          {/* Progress Bars */}
                          <div style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 700 }}>
                                Normal: {day.normal_count}
                              </span>
                              <span style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 900 }}>
                                {normalPercent.toFixed(0)}%
                              </span>
                            </div>
                            <div style={{
                              width: "100%",
                              height: "8px",
                              backgroundColor: "#e5e7eb",
                              borderRadius: "4px",
                              overflow: "hidden"
                            }}>
                              <div style={{
                                width: `${normalPercent}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #10b981, #34d399)",
                                borderRadius: "4px",
                                transition: "width 0.4s ease"
                              }} />
                            </div>
                          </div>

                          <div style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: 700 }}>
                                Lazy Eye: {day.lazy_eye_count}
                              </span>
                              <span style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: 900 }}>
                                {lazyPercent.toFixed(0)}%
                              </span>
                            </div>
                            <div style={{
                              width: "100%",
                              height: "8px",
                              backgroundColor: "#e5e7eb",
                              borderRadius: "4px",
                              overflow: "hidden"
                            }}>
                              <div style={{
                                width: `${lazyPercent}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #ef4444, #f87171)",
                                borderRadius: "4px",
                                transition: "width 0.4s ease"
                              }} />
                            </div>
                          </div>

                          {/* Average Confidence */}
                          <div style={{
                            background: "#f0f9ff",
                            padding: "10px",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            color: "#0c4a6e",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}>
                            <span style={{ fontWeight: 600 }}>Average Confidence:</span>
                            <span style={{ fontWeight: 900, fontSize: "0.95rem" }}>
                              {(day.avg_confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trend Chart Visualization */}
                <div style={{
                  marginTop: "28px",
                  background: "white",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "2px solid #e5e7eb"
                }}>
                  <h4 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", color: "#1f2937", fontWeight: 900 }}>
                    📈 Check Frequency Trend
                  </h4>
                  
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(historyData.daily_summary?.length || 1, historyPeriod)}, 1fr)`,
                    gap: "8px",
                    alignItems: "end",
                    height: "200px"
                  }}>
                    {historyData.daily_summary?.map((day: any, idx: number) => {
                      const maxChecks = Math.max(...(historyData.daily_summary?.map((d: any) => d.total_checks) || [1]));
                      const height = Math.max(20, (day.total_checks / maxChecks) * 180);
                      
                      return (
                        <div key={idx} style={{ textAlign: "center" }}>
                          <div style={{
                            height: `${height}px`,
                            background: day.status === 'normal'
                              ? "linear-gradient(180deg, #10b981, #059669)"
                              : "linear-gradient(180deg, #f59e0b, #d97706)",
                            borderRadius: "8px 8px 0 0",
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 900,
                            fontSize: "0.9rem",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            transition: "all 0.2s ease",
                            cursor: "pointer"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                          }}>
                            {day.total_checks}
                          </div>
                          <div style={{ 
                            fontSize: "0.75rem", 
                            color: "#6b7280",
                            fontWeight: 700,
                            transform: "rotate(-45deg)",
                            transformOrigin: "center",
                            whiteSpace: "nowrap",
                            marginTop: "8px"
                          }}>
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs Navigation - Assessment Categories */}
        <div style={{
          display: "flex",
          gap: "120px",
          marginBottom: "30px",
          borderBottom: "2px solid #e5e7eb",
          overflowX: "auto",
          paddingBottom: "10px"
        }}>
          {[
            { id: "eye", label: "👁️ Eye Health & Vision" },
            { id: "writing", label: "✏️ Writing Issues" },
            { id: "reading", label: "📖 Reading & Speech" },
            { id: "auditory", label: "👂 Auditory Response" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "12px 20px",
                fontSize: "0.95rem",
                fontWeight: "600",
                color: activeTab === tab.id ? "#667eea" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #667eea" : "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                marginBottom: "-2px",
                whiteSpace: "nowrap"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Based on Tab */}
        {activeTab === "eye" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "30px"
          }}>
            {/* Left: Profile & Summary */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              {/* Profile Card */}
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "30px",
                borderRadius: "16px",
                textAlign: "center",
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)"
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  margin: "0 auto 16px"
                }}>
                  👧
                </div>
                <h2 style={{ fontSize: "1.8rem", margin: "0 0 8px 0", fontFamily: "'Fredoka One', sans-serif" }}>Emma</h2>
                <p style={{ fontSize: "1rem", opacity: "0.9", margin: "0 0 16px 0" }}>Age 5 years old</p>
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "0.9rem"
                }}>
                  📍 Grade: Pre-School | 🎯 Level: Advanced
                </div>
              </div>

              {/* Health Status */}
              <div style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}>
                <h3 style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  💚 Health Status
                </h3>
                <div style={{
                  backgroundColor: overallEyeHealth.bgColor,
                  border: `2px solid ${overallEyeHealth.borderColor}`,
                  padding: "16px",
                  borderRadius: "12px",
                  marginBottom: "12px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "1.5rem" }}>{overallEyeHealth.icon}</span>
                    <span style={{ fontSize: "1rem", fontWeight: "bold", color: overallEyeHealth.titleColor }}>
                      {overallEyeHealth.title}
                    </span>
                  </div>
                  <p style={{ color: overallEyeHealth.messageColor, fontSize: "0.85rem", margin: "0" }}>
                    {overallEyeHealth.message}
                  </p>
                </div>
                <p style={{ color: "#666", fontSize: "0.85rem", margin: "0" }}>
                  Valid result period: {formatRangeDate(periodStartIso)} - {formatRangeDate(periodEndIso)}
                </p>
              </div>

              {/* Parent Details Card */}
              <div style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}>
                <h3 style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  👨‍👩‍👧 Parent Details
                </h3>

                {/* Primary Parent */}
                <div style={{
                  backgroundColor: "#f3f4f6",
                  padding: "14px",
                  borderRadius: "10px",
                  marginBottom: "14px",
                  borderLeft: "4px solid #667eea"
                }}>
                  <p style={{
                    margin: "0 0 8px 0",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "#667eea",
                    textTransform: "uppercase"
                  }}>
                    Primary Parent
                  </p>
                  <p style={{
                    margin: "0 0 6px 0",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Sarah Johnson
                  </p>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.85rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666" }}>
                      <span>📧</span>
                      <a href="mailto:sarah.johnson@email.com" style={{ color: "#667eea", textDecoration: "none" }}>
                        sarah.johnson@email.com
                      </a>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666" }}>
                      <span>📱</span>
                      <a href="tel:+94712345678" style={{ color: "#667eea", textDecoration: "none" }}>
                        +94 71 234 5678
                      </a>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666" }}>
                      <span>🏠</span>
                      <span>123 Flower Lane, Colombo 7</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Parent */}
                <div style={{
                  backgroundColor: "#f9fafb",
                  padding: "14px",
                  borderRadius: "10px",
                  borderLeft: "4px solid #10b981"
                }}>
                  <p style={{
                    margin: "0 0 8px 0",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "#10b981",
                    textTransform: "uppercase"
                  }}>
                    Secondary Parent
                  </p>
                  <p style={{
                    margin: "0 0 6px 0",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Michael Johnson
                  </p>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.85rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666" }}>
                      <span>📧</span>
                      <a href="mailto:michael.johnson@email.com" style={{ color: "#10b981", textDecoration: "none" }}>
                        michael.johnson@email.com
                      </a>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666" }}>
                      <span>📱</span>
                      <a href="tel:+94771234567" style={{ color: "#10b981", textDecoration: "none" }}>
                        +94 77 123 4567
                      </a>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666" }}>
                      <span>🏠</span>
                      <span>123 Flower Lane, Colombo 7</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div style={{
                  backgroundColor: "#fef2f2",
                  padding: "12px",
                  borderRadius: "10px",
                  marginTop: "14px",
                  border: "1px solid #fecaca"
                }}>
                  <p style={{
                    margin: "0 0 8px 0",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "#991b1b",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    🚨 Emergency Contact
                  </p>
                  <p style={{
                    margin: "0 0 6px 0",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Dr. Emma Watson (Pediatrician)
                  </p>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#666",
                    fontSize: "0.85rem"
                  }}>
                    <span>📞</span>
                    <a href="tel:+94761234567" style={{ color: "#ef4444", textDecoration: "none", fontWeight: "bold" }}>
                      +94 76 123 4567
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detailed Sections */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              {/* Eye Health Section */}
              <div style={{
                background: "linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)",
                padding: "28px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(2, 132, 199, 0.12)",
                border: "2px solid #0284c7"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "24px"
                }}>
                  <h3 style={{
                    fontSize: "1.5rem",
                    fontWeight: "900",
                    color: "#0c4a6e",
                    marginBottom: "0",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}>
                    <span style={{ fontSize: "2rem" }}>👁️</span> Eye Health & Vision
                  </h3>
                  <button style={{
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "white",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)"
                  }} onMouseOver={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                  }} onMouseOut={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(239, 68, 68, 0.2)";
                  }}>
                    📋 Schedule Check-up
                  </button>
                </div>

                <div style={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  padding: "16px",
                  borderRadius: "12px",
                  borderLeft: "5px solid #0284c7",
                  marginBottom: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}>
                  <p style={{ margin: "0", color: "#0c4a6e", fontSize: "0.95rem", fontWeight: "500" }}>
                    ✨ Vision coordination monitoring shows <span style={{ fontWeight: "bold", color: "#10b981" }}>normal development pattern</span>
                  </p>
                </div>

                {/* Eye Checking Details with Time Periods - Enhanced */}
                <div style={{
                  background: "white",
                  padding: "18px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  border: "2px solid #e5e7eb",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                }}>
                  <h4 style={{
                    fontSize: "1.05rem",
                    fontWeight: "900",
                    color: "#0c4a6e",
                    marginBottom: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{ fontSize: "1.2rem" }}>📋</span> Eye Checking History
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(() => {
                      const latestTs = latestEyeResult?.timestamp ? new Date(latestEyeResult.timestamp) : null;
                      const history = [
                        {
                          check: "Last Eye Check",
                          time: latestTs
                            ? latestTs.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })
                            : "No recent check",
                          period: latestTs ? "✓ Current" : "Waiting",
                          highlight: true,
                        },
                      ];

                      if (latestTs) {
                        const prev1 = new Date(latestTs.getTime() - 6 * 60 * 60 * 1000);
                        const prev2 = new Date(latestTs.getTime() - 24 * 60 * 60 * 1000);
                        const prev3 = new Date(latestTs.getTime() - 7 * 24 * 60 * 60 * 1000);
                        history.push(
                          {
                            check: "Previous Check",
                            time: prev1.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            }),
                            period: "Earlier today",
                            highlight: false,
                          },
                          {
                            check: "Focus Test",
                            time: prev2.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            }),
                            period: "1 day ago",
                            highlight: false,
                          },
                          {
                            check: "Vision Screening",
                            time: prev3.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            }),
                            period: "1 week ago",
                            highlight: false,
                          }
                        );
                      }

                      return history.map((item, idx) => (
                        <div key={idx} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px",
                          backgroundColor: item.highlight ? "#dbeafe" : "#f9fafb",
                          borderRadius: "10px",
                          borderLeft: item.highlight ? "4px solid #0284c7" : "2px solid #e5e7eb",
                          transition: "all 0.2s ease",
                          border: item.highlight ? "2px solid #0284c7" : "1px solid #e5e7eb"
                        }}>
                          <div>
                            <p style={{ margin: "0", fontSize: "0.95rem", fontWeight: "700", color: "#1f2937" }}>
                              {item.check}
                            </p>
                            <p style={{ margin: "6px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
                              {item.time}
                            </p>
                          </div>
                          <span style={{
                            backgroundColor: item.highlight ? "#0284c7" : "#f3f4f6",
                            color: item.highlight ? "white" : "#374151",
                            padding: "8px 14px",
                            borderRadius: "20px",
                            fontSize: "0.8rem",
                            fontWeight: "700",
                            transition: "all 0.2s ease"
                          }}>
                            {item.period}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Vision Therapy Progress Section - Dynamic */}
                <div style={{
                  background: "linear-gradient(135deg, #fff5e6 0%, #fef3c7 100%)",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  border: "3px solid #f59e0b",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)"
                }}>
                  {(() => {
                    const totalSessions = visionTherapySessions.length;
                    const therapyStarted = localStorage.getItem('visionTherapyStarted') === 'true';
                    const startDate = localStorage.getItem('visionTherapyStartDate');
                    
                    // Calculate days since start
                    let daysSinceStart = 0;
                    let activeDays = 0;
                    if (startDate) {
                      const start = new Date(startDate);
                      const now = new Date();
                      daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // Count unique days with sessions
                      const uniqueDays = new Set(
                        visionTherapySessions.map(s => new Date(s.startTime).toDateString())
                      );
                      activeDays = uniqueDays.size;
                    }
                    
                    const completionPercent = Math.min(100, (daysSinceStart / 21) * 100);
                    
                    // Get last 5 sessions
                    const recentSessions = [...visionTherapySessions]
                      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                      .slice(0, 5);
                    
                    // Calculate current week (1-5+)
                    const currentWeek = Math.min(5, Math.floor(daysSinceStart / 7) + 1);
                    
                    if (!therapyStarted || totalSessions === 0) {
                      return (
                        <div style={{ textAlign: "center", padding: "20px" }}>
                          <h4 style={{
                            fontSize: "1.1rem",
                            fontWeight: "900",
                            color: "#92400e",
                            marginBottom: "16px"
                          }}>
                            <span style={{ fontSize: "1.3rem" }}>🎯</span> Vision Therapy Progress
                          </h4>
                          <p style={{ color: "#92400e", marginBottom: "16px" }}>
                            No therapy sessions recorded yet. Click "Start Vision Therapy" below to begin!
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        <h4 style={{
                          fontSize: "1.1rem",
                          fontWeight: "900",
                          color: "#92400e",
                          marginBottom: "16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <span style={{ fontSize: "1.3rem" }}>🎯</span> Vision Therapy Progress - Stage 1
                        </h4>

                        {/* Stage 1 Completion Progress */}
                        <div style={{ marginBottom: "18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                            <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#333" }}>
                              Stage 1 Completion (21 Days)
                            </span>
                            <span style={{ 
                              fontSize: "0.9rem", 
                              fontWeight: "900", 
                              color: "#f59e0b",
                              backgroundColor: "#fff8e1",
                              padding: "4px 12px",
                              borderRadius: "20px"
                            }}>
                              {activeDays}/21 Days
                            </span>
                          </div>
                          <div style={{
                            width: "100%",
                            height: "14px",
                            backgroundColor: "#fef3c7",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #fbbf24"
                          }}>
                            <div style={{
                              width: `${completionPercent}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, #f59e0b, #fbbf24, #fcd34d)",
                              borderRadius: "8px",
                              transition: "width 0.4s ease",
                              boxShadow: "0 0 8px rgba(245, 158, 11, 0.3)"
                            }} />
                          </div>
                        </div>

                        {/* Sessions Done */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                          marginBottom: "16px"
                        }}>
                          <div style={{
                            backgroundColor: "rgba(255,255,255,0.8)",
                            padding: "14px",
                            borderRadius: "10px",
                            border: "2px solid #fcd34d"
                          }}>
                            <p style={{ margin: "0", fontSize: "0.85rem", color: "#92400e", fontWeight: "700", textTransform: "uppercase" }}>
                              Total Sessions
                            </p>
                            <p style={{ margin: "8px 0 0 0", fontSize: "1.5rem", fontWeight: "900", color: "#f59e0b" }}>
                              {totalSessions} Session{totalSessions !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div style={{
                            backgroundColor: "rgba(255,255,255,0.8)",
                            padding: "14px",
                            borderRadius: "10px",
                            border: "2px solid #10b981",
                            background: "linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%)"
                          }}>
                            <p style={{ margin: "0", fontSize: "0.85rem", color: "#047857", fontWeight: "700", textTransform: "uppercase" }}>
                              Last Session
                            </p>
                            <p style={{ margin: "8px 0 0 0", fontSize: "1.1rem", fontWeight: "900", color: "#10b981" }}>
                              {recentSessions[0] ? new Date(recentSessions[0].startTime).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                timeZone: 'Asia/Colombo'
                              }) : 'N/A'}
                            </p>
                            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#059669" }}>
                              {recentSessions[0] ? new Date(recentSessions[0].startTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                                timeZone: 'Asia/Colombo'
                              }) : ''}
                            </p>
                          </div>
                        </div>

                        {/* Performance Statistics */}
                        {(() => {
                          const totalScore = visionTherapySessions.reduce((sum, s) => sum + (s.score || 0), 0);
                          const totalFails = visionTherapySessions.reduce((sum, s) => sum + (s.fails || 0), 0);
                          const totalPlayTime = visionTherapySessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
                          const avgPlayTime = totalSessions > 0 ? Math.round(totalPlayTime / totalSessions / 60000) : 0;
                          
                          return (
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr",
                              gap: "10px",
                              marginBottom: "16px"
                            }}>
                              <div style={{
                                backgroundColor: "rgba(16, 185, 129, 0.1)",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "2px solid #10b981",
                                textAlign: "center"
                              }}>
                                <p style={{ margin: "0", fontSize: "0.75rem", color: "#047857", fontWeight: "700", textTransform: "uppercase" }}>
                                  Total Score
                                </p>
                                <p style={{ margin: "6px 0 0 0", fontSize: "1.3rem", fontWeight: "900", color: "#10b981" }}>
                                  🎯 {totalScore}
                                </p>
                              </div>
                              <div style={{
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "2px solid #ef4444",
                                textAlign: "center"
                              }}>
                                <p style={{ margin: "0", fontSize: "0.75rem", color: "#991b1b", fontWeight: "700", textTransform: "uppercase" }}>
                                  Total Fails
                                </p>
                                <p style={{ margin: "6px 0 0 0", fontSize: "1.3rem", fontWeight: "900", color: "#ef4444" }}>
                                  ❌ {totalFails}
                                </p>
                              </div>
                              <div style={{
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "2px solid #3b82f6",
                                textAlign: "center"
                              }}>
                                <p style={{ margin: "0", fontSize: "0.75rem", color: "#1e40af", fontWeight: "700", textTransform: "uppercase" }}>
                                  Avg Time
                                </p>
                                <p style={{ margin: "6px 0 0 0", fontSize: "1.3rem", fontWeight: "900", color: "#3b82f6" }}>
                                  ⏱️ {avgPlayTime} min
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Recent Session History */}
                        {recentSessions.length > 0 && (
                          <div style={{
                            marginBottom: "14px",
                            borderTop: "2px solid #fbbf24",
                            paddingTop: "12px"
                          }}>
                            <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: "900", color: "#92400e" }}>
                              ⏱️ Last {Math.min(5, recentSessions.length)} Session{recentSessions.length !== 1 ? 's' : ''}:
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {recentSessions.map((session, idx) => (
                                <div key={idx} style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: "0.9rem",
                                  padding: "10px",
                                  backgroundColor: "rgba(255,255,255,0.5)",
                                  borderRadius: "8px",
                                  transition: "all 0.2s ease",
                                  border: "1px solid rgba(255,255,255,0.8)"
                                }}>
                                  <div style={{ flex: 1 }}>
                                    <div>
                                      <span style={{ fontWeight: "700", color: "#333" }}>
                                        {session.gameTitle} {session.icon}
                                      </span>
                                      <span style={{ color: "#666", marginLeft: "10px", fontSize: "0.85rem" }}>
                                        • {new Date(session.startTime).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true,
                                          timeZone: 'Asia/Colombo'
                                        })}
                                      </span>
                                    </div>
                                    <div style={{ 
                                      display: "flex", 
                                      gap: "12px", 
                                      marginTop: "4px",
                                      fontSize: "0.8rem",
                                      color: "#666"
                                    }}>
                                      {session.score !== undefined && (
                                        <span>🎯 Score: <strong style={{ color: "#10b981" }}>{session.score}</strong></span>
                                      )}
                                      {session.fails !== undefined && (
                                        <span>❌ Fails: <strong style={{ color: "#ef4444" }}>{session.fails}</strong></span>
                                      )}
                                      {(session.level !== undefined || session.misses !== undefined) && (
                                        <span>{session.level ? `🎮 Level: ${session.level}` : `🎯 Misses: ${session.misses}`}</span>
                                      )}
                                    </div>
                                  </div>
                                  <span style={{ 
                                    color: "#f59e0b", 
                                    fontWeight: "900", 
                                    fontSize: "0.95rem",
                                    whiteSpace: "nowrap",
                                    marginLeft: "12px"
                                  }}>
                                    ⏱️ {session.duration || '<1 min'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Weekly Schedule */}
                        <div style={{
                          backgroundColor: "white",
                          border: "2px solid #0284c7",
                          padding: "16px",
                          borderRadius: "10px",
                          marginTop: "14px",
                          boxShadow: "0 2px 6px rgba(2, 132, 199, 0.1)"
                        }}>
                          <p style={{
                            margin: "0 0 12px 0",
                            fontSize: "0.95rem",
                            fontWeight: "900",
                            color: "#0c4a6e",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}>
                            <span style={{ fontSize: "1.1rem" }}>📅</span> Recommended Weekly Schedule
                          </p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "12px" }}>
                            {[
                              { week: "Week 1", time: "5 min", weekNum: 1 },
                              { week: "Week 2", time: "10 min", weekNum: 2 },
                              { week: "Week 3", time: "15 min", weekNum: 3 },
                              { week: "Week 4", time: "20 min", weekNum: 4 },
                              { week: "Week 5+", time: "25 min", weekNum: 5 }
                            ].map((item, idx) => {
                              let status = "Upcoming";
                              let bgColor = "#f3f4f6";
                              let statusColor = "#9ca3af";
                              let statusBg = "#f3f4f6";
                              
                              if (item.weekNum < currentWeek) {
                                status = "Completed ✓";
                                bgColor = "#dbeafe";
                                statusColor = "#10b981";
                                statusBg = "#dcfce7";
                              } else if (item.weekNum === currentWeek) {
                                status = "In Progress";
                                bgColor = "#fef3c7";
                                statusColor = "#f59e0b";
                                statusBg = "#fef3c7";
                              }
                              
                              return (
                                <div key={idx} style={{
                                  backgroundColor: bgColor,
                                  padding: "12px",
                                  borderRadius: "10px",
                                  fontSize: "0.85rem",
                                  border: `2px solid ${statusColor}`,
                                  transition: "all 0.3s ease"
                                }}>
                                  <p style={{ margin: "0 0 6px 0", fontWeight: "900", color: "#1f2937", fontSize: "0.9rem" }}>
                                    {item.week}
                                  </p>
                                  <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#666" }}>
                                    ⏱️ <span style={{ fontWeight: "bold", color: "#0284c7" }}>{item.time}</span>
                                  </p>
                                  <span style={{
                                    display: "inline-block",
                                    backgroundColor: statusBg,
                                    color: statusColor,
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    fontWeight: "900"
                                  }}>
                                    {status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <p style={{
                            margin: "0",
                            fontSize: "0.8rem",
                            color: "#0c4a6e",
                            fontStyle: "italic",
                            backgroundColor: "#f0f9ff",
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #bfdbfe"
                          }}>
                            💡 Gradually increase therapy duration by 5 minutes each week for better eye muscle adaptation
                          </p>
                        </div>

                        {/* Doctor's Advice */}
                        <div style={{
                          background: "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)",
                          border: "3px solid #ef4444",
                          padding: "16px",
                          borderRadius: "10px",
                          marginTop: "14px",
                          boxShadow: "0 2px 6px rgba(239, 68, 68, 0.15)"
                        }}>
                          <p style={{
                            margin: "0 0 10px 0",
                            fontSize: "0.95rem",
                            fontWeight: "900",
                            color: "#991b1b",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}>
                            <span style={{ fontSize: "1.2rem" }}>👨‍⚕️</span> Doctor's Advice Required
                          </p>
                          <p style={{
                            margin: "0",
                            fontSize: "0.85rem",
                            color: "#7f1d1d",
                            lineHeight: "1.5",
                            fontWeight: "500"
                          }}>
                            Please consult with your child's eye doctor after completing Stage 1 (21 days) to assess progress and adjust the therapy plan if needed.
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Start Vision Therapy Button */}
                <div style={{
                  marginTop: "16px"
                }}>
                  <button style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "white",
                    padding: "14px 20px",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                    }}
                    onClick={() => window.location.href = "/vision-therapy"}
                  >
                    🎯 Start Vision Therapy
                  </button>
                </div>
              </div>

              {/* Learning Progress Section */}
              <div style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}>
                <h3 style={{
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  📚 Learning Progress
                </h3>
                <div style={{ marginBottom: "12px", color: "#6b7280", fontSize: "0.9rem" }}>
                  Based on real time spent on shapes pages.
                  {learningStats.lastUpdated && (
                    <span> Last updated: {formatLastVisit(learningStats.lastUpdated)}</span>
                  )}
                </div>

                {(() => {
                  const items = [
                    { key: "Circle", color: "#667eea", data: learningStats.circle },
                    { key: "Square", color: "#10b981", data: learningStats.square },
                    { key: "Triangle", color: "#f59e0b", data: learningStats.triangle },
                    { key: "Star", color: "#ef4444", data: learningStats.star },
                  ];
                  const maxMs = Math.max(...items.map((i) => i.data.ms), 1);

                  return (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "16px",
                      alignItems: "end",
                      height: "200px",
                      marginTop: "12px"
                    }}>
                      {items.map((item) => {
                        const height = Math.max(8, Math.round((item.data.ms / maxMs) * 180));
                        return (
                          <div key={item.key} style={{ textAlign: "center" }}>
                            <div style={{
                              height: `${height}px`,
                              background: `linear-gradient(180deg, ${item.color}, ${item.color}80)`,
                              borderRadius: "10px",
                              marginBottom: "10px",
                              boxShadow: `0 6px 12px ${item.color}33`
                            }} />
                            <div style={{ fontWeight: 700, color: "#1f2937" }}>{item.key}</div>
                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                              {formatDuration(item.data.ms)} • {item.data.visits} visits
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                              Last visit: {formatLastVisit(item.data.lastVisit)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Recommendations */}
              <div style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                color: "white",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 8px 24px rgba(245, 158, 11, 0.3)"
              }}>
                <h3 style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  💡 Recommended Actions
                </h3>
                <ul style={{
                  paddingLeft: "20px",
                  margin: "0",
                  fontSize: "0.95rem"
                }}>
                  <li style={{ marginBottom: "8px" }}>Schedule an eye break - 5 minute session recommended</li>
                  <li style={{ marginBottom: "8px" }}>Try the new "Shape Recognition" activity</li>
                  <li>Encourage 10 more minutes of reading practice</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "detailed" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px"
          }}>
            {[
              { title: "✍️ Writing & Motor Skills", subtitle: "Hand coordination development", items: ["Circle tracing: 95%", "Shape drawing: 98%", "Letter forming: 96%"] },
              { title: "📖 Reading & Speech", subtitle: "Letter & sound recognition", items: ["Letter recognition: 92%", "Phonics basics: 88%", "Story listening: 94%"] },
              { title: "🎵 Auditory Response", subtitle: "Listening & sound recognition", items: ["Sound matching: 90%", "Music appreciation: 87%", "Voice recognition: 91%"] },
              { title: "🧠 Cognitive Skills", subtitle: "Problem-solving abilities", items: ["Pattern recognition: 89%", "Memory games: 86%", "Logic puzzles: 84%"] }
            ].map((section, idx) => (
              <div key={idx} style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}>
                <h3 style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: "6px"
                }}>
                  {section.title}
                </h3>
                <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "16px" }}>{section.subtitle}</p>
                {section.items.map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: "#f3f4f6",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span>{item.split(":")[0]}</span>
                    <span style={{ color: "#667eea", fontWeight: "bold" }}>{item.split(":")[1]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === "insights" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px"
          }}>
            <div style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
              <h3 style={{
                fontSize: "1.3rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "16px"
              }}>
                📈 This Week's Trends
              </h3>
              <ul style={{ color: "#666", paddingLeft: "20px", fontSize: "0.95rem" }}>
                <li style={{ marginBottom: "12px" }}>👆 Emma's learning time increased by 25%</li>
                <li style={{ marginBottom: "12px" }}>🎯 Eye health metrics improved significantly</li>
                <li style={{ marginBottom: "12px" }}>⭐ Consistency in daily activities: 5/7 days</li>
                <li>🏃 Activity diversity: 8 different learning activities</li>
              </ul>
            </div>

            <div style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
              <h3 style={{
                fontSize: "1.3rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "16px"
              }}>
                🎯 Next Steps
              </h3>
              <ul style={{ color: "#666", paddingLeft: "20px", fontSize: "0.95rem" }}>
                <li style={{ marginBottom: "12px" }}>🆙 Advance to Level 2 challenges - Emma's ready!</li>
                <li style={{ marginBottom: "12px" }}>🎨 Introduce creative writing exercises</li>
                <li style={{ marginBottom: "12px" }}>👥 Join group learning sessions</li>
                <li>🏆 Work towards "Perfect Week" badge</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "writing" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "30px"
          }}>
            {/* Left Sidebar */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              {/* Profile Card */}
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "30px",
                borderRadius: "16px",
                textAlign: "center",
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)"
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  margin: "0 auto 16px"
                }}>
                  👧
                </div>
                <h2 style={{ fontSize: "1.8rem", margin: "0 0 8px 0", fontFamily: "'Fredoka One', sans-serif" }}>Emma</h2>
                <p style={{ fontSize: "1rem", opacity: "0.9", margin: "0 0 16px 0" }}>Age 5 years old</p>
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "0.9rem"
                }}>
                  📍 Grade: Pre-School | 🎯 Level: Advanced
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              {/* Writing Issues Section */}
              <div style={{
                background: "linear-gradient(135deg, #fff5e6 0%, #fef3c7 100%)",
                padding: "28px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(245, 158, 11, 0.12)",
                border: "2px solid #f59e0b"
              }}>
                <h3 style={{
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  color: "#92400e",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span style={{ fontSize: "2rem" }}>✏️</span> Writing Issues Assessment
                </h3>
                <p style={{
                  margin: "0",
                  color: "#92400e",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  lineHeight: "1.6"
                }}>
                  Comprehensive evaluation of your child's writing skills and development. Track improvements in handwriting, letter formation, spelling, and creative expression.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reading" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "30px"
          }}>
            {/* Left Sidebar */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              {/* Profile Card */}
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "30px",
                borderRadius: "16px",
                textAlign: "center",
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)"
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  margin: "0 auto 16px"
                }}>
                  👧
                </div>
                <h2 style={{ fontSize: "1.8rem", margin: "0 0 8px 0", fontFamily: "'Fredoka One', sans-serif" }}>Emma</h2>
                <p style={{ fontSize: "1rem", opacity: "0.9", margin: "0 0 16px 0" }}>Age 5 years old</p>
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "0.9rem"
                }}>
                  📍 Grade: Pre-School | 🎯 Level: Advanced
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              {/* Reading & Speech Section */}
              <div style={{
                background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                padding: "28px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(2, 132, 199, 0.12)",
                border: "2px solid #0284c7"
              }}>
                <h3 style={{
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  color: "#0c4a6e",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span style={{ fontSize: "2rem" }}>📖</span> Reading & Speech Assessment
                </h3>
                <p style={{
                  margin: "0",
                  color: "#0c4a6e",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  lineHeight: "1.6"
                }}>
                  Monitor your child's reading ability and speech development progress. Track phonemic awareness, decoding skills, fluency, and articulation improvements.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "auditory" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "30px"
          }}>
            {/* Left Sidebar */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              {/* Profile Card */}
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "30px",
                borderRadius: "16px",
                textAlign: "center",
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)"
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  margin: "0 auto 16px"
                }}>
                  👧
                </div>
                <h2 style={{ fontSize: "1.8rem", margin: "0 0 8px 0", fontFamily: "'Fredoka One', sans-serif" }}>Emma</h2>
                <p style={{ fontSize: "1rem", opacity: "0.9", margin: "0 0 16px 0" }}>Age 5 years old</p>
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "0.9rem"
                }}>
                  📍 Grade: Pre-School | 🎯 Level: Advanced
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              {/* Auditory Response Section */}
              <div style={{
                background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                padding: "28px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(139, 92, 246, 0.12)",
                border: "2px solid #8b5cf6"
              }}>
                <h3 style={{
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  color: "#5b21b6",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span style={{ fontSize: "2rem" }}>👂</span> Auditory Response Assessment
                </h3>
                <p style={{
                  margin: "0",
                  color: "#5b21b6",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  lineHeight: "1.6"
                }}>
                  Track your child's hearing and auditory processing abilities. Monitor listening comprehension, sound discrimination, and auditory attention development.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ParentsDashboard;
