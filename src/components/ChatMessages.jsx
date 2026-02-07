import Message from './Message';
import './ChatMessages.css';

function ChatMessages({ messages, isLoading, messagesEndRef }) {
  const visibleMessages = messages.filter((m) => !m.hidden);

  return (
    <div className="messages-container">
      <div className="messages-scroll">
        {visibleMessages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-bubble assistant-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatMessages;
