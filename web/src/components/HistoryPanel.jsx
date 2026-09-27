/**
 * HistoryPanel – shows previously solved MCQs from localStorage
 */
export default function HistoryPanel({ history, onSelect, onClear }) {
  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="history-card card">
      <div className="card-header">
        <div className="card-title">
          <span>🕒</span> History
        </div>
        {history.length > 0 && (
          <button
            id="btn-clear-history"
            className="btn-secondary"
            style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }}
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
      <div className="history-inner">
        <div className="history-list">
          {history.length === 0 ? (
            <p className="history-empty">No solved questions yet</p>
          ) : (
            history.map((item, idx) => (
              <button
                key={item.id}
                id={`history-item-${idx}`}
                className="history-item"
                onClick={() => onSelect(item)}
                style={{ border: 'none', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}
              >
                <div className="history-answer-badge">
                  {item.result?.correctAnswer || '?'}
                </div>
                <div className="history-question">
                  {item.result?.question || 'Unknown question'}
                </div>
                <div className="history-time">{formatTime(item.timestamp)}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
