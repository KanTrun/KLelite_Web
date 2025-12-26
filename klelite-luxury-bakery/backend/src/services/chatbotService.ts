import OpenAI from 'openai';
import FAQ from '../models/FAQ';
import Order from '../models/Order';
import Product from '../models/Product';

let openai: OpenAI | null = null;

const getOpenAI = () => {
  if (openai) return openai;
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
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
        case 'unknown':
          return this.handleWithOpenAI(message, conversationHistory);
        default:
          return this.handleWithOpenAI(message, conversationHistory);
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

  async handleWithOpenAI(message: string, history?: Message[]) {
    if (!process.env.OPENAI_API_KEY) {
      return "I'm not sure how to answer that. Please contact our support team at support@klelite.com.";
    }

    try {
      const openaiInstance = getOpenAI();
      if (!openaiInstance) {
        return "I'm not sure how to answer that. Please contact our support team at support@klelite.com.";
      }
      const response = await openaiInstance.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for KL\'elite Luxury Bakery. Answer questions about our products, policies, and services. Be concise and friendly. If you cannot help, suggest contacting support@klelite.com.' },
          ...(history || []).slice(-4), // Keep last 4 messages for context
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.7
      });
      return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return "I'm currently experiencing high traffic. Please try again later.";
    }
  }
};
