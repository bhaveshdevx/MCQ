import { useState, useCallback, useEffect } from 'react';
import CameraPanel from './components/CameraPanel.jsx';
import AnswerPanel from './components/AnswerPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import { ToastContainer, addToast } from './components/Toast.jsx';
import { analyzeMCQFromImage, dataURLToBase64 } from './services/geminiService.js';

const STORAGE_KEY_API = 'snapsolve_api_key';
const STORAGE_KEY_HISTORY = 'snapsolve_history';
const STORAGE_KEY_SETTINGS = 'snapsolve_settings';

// Loaded from web/.env → VITE_GEMINI_API_KEY
const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const defaultSettings = {
  model: 'gemini-3.8-flash',
  temperature: 0.1,
  autoAnalyze: true,
  saveHistory: true,
};

export default function App() {
  /* ────────── Persisted state ────────── */
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY_API) || DEFAULT_API_KEY);
  const [settings, setSettings] = useState(() => {
    try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}') }; }
    catch { return defaultSettings; }
  });
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]'); }
    catch { return []; }
  });

  /* ────────── UI state ────────── */
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('solve'); // 'solve' | 'history'
  const [cameraMode, setCameraMode] = useState('snap');  // 'snap' | 'live'
  const [liveActive, setLiveActive] = useState(false);

  /* ────────── Core analyze function ────────── */
  const analyze = useCallback(async (imageDataURL, silent = false) => {
    if (!apiKey) {
      if (!silent) addToast('Please set your Gemini API key first.', 'error');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const base64 = dataURLToBase64(imageDataURL);
      const data = await analyzeMCQFromImage(base64, apiKey, {
        model: settings.model,
        temperature: settings.temperature,
      });
      setResult(data);
      setActiveTab('solve');
      addToast(`✅ Answer: ${data.correctAnswer}`, 'success');

      if (settings.saveHistory) {
        const entry = { id: Date.now(), timestamp: Date.now(), image: imageDataURL, result: data };
        setHistory((prev) => {
          const next = [entry, ...prev].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(next));
          return next;
        });
      }
    } catch (err) {
      setError(err.message);
      if (!silent) addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, settings]);

  /* ────────── Snap mode handler ────────── */
  const handleCapture = useCallback((dataURL, forceAnalyze = false) => {
    setCapturedImage(dataURL);
    setResult(null);
    setError(null);
    if (settings.autoAnalyze || forceAnalyze) analyze(dataURL);
  }, [settings.autoAnalyze, analyze]);

  /* ────────── Live mode handler (silent = don't toast on error) ────────── */
  const handleLiveFrame = useCallback((dataURL) => {
    setCapturedImage(dataURL);
    analyze(dataURL, true);
  }, [analyze]);

  /* ────────── Retake ────────── */
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
  }, []);

  /* ────────── Live toggle ────────── */
  const handleToggleLive = useCallback(() => {
    setLiveActive((v) => {
      const next = !v;
      if (next) addToast('Live analysis started – frame every 4s', 'info');
      else addToast('Live analysis paused', 'info');
      return next;
    });
  }, []);

  /* Stop live when switching to snap */
  const handleModeChange = useCallback((m) => {
    setCameraMode(m);
    if (m === 'snap') setLiveActive(false);
    handleRetake();
  }, [handleRetake]);

  /* ────────── Settings / API ────────── */
  const handleApiKeySave = useCallback((key) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEY_API, key);
    addToast('API key saved!', 'success');
  }, []);

  const handleSettingsChange = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(next));
      return next;
    });
  }, []);

  /* ────────── History ────────── */
  const handleHistorySelect = useCallback((item) => {
    setCapturedImage(item.image);
    setResult(item.result);
    setError(null);
    setActiveTab('solve');
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    addToast('History cleared', 'info');
  }, []);

  const hasApiKey = apiKey && apiKey.trim().length > 10;

  /* ────────── Render ────────── */
  return (
    <div className="app-wrapper">
      <ToastContainer />

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <a className="logo" href="#" aria-label="SnapSolve Home">
            <div className="logo-icon">⚡</div>
            <span className="logo-text">SnapSolve</span>
          </a>

          <nav className="header-nav" aria-label="Main navigation">
            <button
              id="nav-solve"
              className={`nav-btn ${activeTab === 'solve' ? 'active' : ''}`}
              onClick={() => setActiveTab('solve')}
            >
              📷 Solve
            </button>
            <button
              id="nav-history"
              className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              🕒 History
              {history.length > 0 && (
                <span className="nav-badge">{history.length}</span>
              )}
            </button>
          </nav>

          <div className="header-actions">
            <div
              className="api-key-badge"
              title={hasApiKey ? 'API key configured' : 'No API key set'}
              role="status"
            >
              <span className={`dot ${hasApiKey ? '' : 'inactive'}`} />
              <span className="badge-text">{hasApiKey ? 'API Active' : 'No Key'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main-layout">

        {/* ── Left / Top Panel ── */}
        <aside className="left-panel" aria-label="Camera and settings">
          <CameraPanel
            onCapture={handleCapture}
            onLiveFrame={handleLiveFrame}
            isLoading={isLoading}
            capturedImage={capturedImage}
            onRetake={handleRetake}
            mode={cameraMode}
            onModeChange={handleModeChange}
            liveActive={liveActive}
            onToggleLive={handleToggleLive}
          />

          {/* Settings hidden behind accordion on mobile */}
          <div className="settings-wrapper">
            <SettingsPanel
              apiKey={apiKey}
              onApiKeySave={handleApiKeySave}
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        </aside>

        {/* ── Right / Bottom Panel ── */}
        <section className="right-panel" aria-label="Results and history">
          {/* Stats row (desktop only) */}
          <div className="stats-row">
            <div className="stat-chip">
              <div className="stat-value">{history.length}</div>
              <div className="stat-label">Solved</div>
            </div>
            <div className="stat-chip">
              <div className="stat-value">{cameraMode === 'live' && liveActive ? '🔴' : '📸'}</div>
              <div className="stat-label">{cameraMode === 'live' && liveActive ? 'Live' : 'Snap'}</div>
            </div>
            <div className="stat-chip">
              <div className="stat-value">{hasApiKey ? '✓' : '✗'}</div>
              <div className="stat-label">API</div>
            </div>
          </div>

          {activeTab === 'solve' ? (
            <AnswerPanel result={result} isLoading={isLoading} error={error} />
          ) : (
            <HistoryPanel
              history={history}
              onSelect={handleHistorySelect}
              onClear={handleClearHistory}
            />
          )}
        </section>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          className={`mob-nav-btn ${activeTab === 'solve' ? 'active' : ''}`}
          onClick={() => setActiveTab('solve')}
        >
          <span>📷</span>
          <span>Solve</span>
        </button>
        <button
          className={`mob-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span>🕒</span>
          <span>History {history.length > 0 && `(${history.length})`}</span>
        </button>
      </nav>
    </div>
  );
}
