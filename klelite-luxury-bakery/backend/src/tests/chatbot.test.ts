
import { chatbotService } from '../services/chatbotService';

// Mock external dependencies
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Mocked Gemini response for testing'
          }
        })
      })
    }))
  };
});

jest.mock('../models/FAQ', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockResolvedValue([
      {
        question: 'Test Question',
        keywords: ['test', 'question'],
        answer: 'Test Answer',
        isActive: true,
      },
    ]),
  },
}));

jest.mock('../models/Order', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        _id: 'ORDER123',
        status: 'Processing',
        createdAt: new Date(),
      }),
    }),
  },
}));

jest.mock('../models/Product', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { name: 'Test Product', slug: 'test-product', price: 100000 },
        ]),
      }),
    }),
  },
}));

describe('Chatbot Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('classifyIntent', () => {
    it('should classify FAQ correctly', async () => {
      const result = await chatbotService.classifyIntent('I have a test question');
      expect(result.type).toBe('faq');
      expect(result.answer).toBe('Test Answer');
    });

    it('should classify order status correctly', async () => {
      const result = await chatbotService.classifyIntent('Where is my order?');
      expect(result.type).toBe('order_status');
    });

    it('should classify product search correctly', async () => {
      const result = await chatbotService.classifyIntent('I want to buy cake');
      expect(result.type).toBe('product_search');
    });

    it('should classify unknown intent correctly', async () => {
      const result = await chatbotService.classifyIntent('Random text that means nothing');
      expect(result.type).toBe('unknown');
    });
  });

  describe('handleMessage', () => {
    it('should handle FAQ intent', async () => {
      const response = await chatbotService.handleMessage('I have a test question');
      expect(response).toBe('Test Answer');
    });

    it('should handle order status without login', async () => {
      const response = await chatbotService.handleMessage('Where is my order?');
      expect(response).toBe('Please log in to check your order status.');
    });

    it('should handle order status with login', async () => {
      const response = await chatbotService.handleMessage('Where is my order?', 'USER123');
      expect(response).toContain('ORDER123');
      expect(response).toContain('Processing');
    });

    it('should handle product search', async () => {
      const response = await chatbotService.handleMessage('I want to buy cake');
      expect(response).toContain('Test Product');
      expect(response).toContain('100,000đ');
    });

    it('should use Gemini for unknown queries', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      const response = await chatbotService.handleMessage('Random text');
      expect(response).toBe('Mocked Gemini response for testing');
    });

    // New conversational intent tests
    it('should respond to greetings', async () => {
      const response = await chatbotService.handleMessage('Hello');
      expect(response).toContain('Xin chào');
      expect(response).toContain('trợ lý ảo');
    });

    it('should respond to Vietnamese greetings', async () => {
      const response = await chatbotService.handleMessage('Xin chào');
      expect(response).toContain('KL\'elite');
    });

    it('should respond to gratitude', async () => {
      const response = await chatbotService.handleMessage('Thank you');
      expect(response).toContain('Rất vui');
    });

    it('should respond to Vietnamese gratitude', async () => {
      const response = await chatbotService.handleMessage('Cảm ơn');
      expect(response).toContain('Rất vui');
    });

    it('should respond to farewell', async () => {
      const response = await chatbotService.handleMessage('Goodbye');
      expect(response).toContain('Hẹn gặp lại');
    });

    it('should respond to help requests', async () => {
      const response = await chatbotService.handleMessage('What can you do?');
      expect(response).toContain('Tra cứu đơn hàng');
      expect(response).toContain('Tìm kiếm sản phẩm');
    });

    it('should show fallback message when no Gemini API key', async () => {
      delete process.env.GEMINI_API_KEY;
      const response = await chatbotService.handleMessage('Why is the sky blue?');
      expect(response).toContain('support@klelite.com');
    });
  });
});
