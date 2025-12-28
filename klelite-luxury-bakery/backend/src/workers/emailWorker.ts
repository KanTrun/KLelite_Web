import { Worker, Job } from 'bullmq';
import redis, { isRedisAvailable } from '../config/redis';
import { EmailJobData } from '../queues';
import nodemailer from 'nodemailer';
import { config } from '../config';

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  orderStatusUpdate: (data: any) => ({
    subject: `Order #${data.orderNumber} - ${data.status}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Order Status Update</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your order #${data.orderNumber} status has been updated to: <strong>${data.status}</strong></p>
        ${data.trackingNumber ? `<p>Tracking Number: ${data.trackingNumber}</p>` : ''}
        <p>Thank you for shopping with KL'élite Luxury Bakery!</p>
      </div>
    `
  }),
  pointsEarned: (data: any) => ({
    subject: `You earned ${data.points} loyalty points!`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Loyalty Points Earned</h2>
        <p>Dear ${data.customerName},</p>
        <p>You've earned <strong>${data.points}</strong> loyalty points!</p>
        <p>Total points: ${data.totalPoints}</p>
        <p>Keep shopping to earn more rewards!</p>
      </div>
    `
  }),
  flashSaleAlert: (data: any) => ({
    subject: `Flash Sale: ${data.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Flash Sale Alert!</h2>
        <p>Dear ${data.customerName},</p>
        <p><strong>${data.productName}</strong> is now on flash sale!</p>
        <p>Discount: ${data.discount}%</p>
        <p>Hurry, limited stock available!</p>
        <a href="${data.url}" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          Shop Now
        </a>
      </div>
    `
  }),
  welcome: (data: any) => ({
    subject: `Welcome to KL'élite Luxury Bakery!`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to KL'élite!</h2>
        <p>Dear ${data.customerName},</p>
        <p>Thank you for joining KL'élite Luxury Bakery.</p>
        <p>Enjoy premium baked goods and exclusive offers!</p>
      </div>
    `
  }),
  general: (data: any) => ({
    subject: data.subject || 'Notification from KL\'élite',
    html: data.html || `<p>${data.message}</p>`
  })
};

// Process email jobs
const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
  const { to, template, data } = job.data;

  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured, skipping email send');
    return;
  }

  const templateData = emailTemplates[template](data);

  try {
    await transporter.sendMail({
      from: `"KL'élite Luxury Bakery" <${process.env.EMAIL_USER}>`,
      to,
      subject: templateData.subject,
      html: templateData.html
    });

    console.log(`✅ Email sent to ${to}: ${templateData.subject}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error; // Re-throw to trigger retry
  }
};

// Create worker (only if Redis is available)
let emailWorker: Worker | null = null;

export const startEmailWorker = (): void => {
  if (!isRedisAvailable) {
    console.warn('⚠️  Email worker disabled (Redis not available)');
    return;
  }

  try {
    emailWorker = new Worker('email', processEmailJob, {
      connection: redis,
      concurrency: 5 // Process up to 5 emails concurrently
    });

    emailWorker.on('completed', (job) => {
      console.log(`Email job ${job.id} completed`);
    });

    emailWorker.on('failed', (job, error) => {
      console.error(`Email job ${job?.id} failed:`, error.message);
    });

    console.log('✅ Email worker started');
  } catch (error) {
    console.error('Error starting email worker:', error);
  }
};

// Cleanup on shutdown
export const stopEmailWorker = async (): Promise<void> => {
  if (emailWorker) {
    await emailWorker.close();
    console.log('✅ Email worker stopped');
  }
};

export default emailWorker;
