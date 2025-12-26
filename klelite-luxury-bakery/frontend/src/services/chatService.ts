import api from './api';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  success: boolean;
  data: {
    message: string;
    timestamp: string;
  };
}

export const chatService = {
  sendMessage: async (message: string, conversationHistory?: Message[]): Promise<string> => {
    try {
      const response = await api.post<ChatResponse>('/chat/message', {
        message,
        conversationHistory
      });
      return response.data.data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};
