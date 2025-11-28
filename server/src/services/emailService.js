const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    // Check if SendGrid API key is available
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid not configured. Set SENDGRID_API_KEY environment variable.');
      return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.initialized = true;
    console.log('SendGrid email service initialized');
  }

  async sendVerificationEmail(email, verificationUrl, username) {
    this.initialize();

    if (!this.initialized) {
      console.error('Email service not configured. Cannot send verification email.');
      throw new Error('Email service not configured');
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
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
                Verify Your Email Address
              </h2>
              <p style="margin: 0 0 16px; color: #cccccc; font-size: 16px; line-height: 1.5;">
                Hi ${username || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #cccccc; font-size: 16px; line-height: 1.5;">
                Thanks for signing up for AI Hair Simulation! Please verify your email address by clicking the button below:
              </p>
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${verificationUrl}"
                       style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                This link will expire in <strong style="color: #ffffff;">24 hours</strong>.
              </p>
              <p style="margin: 16px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                If you can't click the button, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; color: #666666; font-size: 12px; word-break: break-all;">
                ${verificationUrl}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0a0a0a; border: 1px solid #333333; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5; text-align: center;">
                If you didn't create an account with AI Hair Simulation, you can safely ignore this email.
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
Verify Your Email Address

Hi ${username || 'there'},

Thanks for signing up for AI Hair Simulation! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with AI Hair Simulation, you can safely ignore this email.

- AI Hair Simulation Team
    `;

    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
        name: 'AI Hair Simulation'
      },
      subject: 'Verify Your Email - AI Hair Simulation',
      text: textContent,
      html: htmlContent
    };

    try {
      const response = await sgMail.send(msg);
      console.log('Verification email sent via SendGrid:', response[0].statusCode);
      return { success: true, statusCode: response[0].statusCode };
    } catch (error) {
      console.error('Error sending verification email:', error);
      if (error.response) {
        console.error('SendGrid error body:', error.response.body);
      }
      throw error;
    }
  }

  async sendPasswordResetEmail(email, resetUrl, username) {
    this.initialize();

    if (!this.initialized) {
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

    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
        name: 'AI Hair Simulation'
      },
      subject: 'Reset Your Password - AI Hair Simulation',
      text: textContent,
      html: htmlContent
    };

    try {
      const response = await sgMail.send(msg);
      console.log('Password reset email sent via SendGrid:', response[0].statusCode);
      return { success: true, statusCode: response[0].statusCode };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      if (error.response) {
        console.error('SendGrid error body:', error.response.body);
      }
      throw error;
    }
  }
}

module.exports = new EmailService();
