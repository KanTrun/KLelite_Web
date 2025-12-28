import React, { useState, useRef, useEffect } from 'react';
import styles from './Chat.module.scss';
import { chatService } from '@/services/chatService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Chào mừng bạn đến với KL\'elite! Tôi có thể giúp gì cho bạn hôm nay?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Convert history for API
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await chatService.sendMessage(userMessage.content, history);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = async (text: string) => {
    // Create and send message directly without relying on state update
    if (loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await chatService.sendMessage(text, history);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.header}>
        <h3>Hỗ trợ trực tuyến</h3>
        <button onClick={onClose} aria-label="Đóng chat">×</button>
      </div>

      <div className={styles.messages}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
            {msg.role === 'assistant' && (
              <div className={styles.avatar}>KL</div>
            )}
            <div className={styles.bubble}>
              {msg.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < msg.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
              <span className={styles.time}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.avatar}>KL</div>
            <div className={styles.bubble}>
              <div className={styles.typingIndicator}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className={styles.quickReplies}>
          <button onClick={() => handleQuickReply('Đơn hàng của tôi đâu?')}>Tra cứu đơn hàng</button>
          <button onClick={() => handleQuickReply('Chính sách đổi trả')}>Chính sách đổi trả</button>
          <button onClick={() => handleQuickReply('Cửa hàng ở đâu?')}>Địa chỉ cửa hàng</button>
        </div>
      )}

      <form className={styles.inputArea} onSubmit={handleSend}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nhập tin nhắn..."
          disabled={loading}
        />
        <button type="submit" disabled={!inputValue.trim() || loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
