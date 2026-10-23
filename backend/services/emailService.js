import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

// Initialize Transporter
const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`📧 SMTP Transporter initialized with host: ${process.env.SMTP_HOST}`);
  } else {
    // Development fallback using Ethereal test account or simulated logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`📧 Development Ethereal SMTP initialized. User: ${testAccount.user}`);
    } catch (e) {
      console.warn('⚠️ Could not create Ethereal SMTP test account. Falling back to Console Email Logger.');
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('\n================== [SIMULATED EMAIL DISPATCH] ==================');
          console.log(`TO:      ${mailOptions.to}`);
          console.log(`FROM:    ${mailOptions.from}`);
          console.log(`SUBJECT: ${mailOptions.subject}`);
          console.log(`BODY:\n${mailOptions.text || mailOptions.html.replace(/<[^>]*>/g, '')}`);
          console.log('=================================================================\n');
          return { messageId: 'simulated-' + Date.now() };
        },
      };
    }
  }

  return transporter;
};

const FROM_EMAIL = process.env.SMTP_FROM || '"Expirova Smart Inventory" <alerts@expirova.com>';

/**
 * 1. Immediate confirmation email upon adding product to inventory
 */
export const sendConfirmationEmail = async ({ toEmail, product }) => {
  try {
    const mailClient = await getTransporter();

    const formattedMfg = product.mfg_date
      ? new Date(product.mfg_date).toLocaleDateString('en-US', { dateStyle: 'medium' })
      : 'Not Specified';
    const formattedExpiry = new Date(product.expiry_date).toLocaleDateString('en-US', {
      dateStyle: 'medium',
    });

    const info = await mailClient.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `✅ Inventory Confirmation: ${product.name} Added`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #0d5f94; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.5px;">Expirova Inventory</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Smart Product Tracking & Expiry Guard</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 16px; color: #1e293b;">Hello,</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.5;">
              A new product has been successfully logged into your inventory. Here is the confirmation summary:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 20px;">
              <tr style="background: #f8fafc;">
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Product Name</td>
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${product.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Category</td>
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #0f172a;">${product.category || 'General'}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Barcode</td>
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #0f172a; font-family: monospace;">${product.barcode || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Storage Location</td>
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${product.location || 'General Storage'}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Manufacturing Date</td>
                <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #0f172a;">${formattedMfg}</td>
              </tr>
              <tr style="background: #eff6ff;">
                <td style="padding: 10px 14px; border: 1px solid #bfdbfe; font-weight: bold; color: #1e40af;">Expiration Date</td>
                <td style="padding: 10px 14px; border: 1px solid #bfdbfe; color: #1e40af; font-weight: bold;">${formattedExpiry}</td>
              </tr>
            </table>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              Our automated daemon is now actively monitoring this item. You will receive proactive warnings before and on the date of expiration.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
            © ${new Date().getFullYear()} Expirova Inc. Automated Inventory Alerts.
          </div>
        </div>
      `,
    });

    console.log(`✉️ Confirmation email dispatched to ${toEmail} for "${product.name}". Message ID: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl && info) {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log(`🔗 Ethereal Email Preview: ${preview}`);
    }
    return info;
  } catch (err) {
    console.error('❌ Failed to send confirmation email:', err.message);
  }
};

/**
 * 2. RULE 1: Exactly 1-Day Prior Alert Email (23-24 hrs remaining)
 */
export const send1DayPriorAlertEmail = async ({ toEmail, product, hoursRemaining }) => {
  try {
    const mailClient = await getTransporter();
    const formattedExpiry = new Date(product.expiry_date).toLocaleDateString('en-US', {
      dateStyle: 'full',
    });

    const info = await mailClient.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `⚠️ 24-HOUR EXPIRY NOTICE: "${product.name}" Expires Tomorrow!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fbbf24; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #d97706; padding: 22px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px;">⚠️ 24-Hour Expiration Notice</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px;">Action required within the next 24 hours</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 15px; color: #1e293b;">
              Dear User, your tracked item <strong>${product.name}</strong> is approximately <strong>${Math.round(hoursRemaining)} hours away</strong> from expiration.
            </p>
            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 6px 0; color: #92400e; font-weight: bold;">Product Details:</p>
              <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px;">
                <li><strong>Name:</strong> ${product.name}</li>
                <li><strong>Category:</strong> ${product.category || 'General'}</li>
                <li><strong>Barcode:</strong> ${product.barcode || 'N/A'}</li>
                <li><strong>Expiry Date:</strong> ${formattedExpiry}</li>
              </ul>
            </div>
            <p style="font-size: 14px; color: #475569;">
              Please plan to use, discount, or dispense this item promptly to avoid stock waste.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
            Expirova 24-Hour Expiry Daemon
          </div>
        </div>
      `,
    });

    console.log(`⚠️ 1-Day Prior Alert sent to ${toEmail} for "${product.name}".`);
    return info;
  } catch (err) {
    console.error('❌ Failed to send 1-day prior alert:', err.message);
  }
};

/**
 * 3. RULE 2: Expiration Day Emergency Alert (Every 3 Hours)
 */
export const send3HourEmergencyAlertEmail = async ({ toEmail, product, hoursRemaining }) => {
  try {
    const mailClient = await getTransporter();

    const info = await mailClient.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `🚨 URGENT: "${product.name}" Expires TODAY (Every-3h Alert)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #ef4444; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #dc2626; padding: 22px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px;">🚨 EMERGENCY: Product Expiring Today</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px;">Recurring 3-Hour Immediate Action Notice</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 15px; color: #1e293b; line-height: 1.5;">
              This is an urgent recurring alert. <strong>${product.name}</strong> is in its critical expiration window (<strong>${Math.max(0, Math.round(hoursRemaining))} hours remaining today</strong>).
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 6px 0; color: #991b1b; font-weight: bold;">Critical Item Summary:</p>
              <ul style="margin: 0; padding-left: 20px; color: #b91c1c; font-size: 14px;">
                <li><strong>Product:</strong> ${product.name}</li>
                <li><strong>Category:</strong> ${product.category || 'General'}</li>
                <li><strong>Barcode:</strong> ${product.barcode || 'N/A'}</li>
                <li><strong>Expiry Timestamp:</strong> ${product.expiry_date}</li>
              </ul>
            </div>
            <p style="font-size: 13px; color: #64748b;">
              You will continue to receive emergency notifications every 3 hours until this product is processed or marked consumed/wasted in the system.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
            Expirova High-Frequency Emergency Daemon
          </div>
        </div>
      `,
    });

    console.log(`🚨 3-Hour Emergency Alert sent to ${toEmail} for "${product.name}".`);
    return info;
  } catch (err) {
    console.error('❌ Failed to send 3-hour emergency alert:', err.message);
  }
};
