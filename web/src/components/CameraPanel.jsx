import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * CameraPanel – handles live camera with Live & Snap modes
 * - Live mode: continuously captures frames and sends to AI
 * - Snap mode: manual capture on button press
 * Camera feed is always visible
 */
export default function CameraPanel({
  onCapture,
  onLiveFrame,
  isLoading,
  capturedImage,
  onRetake,
  mode,
  onModeChange,
  liveActive,
  onToggleLive,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const liveTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facing, setFacing] = useState('environment');
  const [liveCountdown, setLiveCountdown] = useState(0);

  /* ── Start Camera ── */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permission in your browser.');
      setCameraActive(false);
    }
  }, [facing]);

  /* ── Stop Camera ── */
  const stopCamera = useCallback(() => {
    if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  /* ── Capture single frame as dataURL ── */
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.88);
  }, []);

  /* ── SNAP MODE: capture & stop feed ── */
  const handleSnap = useCallback(() => {
    const dataURL = captureFrame();
    if (dataURL) {
      onCapture(dataURL);
    }
  }, [captureFrame, onCapture]);

  /* ── LIVE MODE: periodic capture ── */
  useEffect(() => {
    if (liveTimerRef.current) {
      clearInterval(liveTimerRef.current);
      liveTimerRef.current = null;
    }
    if (liveActive && cameraActive) {
      const INTERVAL = 4000; // 4 seconds between captures
      let remaining = INTERVAL / 1000;
      setLiveCountdown(remaining);

      liveTimerRef.current = setInterval(() => {
        remaining -= 1;
        setLiveCountdown(remaining);
        if (remaining <= 0) {
          remaining = INTERVAL / 1000;
          setLiveCountdown(remaining);
          const dataURL = captureFrame();
          if (dataURL) onLiveFrame(dataURL);
        }
      }, 1000);
    }
    return () => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    };
  }, [liveActive, cameraActive, captureFrame, onLiveFrame]);

  /* ── Flip camera ── */
  const flipCamera = useCallback(() => {
    setFacing((f) => (f === 'user' ? 'environment' : 'user'));
  }, []);

  useEffect(() => {
    if (cameraActive) startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  /* ── File upload ── */
  const handleFileUpload = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => onCapture(ev.target.result);
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [onCapture]
  );

  /* ── Drag-drop ── */
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => onCapture(ev.target.result);
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  return (
    <div className="camera-card card">
      {/* ── Mode Toggle ── */}
      <div className="mode-toggle-row">
        <button
          id="btn-mode-snap"
          className={`mode-btn ${mode === 'snap' ? 'active' : ''}`}
          onClick={() => { onModeChange('snap'); if (liveActive) onToggleLive(); }}
        >
          📸 Snap
        </button>
        <button
          id="btn-mode-live"
          className={`mode-btn ${mode === 'live' ? 'active' : ''}`}
          onClick={() => { onModeChange('live'); }}
        >
          🔴 Live
        </button>
        {cameraActive && (
          <button className="flip-btn" onClick={flipCamera} title="Flip camera">🔄</button>
        )}
      </div>

      {/* ── Viewport – always shows camera OR captured image ── */}
      <div className="camera-viewport-wrap">
        {/* Live camera feed – always rendered, hidden via CSS if not active */}
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          style={{ display: cameraActive ? 'block' : 'none' }}
          className="camera-video"
        />

        {/* Captured image overlay when in SNAP mode and image taken */}
        {capturedImage && mode === 'snap' && (
          <div className="snap-overlay">
            <img src={capturedImage} alt="Captured frame" />
            <button className="retake-overlay-btn" onClick={onRetake}>🔄 Retake</button>
          </div>
        )}

        {/* Placeholder when no camera active */}
        {!cameraActive && (
          <div className="camera-placeholder">
            <span className="cam-icon">📸</span>
            <p>{cameraError || 'Start camera to begin'}</p>
          </div>
        )}

        {/* Corner frame guides */}
        {cameraActive && (
          <div className="camera-corners"><span /></div>
        )}

        {/* Scan line – always when camera is live */}
        {cameraActive && <div className="scan-line" />}

        {/* Status badges */}
        {cameraActive && mode === 'live' && liveActive && (
          <div className="live-badge">
            <span className="rec-dot" /> LIVE — next in {liveCountdown}s
          </div>
        )}
        {cameraActive && mode === 'live' && !liveActive && (
          <div className="live-badge paused">⏸ PAUSED</div>
        )}
        {cameraActive && mode === 'snap' && (
          <div className="camera-status-badge">
            <span className="rec-dot" /> READY
          </div>
        )}

        {/* Loading indicator on viewport */}
        {isLoading && (
          <div className="viewport-loading">
            <div className="spinner-ring" style={{ width: 36, height: 36 }} />
            <span>Analyzing…</span>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Actions ── */}
      <div className="camera-actions">
        {!cameraActive ? (
          <button id="btn-start-camera" className="btn-capture" onClick={startCamera}>
            🎥 Start Camera
          </button>
        ) : mode === 'snap' ? (
          <>
            <button
              id="btn-snap"
              className="btn-capture"
              onClick={handleSnap}
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className="spinner-ring" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyzing…</>
              ) : '📸 Snap & Solve'}
            </button>
            {capturedImage && (
              <button
                id="btn-analyze-snap"
                className="btn-secondary"
                onClick={() => onCapture(capturedImage, true)}
                disabled={isLoading}
              >
                🔍 Re-Analyze
              </button>
            )}
          </>
        ) : (
          /* LIVE MODE controls */
          <button
            id="btn-toggle-live"
            className={`btn-capture ${liveActive ? 'btn-danger' : ''}`}
            onClick={onToggleLive}
            disabled={isLoading && !liveActive}
          >
            {liveActive ? '⏹ Stop Live' : '▶ Start Live Analysis'}
          </button>
        )}

        <button className="btn-secondary" onClick={stopCamera} disabled={!cameraActive}>
          ⏏ Stop Camera
        </button>

        {/* Upload */}
        <label
          className="upload-zone"
          htmlFor="file-upload-input"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            id="file-upload-input"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <div className="upload-icon">🖼️</div>
          <div>Upload or drag an image here</div>
          <small>PNG · JPG · WEBP</small>
        </label>
      </div>
    </div>
  );
}
