import { useState, useRef, useEffect, useCallback } from 'react';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import { ConversationEngine } from './utils/conversationEngine';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const engineRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const startConversation = useCallback(() => {
    if (hasStarted) return;
    const engine = new ConversationEngine();
    engineRef.current = engine;
    const greeting = engine.getInitialMessage();
    setMessages([{ role: 'assistant', content: greeting }]);
    setHasStarted(true);
  }, [hasStarted]);

  const sendMessage = useCallback((text) => {
    if (!text.trim() || !engineRef.current) return;

    const userMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);

    // Small delay to show the user message first
    setTimeout(() => {
      const response = engineRef.current.processInput(text.trim());
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response },
      ]);
    }, 300);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setHasStarted(false);
    engineRef.current = null;
  }, []);

  return (
    <div className="app">
      <ChatHeader onReset={resetChat} hasStarted={hasStarted} />
      <div className="chat-container">
        {!hasStarted ? (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-icon">🧠</div>
              <h2>سیستم ارزیابی بالینی TMN</h2>
              <p>
                به سیستم ارزیابی بالینی فناوری‌های سلامت عصبی خوش آمدید.
                <br />
                این ارزیابی حدود ۲۰ دقیقه زمان می‌برد.
              </p>
              <button className="start-button" onClick={startConversation}>
                شروع ارزیابی
              </button>
            </div>
          </div>
        ) : (
          <>
            <ChatMessages
              messages={messages}
              isLoading={false}
              messagesEndRef={messagesEndRef}
            />
            <ChatInput onSend={sendMessage} isLoading={false} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
