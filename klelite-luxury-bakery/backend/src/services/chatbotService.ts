import { GoogleGenerativeAI } from '@google/generative-ai';
import FAQ from '../models/FAQ';
import Order from '../models/Order';
import Product from '../models/Product';

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
    // Simple improved matching: check if any keyword from FAQ is present
    const faqs = await FAQ.find({ isActive: true });

    // Simple relevance scoring
    let bestMatch = null;
    let maxScore = 0;

    for (const faq of faqs) {
      let score = 0;
      for (const keyword of faq.keywords) {
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
      const lastOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
      if (!lastOrder) {
        return "You haven't placed any orders yet.";
      }
      return `Your most recent order #${lastOrder._id} is currently **${lastOrder.status}**.`;
    }

    const order = await Order.findOne({
      user: userId,
      $or: [{ _id: orderNumber }] // Assuming orderNumber is ID for simplicity, or could add custom orderId field
    });

    if (!order) {
      return `I couldn't find an order with ID #${orderNumber}. Please check the number and try again.`;
    }

    return `Order #${order._id} is currently **${order.status}**. It was placed on ${new Date(order.createdAt).toLocaleDateString()}.`;
  },

  async handleProductSearch(query: string) {
    // Extract keywords
    const keywords = query.replace(/find|search|looking for|buy|tìm|mua/gi, '').trim();

    const products = await Product.find(
      { $text: { $search: keywords }, isAvailable: true }
    ).limit(3).select('name slug price');

    if (products.length === 0) {
      return "I couldn't find any products matching your description. Try browsing our categories!";
    }

    const productLinks = products.map(p => `- [${p.name}](/products/${p.slug}) - ${p.price.toLocaleString()}đ`).join('\n');
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

      const model = geminiAI.getGenerativeModel({ model: 'gemini-pro' });

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

    } catch (error) {
      console.error('Gemini API Error:', error);
      return "Tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ support@klelite.com.";
    }
  }
};
