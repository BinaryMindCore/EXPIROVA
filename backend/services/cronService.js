import cron from 'node-cron';
import Product from '../models/Product.js';

const initCronJobs = () => {
  // Schedules the job to run every single night at 00:00 (Midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running daily background expiration scanner...');

    try {
      const today = new Date();
      
      // Fetch all tracked products currently marked as "Active"
      const activeProducts = await Product.find({ status: 'Active' });

      let notificationCount = 0;

      for (const product of activeProducts) {
        const expiry = new Date(product.expiryDate);
        
        // Calculate difference in milliseconds, then convert to total days
        const differenceInTime = expiry.getTime() - today.getTime();
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

        // Check if item crossed its unique warning window threshold
        if (differenceInDays <= product.daysBeforeNotification) {
          product.status = 'Notified';
          await product.save();
          notificationCount++;
        }
      }

      console.log(`✅ Scan finished. Updated ${notificationCount} products to 'Notified' status.`);
    } catch (error) {
      console.error(`❌ Automation Service Error: ${error.message}`);
    }
  });
};

export default initCronJobs;