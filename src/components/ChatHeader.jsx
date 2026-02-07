import './ChatHeader.css';

function ChatHeader({ onReset, hasStarted }) {
  return (
    <header className="chat-header">
      <div className="header-brand">
        <div className="header-logo">
          <span className="logo-icon">⚡</span>
        </div>
        <div className="header-text">
          <h1>Neural Wellness Technologies</h1>
          <span className="header-subtitle">فناوری‌های سلامت عصبی</span>
        </div>
      </div>
      {hasStarted && (
        <button className="reset-button" onClick={onReset} title="شروع مجدد">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      )}
    </header>
  );
}

export default ChatHeader;
