import { useState, useRef, useEffect, useCallback } from 'react';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import { SYSTEM_PROMPT } from './utils/systemPrompt';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const startConversation = useCallback(async () => {
    if (hasStarted) return;
    setHasStarted(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: 'سلام' }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to server');
      }

      const data = await response.json();
      setMessages([
        { role: 'user', content: 'سلام', hidden: true },
        { role: 'assistant', content: data.message },
      ]);
    } catch (err) {
      setError('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.');
      setHasStarted(false);
    } finally {
      setIsLoading(false);
    }
  }, [hasStarted]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    try {
      const apiMessages = updatedMessages
        .filter((m) => !m.hidden || m.role === 'user')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message },
      ]);
    } catch (err) {
      setError('خطا در دریافت پاسخ. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setHasStarted(false);
    setError(null);
    setIsLoading(false);
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
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
            />
            {error && (
              <div className="error-bar">
                <span>{error}</span>
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
