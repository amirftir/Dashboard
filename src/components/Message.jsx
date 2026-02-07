import './Message.css';

function Message({ message }) {
  const isAssistant = message.role === 'assistant';
  const isReport = message.content.includes('═══') || message.content.includes('───');

  return (
    <div className={`message ${message.role}`}>
      <div
        className={`message-bubble ${
          isAssistant ? 'assistant-bubble' : 'user-bubble'
        } ${isReport ? 'report-bubble' : ''}`}
      >
        <div className="message-text">
          {message.content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Message;
