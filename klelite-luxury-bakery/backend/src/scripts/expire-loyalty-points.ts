import mongoose from 'mongoose';
import { config } from '../config';
import { loyaltyService } from '../services/loyalty-service';

/**
 * Script to expire loyalty points
 * Run this script as a cron job (e.g., daily at midnight)
 */

async function expirePoints() {
  try {
    // Connect to database
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Expire points
    const result = await loyaltyService.expirePoints();

    console.log(`Points expiration completed:`);
    console.log(`- Accounts affected: ${result.total}`);
    console.log(`- Total points expired: ${result.expired}`);

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    console.error('Error expiring points:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  expirePoints();
}

export default expirePoints;
