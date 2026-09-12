import { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'مرحباً بك في عيادتنا! أنا المساعد الذكي، كيف يمكنني مساعدتك اليوم؟ يمكنك حجز موعد أو الاستفسار عن خدماتنا.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reasoning, setReasoning] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setReasoning('جاري تحليل الطلب...');

    // Simulate AI response with reasoning
    setTimeout(() => {
      setReasoning('جاري البحث عن مواعيد متاحة...');
      setTimeout(() => {
        setReasoning('');
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: 'لقد وجدت موعداً متاحاً غداً الساعة 4:00 مساءً. هل تود تأكيد الحجز؟',
          }
        ]);
        setIsTyping(false);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="chat-container glass animate-slide-up">
      <div className="chat-header">
        <Bot size={32} color="var(--primary-color)" />
        <div>
          <h2>المساعد الذكي للعيادة</h2>
          <p>متصل الآن</p>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.sender} animate-slide-up`}>
            <div className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-wrapper bot animate-slide-up">
            <div className="message bot">
              {reasoning && (
                <div className="reasoning-box animate-pulse-subtle">
                  <Loader2 size={16} className="animate-spin" />
                  <span>{reasoning}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '24px' }}>
                <div className="typing-dot"></div>
                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder="اكتب رسالتك هنا..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="send-button" disabled={isTyping}>
            <Send size={20} style={{ transform: 'rotate(180deg)' }} /> {/* Rotate for RTL */}
          </button>
        </form>
      </div>
    </div>
  );
}
