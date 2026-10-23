import cron from 'node-cron';
import { dbQuery, dbRun } from '../config/sqliteDb.js';
import {
  send1DayPriorAlertEmail,
  send3HourEmergencyAlertEmail,
} from './emailService.js';

/**
 * Scan all inventory products against Rule 1 and Rule 2
 */
export const runExpirationScan = async () => {
  console.log('🔍 [Daemon] Executing Expiration Scan cycle...');
  try {
    const products = await dbQuery(
      `SELECT p.*, u.email as user_email
       FROM products p
       JOIN users u ON p.user_id = u.id`
    );

    const now = Date.now();
    let rule1Count = 0;
    let rule2Count = 0;

    for (const item of products) {
      if (!item.expiry_date || !item.user_email) continue;

      const expiryTime = new Date(item.expiry_date).getTime();
      const diffMs = expiryTime - now;
      const hoursRemaining = diffMs / (1000 * 60 * 60);

      // ========================================================
      // RULE 1 (1-Day Prior):
      // Product between 23 and 24 hours away from its expiration
      // Send exactly ONE notification
      // ========================================================
      if (hoursRemaining >= 23 && hoursRemaining <= 24 && !item.day_prior_alert_sent) {
        console.log(
          `⏰ [Rule 1 Triggered] Product "${item.name}" is ${hoursRemaining.toFixed(1)}h from expiry. Sending 1-Day Prior alert to ${item.user_email}...`
        );

        await send1DayPriorAlertEmail({
          toEmail: item.user_email,
          product: item,
          hoursRemaining,
        });

        await dbRun('UPDATE products SET day_prior_alert_sent = 1 WHERE id = ?', [item.id]);
        rule1Count++;
      }

      // ========================================================
      // RULE 2 (Expiry Day - Every 3 Hours):
      // On the exact calendar day of expiration (0 <= hours <= 24)
      // Send emergency email every 3 hours; track last_3hr_alert
      // ========================================================
      if (hoursRemaining >= 0 && hoursRemaining <= 24) {
        let shouldSend3HrAlert = false;

        if (!item.last_3hr_alert) {
          shouldSend3HrAlert = true;
        } else {
          const lastAlertTime = new Date(item.last_3hr_alert).getTime();
          const msSinceLastAlert = now - lastAlertTime;
          const threeHoursInMs = 3 * 60 * 60 * 1000;

          if (msSinceLastAlert >= threeHoursInMs) {
            shouldSend3HrAlert = true;
          }
        }

        if (shouldSend3HrAlert) {
          console.log(
            `🚨 [Rule 2 Triggered] Product "${item.name}" is on its expiry day (${hoursRemaining.toFixed(1)}h left). Sending 3-hr recurring emergency alert to ${item.user_email}...`
          );

          await send3HourEmergencyAlertEmail({
            toEmail: item.user_email,
            product: item,
            hoursRemaining,
          });

          const currentIso = new Date().toISOString();
          await dbRun('UPDATE products SET last_3hr_alert = ? WHERE id = ?', [currentIso, item.id]);
          rule2Count++;
        }
      }
    }

    console.log(
      `✅ [Daemon] Scan finished. Dispatched ${rule1Count} (Rule 1) and ${rule2Count} (Rule 2) alert emails.`
    );
  } catch (err) {
    console.error('❌ [Daemon Error] Expiration scan failure:', err.message);
  }
};

/**
 * Initializes continuous background scheduler
 */
export const initExpirationDaemon = () => {
  // Run scan every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runExpirationScan();
  });

  // Run initial scan 10 seconds after server boot
  setTimeout(() => {
    runExpirationScan();
  }, 10000);

  console.log('🛡️ Automated Expiration Notification Daemon initialized (Running every 5 minutes).');
};

export default initExpirationDaemon;
