import * as Brevo from '@getbrevo/brevo';

// Initialize Brevo client
let apiInstance = null;

const getBrevoClient = () => {
  if (apiInstance) return apiInstance;

  if (process.env.BREVO_API_KEY) {
    console.log('Initializing Brevo email service');
    apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    return apiInstance;
  }

  console.log('No BREVO_API_KEY configured - emails will be logged to console');
  return null;
};

// Generate a 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, code, name) => {
  const client = getBrevoClient();

  if (client) {
    try {
      const sendSmtpEmail = {
        sender: { name: 'NYU Mealswipe', email: 'noreply@nyumealswipe.com' },
        to: [{ email }],
        subject: 'Verify your NYU Mealswipe account',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #57068c;">Welcome to NYU Mealswipe Marketplace!</h2>
            <p>Hi ${name},</p>
            <p>Thank you for signing up. Please use the following code to verify your email address:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #57068c;">${code}</span>
            </div>
            <p>This code will expire in <strong>15 minutes</strong>.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">NYU Mealswipe Marketplace - Buy and sell meal swipes with fellow NYU students</p>
          </div>
        `
      };

      const result = await client.sendTransacEmail(sendSmtpEmail);
      console.log(`Verification email sent to ${email}`, result);
    } catch (error) {
      console.error('Failed to send verification email:', error.message);
      throw new Error(`Email failed: ${error.message}`);
    }
  } else {
    // Log to console for development
    console.log('=== VERIFICATION EMAIL ===');
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log('========================');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, code, name) => {
  const client = getBrevoClient();

  if (client) {
    try {
      const sendSmtpEmail = {
        sender: { name: 'NYU Mealswipe', email: 'noreply@nyumealswipe.com' },
        to: [{ email }],
        subject: 'Reset your NYU Mealswipe password',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #57068c;">Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Use the following code to reset it:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #57068c;">${code}</span>
            </div>
            <p>This code will expire in <strong>15 minutes</strong>.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">NYU Mealswipe Marketplace - Buy and sell meal swipes with fellow NYU students</p>
          </div>
        `
      };

      const result = await client.sendTransacEmail(sendSmtpEmail);
      console.log(`Password reset email sent to ${email}`, result);
    } catch (error) {
      console.error('Failed to send password reset email:', error.message);
      throw new Error(`Email failed: ${error.message}`);
    }
  } else {
    // Log to console for development
    console.log('=== PASSWORD RESET EMAIL ===');
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log('============================');
  }
};
