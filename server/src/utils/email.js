import { Resend } from 'resend';

// Initialize Resend client
let resend = null;

const getResend = () => {
  if (resend) return resend;

  if (process.env.RESEND_API_KEY) {
    console.log('Initializing Resend email service');
    resend = new Resend(process.env.RESEND_API_KEY);
    return resend;
  }

  console.log('No RESEND_API_KEY configured - emails will be logged to console');
  return null;
};

// Generate a 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, code, name) => {
  const client = getResend();

  const emailContent = {
    from: process.env.EMAIL_FROM || 'NYU Mealswipe <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your NYU Mealswipe account',
    html: `
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

  if (client) {
    try {
      const result = await client.emails.send(emailContent);
      console.log(`Verification email sent to ${email}`, result);
      if (result.error) {
        throw new Error(result.error.message);
      }
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
  const client = getResend();

  const emailContent = {
    from: process.env.EMAIL_FROM || 'NYU Mealswipe <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your NYU Mealswipe password',
    html: `
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

  if (client) {
    try {
      const result = await client.emails.send(emailContent);
      console.log(`Password reset email sent to ${email}`, result);
      if (result.error) {
        throw new Error(result.error.message);
      }
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
