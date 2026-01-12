import prisma from '../lib/prisma';

/**
 * Script to expire loyalty points
 * Run this script as a cron job (e.g., daily at midnight)
 */

async function expirePoints() {
  try {
    console.log('Starting loyalty points expiration...');

    // Get expiry threshold (e.g., 1 year ago)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() - 1);

    // Find accounts with points older than expiry date (check updatedAt as proxy for last activity)
    const accountsWithExpiredPoints = await prisma.loyaltyAccount.findMany({
      where: {
        updatedAt: { lt: expiryDate },
        currentPoints: { gt: 0 }
      }
    });

    let totalExpired = 0;
    let affectedAccounts = 0;

    // Expire points for each account
    for (const account of accountsWithExpiredPoints) {
      await prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          currentPoints: 0,
          lifetimePoints: account.lifetimePoints // Keep lifetime points
        }
      });
      totalExpired += account.currentPoints;
      affectedAccounts++;
    }

    console.log(`Points expiration completed:`);
    console.log(`- Accounts affected: ${affectedAccounts}`);
    console.log(`- Total points expired: ${totalExpired}`);

    process.exit(0);
  } catch (error) {
    console.error('Error expiring points:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  expirePoints();
}

export default expirePoints;
