// Generate a 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email via Brevo REST API
const sendBrevoEmail = async (to, subject, htmlContent) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'NYU Mealswipe', email: 'noreply@nyumealswipe.com' },
      to: [{ email: to }],
      subject,
      htmlContent
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email');
  }

  return response.json();
};

// Send verification email
export const sendVerificationEmail = async (email, code, name) => {
  if (!process.env.BREVO_API_KEY) {
    console.log('=== VERIFICATION EMAIL ===');
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log('========================');
    return;
  }

  const htmlContent = `
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
  `;

  try {
    const result = await sendBrevoEmail(email, 'Verify your NYU Mealswipe account', htmlContent);
    console.log(`Verification email sent to ${email}`, result);
  } catch (error) {
    console.error('Failed to send verification email:', error.message);
    throw new Error(`Email failed: ${error.message}`);
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, code, name) => {
  if (!process.env.BREVO_API_KEY) {
    console.log('=== PASSWORD RESET EMAIL ===');
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log('============================');
    return;
  }

  const htmlContent = `
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
  `;

  try {
    const result = await sendBrevoEmail(email, 'Reset your NYU Mealswipe password', htmlContent);
    console.log(`Password reset email sent to ${email}`, result);
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
    throw new Error(`Email failed: ${error.message}`);
  }
};
