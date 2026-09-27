import { useState } from 'react';

/**
 * SettingsPanel – API key input, model selection, temperature slider
 */
export default function SettingsPanel({
  apiKey,
  onApiKeySave,
  settings,
  onSettingsChange,
}) {
  const [draftKey, setDraftKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    onApiKeySave(draftKey.trim());
  };

  return (
    <>
      {/* API Key Card */}
      <div className="api-key-card card">
        <div className="card-header">
          <div className="card-title">
            <span>🔑</span> API Key
          </div>
        </div>
        <div className="api-input-group">
          <input
            id="api-key-input"
            type={showKey ? 'text' : 'password'}
            className="api-input"
            placeholder="AIza..."
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            className="btn-secondary"
            style={{ width: 'auto', padding: '9px 12px', flexShrink: 0 }}
            onClick={() => setShowKey((s) => !s)}
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? '🙈' : '👁️'}
          </button>
          <button id="btn-save-api" className="btn-save-api" onClick={handleSave}>
            Save
          </button>
        </div>
        <p className="api-hint">
          Get your free key at{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            aistudio.google.com
          </a>
        </p>
      </div>

      {/* Settings Card */}
      <div className="settings-card card">
        <div className="card-header">
          <div className="card-title">
            <span>⚙️</span> Settings
          </div>
        </div>
        <div className="settings-grid">
          {/* Model */}
          <div className="setting-row">
            <div className="setting-label">
              <strong>AI Model</strong>
              <small>Select Gemini version</small>
            </div>
            <select
              id="model-select"
              className="model-select"
              value={settings.model}
              onChange={(e) => onSettingsChange({ model: e.target.value })}
            >
              <option value="gemini-3.8-flash">3.8 Flash ⚡</option>
              <option value="gemini-3.8-flash-lite">3.8 Lite 🪶</option>
              <option value="gemini-1.5-flash">1.5 Flash</option>
              <option value="gemini-1.5-pro">1.5 Pro 🎓</option>
            </select>
          </div>

          {/* Temperature */}
          <div className="setting-row">
            <div className="setting-label">
              <strong>Accuracy Mode</strong>
              <small>
                {settings.temperature <= 0.15
                  ? '🎯 Precise'
                  : settings.temperature <= 0.5
                    ? '⚖️ Balanced'
                    : '🎲 Creative'}
              </small>
            </div>
            <input
              id="temp-slider"
              type="range"
              className="range-slider"
              min="0" max="1" step="0.05"
              value={settings.temperature}
              onChange={(e) => onSettingsChange({ temperature: parseFloat(e.target.value) })}
            />
          </div>

          {/* Auto-analyze */}
          <div className="setting-row">
            <div className="setting-label">
              <strong>Auto-Analyze</strong>
              <small>Analyze immediately after snap</small>
            </div>
            <label className="toggle">
              <input
                id="toggle-auto-analyze"
                type="checkbox"
                checked={settings.autoAnalyze}
                onChange={(e) => onSettingsChange({ autoAnalyze: e.target.checked })}
              />
              <span className="toggle-track" />
            </label>
          </div>

          {/* Save history */}
          <div className="setting-row">
            <div className="setting-label">
              <strong>Save History</strong>
              <small>Keep solved questions locally</small>
            </div>
            <label className="toggle">
              <input
                id="toggle-save-history"
                type="checkbox"
                checked={settings.saveHistory}
                onChange={(e) => onSettingsChange({ saveHistory: e.target.checked })}
              />
              <span className="toggle-track" />
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
