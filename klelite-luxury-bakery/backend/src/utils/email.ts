import nodemailer from 'nodemailer';
import { config } from '../config';
import { EmailOptions } from '../types';

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.email.smtpHost,
  port: config.email.smtpPort,
  secure: config.email.smtpPort === 465,
  auth: {
    user: config.email.smtpUser,
    pass: config.email.smtpPass,
  },
});

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};

// Email templates
export const emailTemplates = {
  // Verification email
  verification: (name: string, verificationUrl: string) => ({
    subject: "Xác thực tài khoản - KL'élite Luxury Bakery",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px; background: #1a1a2e; }
          .header h1 { color: #D4AF37; margin: 0; font-family: 'Georgia', serif; }
          .content { padding: 30px; background: #fff; }
          .btn { display: inline-block; padding: 12px 30px; background: #D4AF37; color: #fff; text-decoration: none; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KL'élite Luxury Bakery</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${name},</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại KL'élite Luxury Bakery.</p>
            <p>Vui lòng nhấn vào nút bên dưới để xác thực email của bạn:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="btn">Xác thực email</a>
            </p>
            <p>Link xác thực sẽ hết hạn sau 24 giờ.</p>
            <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} KL'élite Luxury Bakery. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Reset password email
  resetPassword: (name: string, resetUrl: string) => ({
    subject: "Đặt lại mật khẩu - KL'élite Luxury Bakery",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px; background: #1a1a2e; }
          .header h1 { color: #D4AF37; margin: 0; font-family: 'Georgia', serif; }
          .content { padding: 30px; background: #fff; }
          .btn { display: inline-block; padding: 12px 30px; background: #D4AF37; color: #fff; text-decoration: none; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KL'élite Luxury Bakery</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${name},</h2>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
            <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="btn">Đặt lại mật khẩu</a>
            </p>
            <p>Link đặt lại mật khẩu sẽ hết hạn sau 1 giờ.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} KL'élite Luxury Bakery. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Order confirmation email
  orderConfirmation: (name: string, orderNumber: string, orderUrl: string) => ({
    subject: `Xác nhận đơn hàng #${orderNumber} - KL'élite Luxury Bakery`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px; background: #1a1a2e; }
          .header h1 { color: #D4AF37; margin: 0; font-family: 'Georgia', serif; }
          .content { padding: 30px; background: #fff; }
          .btn { display: inline-block; padding: 12px 30px; background: #D4AF37; color: #fff; text-decoration: none; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KL'élite Luxury Bakery</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${name},</h2>
            <p>Cảm ơn bạn đã đặt hàng tại KL'élite Luxury Bakery!</p>
            <p>Đơn hàng <strong>#${orderNumber}</strong> của bạn đã được tiếp nhận và đang được xử lý.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${orderUrl}" class="btn">Xem chi tiết đơn hàng</a>
            </p>
            <p>Chúng tôi sẽ thông báo khi đơn hàng được giao.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} KL'élite Luxury Bakery. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

export default sendEmail;
