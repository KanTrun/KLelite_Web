import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FAQ from '../models/FAQ';
import connectDB from '../config/database';

dotenv.config();

const faqs = [
  {
    question: 'How long does shipping take?',
    keywords: ['shipping', 'delivery', 'time', 'long', 'arrive', 'ship'],
    answer: 'Standard shipping takes 2-3 business days within the city, and 3-5 business days for other provinces. Express delivery is available for same-day delivery in select areas.',
    category: 'Shipping',
    order: 1
  },
  {
    question: 'What is your return policy?',
    keywords: ['return', 'refund', 'exchange', 'policy', 'back'],
    answer: 'Due to the perishable nature of our products, we do not accept returns. However, if you receive a damaged or incorrect item, please contact us within 24 hours for a refund or replacement.',
    category: 'Returns',
    order: 2
  },
  {
    question: 'Do you offer gluten-free options?',
    keywords: ['gluten', 'gluten-free', 'allergy', 'allergies', 'diet'],
    answer: 'Yes, we have a selection of gluten-free pastries and breads. You can filter products by "Gluten-Free" in our shop page. However, please note that our kitchen handles wheat flour, so cross-contamination is possible.',
    category: 'Products',
    order: 3
  },
  {
    question: 'Where are your stores located?',
    keywords: ['store', 'location', 'address', 'shop', 'visit', 'where'],
    answer: 'Our flagship store is located at 123 Dong Khoi, District 1, Ho Chi Minh City. We are open daily from 8:00 AM to 9:00 PM.',
    category: 'General',
    order: 4
  },
  {
    question: 'How can I pay for my order?',
    keywords: ['pay', 'payment', 'method', 'card', 'cash', 'credit'],
    answer: 'We accept credit/debit cards (Visa, Mastercard), domestic ATM cards via SePay, and cash on delivery (COD) for orders under 2 million VND.',
    category: 'Payment',
    order: 5
  },
  {
    question: 'Do you make custom cakes?',
    keywords: ['custom', 'cake', 'birthday', 'wedding', 'special', 'order'],
    answer: 'Yes! We create custom cakes for weddings, birthdays, and special events. Please contact us at least 3 days in advance to discuss your requirements.',
    category: 'Products',
    order: 6
  }
];

const seedFAQs = async () => {
  try {
    await connectDB();

    await FAQ.deleteMany({});
    await FAQ.insertMany(faqs);

    console.log('FAQs seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    process.exit(1);
  }
};

seedFAQs();
