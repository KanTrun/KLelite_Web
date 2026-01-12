import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../lib/prisma';

let genAI: GoogleGenerativeAI | null = null;

const getGeminiAI = () => {
  if (genAI) return genAI;
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const chatbotService = {
  async handleMessage(message: string, userId?: string, conversationHistory?: Message[]) {
    try {
      // 1. Intent classification
      const intent = await this.classifyIntent(message);

      // 2. Handle by intent
      switch (intent.type) {
        case 'faq':
          return intent.answer;
        case 'order_status':
          return this.handleOrderStatus(userId, intent.orderNumber);
        case 'product_search':
          return this.handleProductSearch(intent.query);
        case 'greeting':
        case 'gratitude':
        case 'farewell':
        case 'help':
          return intent.message;
        case 'unknown':
          return this.handleWithGemini(message, conversationHistory);
        default:
          return this.handleWithGemini(message, conversationHistory);
      }
    } catch (error) {
      console.error('Error in chatbotService:', error);
      return "Sorry, I'm having trouble processing your request right now. Please try again later or contact support.";
    }
  },

  async classifyIntent(message: string) {
    const lowerMessage = message.toLowerCase();

    // Keyword matching for FAQ
    const faqs = await prisma.fAQ.findMany({ where: { isActive: true } });

    // Simple relevance scoring
    let bestMatch = null;
    let maxScore = 0;

    for (const faq of faqs) {
      let score = 0;
      const keywords = (faq.keywords as string[]) || [];
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          score++;
        }
      }

      if (score > 0 && score > maxScore) {
        maxScore = score;
        bestMatch = faq;
      }
    }

    if (bestMatch && maxScore >= 1) {
      return { type: 'faq', answer: bestMatch.answer };
    }

    // Greeting patterns
    if (/^(hello|hi|hey|chào|xin chào|hola|bonjour)/i.test(lowerMessage)) {
      return {
        type: 'greeting',
        message: 'Xin chào! Tôi là trợ lý ảo của KL\'elite. Tôi có thể giúp bạn về sản phẩm, đơn hàng, hoặc chính sách cửa hàng. Bạn cần gì?'
      };
    }

    // Gratitude patterns
    if (/thank|thanks|cảm ơn|thank you|cám ơn|merci/i.test(lowerMessage)) {
      return {
        type: 'gratitude',
        message: 'Rất vui được giúp bạn! Nếu cần gì thêm, đừng ngần ngại hỏi nhé. 😊'
      };
    }

    // Farewell patterns
    if (/bye|goodbye|tạm biệt|see you|bái bai|hẹn gặp lại/i.test(lowerMessage)) {
      return {
        type: 'farewell',
        message: 'Hẹn gặp lại! Chúc bạn một ngày tuyệt vời. 🌟'
      };
    }

    // Help/Capabilities patterns
    if (/what can you do|help me|giúp gì|làm gì|có thể làm|bạn làm được gì/i.test(lowerMessage)) {
      return {
        type: 'help',
        message: 'Tôi có thể giúp bạn:\n- Tra cứu đơn hàng\n- Tìm kiếm sản phẩm\n- Giải đáp chính sách (đổi trả, giao hàng)\n- Hướng dẫn đặt hàng\n\nBạn muốn biết về điều gì?'
      };
    }

    // Order status patterns
    if (/order|tracking|status|đơn hàng|vận chuyển/.test(lowerMessage)) {
      const orderMatch = message.match(/#?(\w{6,})/); // Match potential order ID
      return { type: 'order_status', orderNumber: orderMatch?.[1] };
    }

    // Product search
    if (/find|search|looking for|buy|tìm|mua|bánh|cake|bread/.test(lowerMessage)) {
      return { type: 'product_search', query: message };
    }

    return { type: 'unknown' };
  },

  async handleOrderStatus(userId?: string, orderNumber?: string) {
    if (!userId) {
      return "Please log in to check your order status.";
    }

    if (!orderNumber) {
      // If no order number provided, show most recent order
      const lastOrder = await prisma.order.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (!lastOrder) {
        return "You haven't placed any orders yet.";
      }
      return `Your most recent order #${lastOrder.id} is currently **${lastOrder.status}**.`;
    }

    const order = await prisma.order.findFirst({
      where: {
        userId,
        OR: [{ id: orderNumber }, { orderNumber }]
      }
    });

    if (!order) {
      return `I couldn't find an order with ID #${orderNumber}. Please check the number and try again.`;
    }

    return `Order #${order.id} is currently **${order.status}**. It was placed on ${new Date(order.createdAt).toLocaleDateString()}.`;
  },

  async handleProductSearch(query: string) {
    // Extract keywords
    const keywords = query.replace(/find|search|looking for|buy|tìm|mua/gi, '').trim();

    const products = await prisma.product.findMany({
      where: {
        isAvailable: true,
        OR: [
          { name: { contains: keywords } },
          { description: { contains: keywords } }
        ]
      },
      select: { name: true, slug: true, price: true },
      take: 3
    });

    if (products.length === 0) {
      return "I couldn't find any products matching your description. Try browsing our categories!";
    }

    const productLinks = products.map(p => `- [${p.name}](/products/${p.slug}) - ${Number(p.price).toLocaleString()}đ`).join('\n');
    return `Here are some products you might like:\n${productLinks}`;
  },

  async handleWithGemini(message: string, conversationHistory?: Message[]) {
    if (!process.env.GEMINI_API_KEY) {
      return "Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể:\n" +
             "- Hỏi về sản phẩm (bánh, giá)\n" +
             "- Tra cứu đơn hàng\n" +
             "- Hỏi chính sách (giao hàng, đổi trả)\n" +
             "Hoặc liên hệ support@klelite.com để được hỗ trợ trực tiếp.";
    }

    try {
      const geminiAI = getGeminiAI();
      if (!geminiAI) {
        return "AI service tạm thời không khả dụng. Vui lòng liên hệ support@klelite.com.";
      }

      // Use gemini-2.0-flash (gemini-pro was deprecated in 2024)
      const model = geminiAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Build conversation context
      const systemPrompt =
        "You are a helpful assistant for KL'elite Luxury Bakery. " +
        "Answer questions about our products, policies, and services. " +
        "Be concise (max 200 words) and friendly. " +
        "If you cannot help, suggest contacting support@klelite.com. " +
        "Always respond in Vietnamese.";

      let conversationText = systemPrompt + "\n\n";

      // Add recent history (last 4 messages for context)
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-4);
        recentHistory.forEach(msg => {
          const role = msg.role === 'user' ? 'Khách hàng' : 'Trợ lý';
          conversationText += `${role}: ${msg.content}\n`;
        });
      }

      conversationText += `Khách hàng: ${message}\nTrợ lý:`;

      const result = await model.generateContent(conversationText);
      const response = await result.response;
      const text = response.text();

      return text || "Xin lỗi, tôi không thể tạo phản hồi.";

    } catch (error: any) {
      console.error('Gemini API Error:', error);

      // Detailed error logging for debugging
      if (error?.message) {
        console.error('Error message:', error.message);
      }
      if (error?.status) {
        console.error('Error status:', error.status);
      }

      // Handle specific error cases
      if (error?.message?.includes('quota') || error?.message?.includes('429')) {
        return "Dịch vụ AI tạm thời quá tải. Vui lòng thử lại sau ít phút hoặc liên hệ support@klelite.com.";
      }

      if (error?.message?.includes('API key') || error?.message?.includes('401')) {
        console.error('CRITICAL: Invalid or missing Gemini API key');
        return "Dịch vụ AI chưa được cấu hình đúng. Vui lòng liên hệ support@klelite.com.";
      }

      return "Tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ support@klelite.com.";
    }
  }
};
