const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    this.initialized = true;
  }

  async sendPasswordResetEmail(email, resetUrl, username) {
    this.initialize();

    if (!this.transporter) {
      console.error('Email service not configured. Cannot send password reset email.');
      throw new Error('Email service not configured');
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background-color: #111111; border: 1px solid #333333; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
                AI Hair Simulation
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: #111111; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 20px; font-weight: 600;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 16px; color: #cccccc; font-size: 16px; line-height: 1.5;">
                Hi ${username || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #cccccc; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password for your AI Hair Simulation account. Click the button below to set a new password:
              </p>
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${resetUrl}"
                       style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                This link will expire in <strong style="color: #ffffff;">1 hour</strong>.
              </p>
              <p style="margin: 16px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                If you can't click the button, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; color: #666666; font-size: 12px; word-break: break-all;">
                ${resetUrl}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0a0a0a; border: 1px solid #333333; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5; text-align: center;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <p style="margin: 16px 0 0; color: #444444; font-size: 11px; text-align: center;">
                &copy; ${new Date().getFullYear()} AI Hair Simulation. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Reset Your Password

Hi ${username || 'there'},

We received a request to reset your password for your AI Hair Simulation account.

Click the link below to set a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

- AI Hair Simulation Team
    `;

    const mailOptions = {
      from: `"AI Hair Simulation" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - AI Hair Simulation',
      text: textContent,
      html: htmlContent
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
