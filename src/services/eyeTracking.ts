import { FaceDetection } from "@mediapipe/face_detection";

type EyeTrackingState = {
  isTracking: boolean;
  status: string;
  error: string | null;
  latestResult: any | null;
};

type EyeTrackingListener = (state: EyeTrackingState) => void;

const listeners = new Set<EyeTrackingListener>();

let state: EyeTrackingState = {
  isTracking: false,
  status: "Idle",
  error: null,
  latestResult: null,
};

let stream: MediaStream | null = null;
let intervalId: number | null = null;
let videoEl: HTMLVideoElement | null = null;
let canvasEl: HTMLCanvasElement | null = null;
let resizeCanvasEl: HTMLCanvasElement | null = null;

let faceDetection: FaceDetection | null = null;
let faceDetected = false;
let faceBox: { x: number; y: number; w: number; h: number } | null = null;
let faceDetectionEnabled = true;

const MODEL_IMG_SIZE = 224;
const MIN_CONFIDENCE = 0.55;
const MIN_SMOOTH_COUNT = 3;

const apiBase = (import.meta as any).env?.VITE_BACKEND_URL?.replace(/\/$/, "") || "";
const predictUrl = apiBase ? `${apiBase}/predict` : "/api/predict";

const notify = () => {
  listeners.forEach((listener) => listener({ ...state }));
};

const setState = (partial: Partial<EyeTrackingState>) => {
  state = { ...state, ...partial };
  notify();
};

export const subscribeEyeTracking = (listener: EyeTrackingListener) => {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
};

export const attachVideoElement = (el: HTMLVideoElement | null) => {
  videoEl = el;
  if (videoEl && stream) {
    videoEl.srcObject = stream;
    videoEl.play().catch(() => undefined);
  }
};

const ensureCanvas = () => {
  if (!canvasEl) {
    canvasEl = document.createElement("canvas");
  }
  return canvasEl;
};

const ensureResizeCanvas = () => {
  if (!resizeCanvasEl) {
    resizeCanvasEl = document.createElement("canvas");
  }
  return resizeCanvasEl;
};

const ensureVideo = () => {
  if (videoEl) return videoEl;
  const created = document.createElement("video");
  created.muted = true;
  created.playsInline = true;
  videoEl = created;
  return created;
};

const initFaceDetection = () => {
  if (faceDetection) return;

  try {
    faceDetection = new FaceDetection({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetection.setOptions({
      model: "short",
      minDetectionConfidence: 0.5,
    });

    faceDetection.onResults((results) => {
      if (!results?.detections?.length) {
        faceDetected = false;
        faceBox = null;
        return;
      }

      const detection = results.detections[0] as any;
      const video = ensureVideo();
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const box = detection.boundingBox || detection.locationData?.relativeBoundingBox;
      if (!box) {
        faceDetected = false;
        faceBox = null;
        return;
      }

      const boxW = box.width * vw;
      const boxH = box.height * vh;
      const x = Math.max(box.xCenter * vw - boxW / 2, 0);
      const y = Math.max(box.yCenter * vh - boxH / 2, 0);

      faceDetected = true;
      faceBox = {
        x: Math.floor(x),
        y: Math.floor(y),
        w: Math.min(Math.floor(boxW), vw),
        h: Math.min(Math.floor(boxH), vh),
      };
    });
  } catch {
    faceDetection = null;
    faceDetectionEnabled = false;
  }
};

const startFaceDetectionLoop = () => {
  if (!faceDetection) return;
  const video = ensureVideo();

  const loop = async () => {
    if (!stream || !faceDetection) return;
    try {
      await faceDetection.send({ image: video });
    } catch {
      // ignore per-frame detection failures
    }
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

const normalizePrediction = (data: any) => {
  if (!data) return null;
  const label = data.smooth_label ?? data.label;
  const confidence = data.smooth_confidence ?? data.confidence;
  const smoothCount = data.smooth_count ?? 0;
  const isUncertain = Boolean(data.is_uncertain);

  if (!label || typeof confidence !== "number" || isUncertain) return null;
  if (data.smooth_label && smoothCount < MIN_SMOOTH_COUNT) return null;
  if (confidence < MIN_CONFIDENCE) return null;

  return { ...data, label, confidence };
};

const captureAndSend = async () => {
  if (!stream) return;
  const video = ensureVideo();
  if (video.readyState < 2) return;

  if (faceDetectionEnabled && !faceDetected) {
    setState({ status: "No face detected", error: null });
    return;
  }

  const canvas = ensureCanvas();
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  let sx = 0;
  let sy = 0;
  let sw = width;
  let sh = height;

  if (faceBox) {
    sx = Math.max(faceBox.x - 20, 0);
    sy = Math.max(faceBox.y - 20, 0);
    sw = Math.min(faceBox.w + 40, width - sx);
    sh = Math.min(faceBox.h + 40, height - sy);
  }

  canvas.width = sw;
  canvas.height = sh;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

  const resizeCanvas = ensureResizeCanvas();
  resizeCanvas.width = MODEL_IMG_SIZE;
  resizeCanvas.height = MODEL_IMG_SIZE;
  const rctx = resizeCanvas.getContext("2d");
  if (!rctx) return;
  rctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, MODEL_IMG_SIZE, MODEL_IMG_SIZE);

  const blob: Blob | null = await new Promise((resolve) =>
    resizeCanvas.toBlob((b: Blob | null) => resolve(b), "image/jpeg", 0.85)
  );
  if (!blob) return;

  const formData = new FormData();
  formData.append("image", blob, "frame.jpg");
  const userId = localStorage.getItem("userId") || "guest";
  formData.append("userId", userId);

  try {
    const res = await fetch(predictUrl, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    const data = await res.json();
    const withTimestamp = { ...data, timestamp: data.timestamp || new Date().toISOString() };
    setState({ latestResult: withTimestamp, status: "Tracking", error: null });
    const stable = normalizePrediction(withTimestamp);
    if (stable) {
      localStorage.setItem("latestEyeDetection", JSON.stringify(stable));
    }
  } catch (err: any) {
    setState({ error: err?.message || "Failed to send frame", status: "Error" });
  }
};

export const startEyeTracking = async () => {
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "child") {
    setState({ status: "Disabled for parents", error: null });
    return;
  }

  if (state.isTracking) return;
  if (!navigator?.mediaDevices?.getUserMedia) {
    setState({ status: "Error", error: "Camera not supported" });
    return;
  }

  setState({ status: "Starting camera...", error: null });
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });

    const video = ensureVideo();
    video.srcObject = stream;
    await video.play();

    initFaceDetection();
    startFaceDetectionLoop();

    setState({ isTracking: true, status: "Tracking", error: null });
    intervalId = window.setInterval(captureAndSend, 2000);
  } catch (err: any) {
    setState({ status: "Error", error: err?.message || "Camera permission denied" });
  }
};

export const stopEyeTracking = () => {
  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  if (videoEl) {
    videoEl.srcObject = null;
  }
  if (faceDetection) {
    faceDetection.close();
    faceDetection = null;
  }
  faceDetected = false;
  faceBox = null;
  faceDetectionEnabled = true;
  setState({ isTracking: false, status: "Stopped" });
};

export const getEyeTrackingState = () => ({ ...state });