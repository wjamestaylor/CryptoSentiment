#!/usr/bin/env node
/**
 * Migration script to move data from FollowedCoin and PortfolioHolding to CryptoTracking
 * This script combines the existing watchlist and portfolio functionality into a unified system
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToCryptoTracking() {
  console.log('Starting migration to CryptoTracking...');
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Migrate FollowedCoin data (watching only)
      console.log('Migrating FollowedCoin data...');
      
      const followedCoins = await tx.followedCoin.findMany({
        where: { migratedToCryptoTracking: false },
        include: { crypto: true }
      });
      
      console.log(`Found ${followedCoins.length} followed coins to migrate`);
      
      for (const followed of followedCoins) {
        // Check if this user already has a CryptoTracking entry for this crypto
        const existingTracking = await tx.cryptoTracking.findUnique({
          where: {
            userId_cryptoId: {
              userId: followed.userId,
              cryptoId: followed.cryptoId,
            }
          }
        });
        
        if (!existingTracking) {
          // Create new CryptoTracking entry for watching only
          await tx.cryptoTracking.create({
            data: {
              userId: followed.userId,
              cryptoId: followed.cryptoId,
              isWatching: true,
              // Portfolio fields remain null (watching only)
              holdingAmount: null,
              averagePurchasePrice: null,
              totalInvested: null,
              firstPurchaseDate: null,
              // Metadata
              addedAt: followed.createdAt,
              notes: null,
              tags: [],
              lastViewedAt: followed.createdAt,
              priceAlerts: [],
              // Migration tracking
              migratedFromFollowed: true,
              migratedFromHolding: false,
            }
          });
          
          console.log(`Created CryptoTracking for ${followed.crypto.symbol} (user: ${followed.userId})`);
        } else {
          console.log(`CryptoTracking already exists for ${followed.crypto.symbol} (user: ${followed.userId})`);
        }
        
        // Mark as migrated
        await tx.followedCoin.update({
          where: { id: followed.id },
          data: { migratedToCryptoTracking: true }
        });
      }
      
      // 2. Migrate PortfolioHolding data (with holdings)
      console.log('Migrating PortfolioHolding data...');
      
      const portfolioHoldings = await tx.portfolioHolding.findMany({
        where: { migratedToCryptoTracking: false },
        include: { crypto: true }
      });
      
      console.log(`Found ${portfolioHoldings.length} portfolio holdings to migrate`);
      
      for (const holding of portfolioHoldings) {
        // Check if this user already has a CryptoTracking entry for this crypto
        const existingTracking = await tx.cryptoTracking.findUnique({
          where: {
            userId_cryptoId: {
              userId: holding.userId,
              cryptoId: holding.cryptoId,
            }
          }
        });
        
        if (existingTracking) {
          // Update existing entry to include holding data
          await tx.cryptoTracking.update({
            where: { id: existingTracking.id },
            data: {
              // Add portfolio data
              holdingAmount: holding.amount,
              averagePurchasePrice: holding.purchasePrice,
              totalInvested: holding.purchasePrice ? holding.amount * holding.purchasePrice : null,
              firstPurchaseDate: holding.purchaseDate || holding.createdAt,
              // Update metadata
              notes: holding.notes || existingTracking.notes,
              addedAt: existingTracking.addedAt < holding.createdAt ? existingTracking.addedAt : holding.createdAt,
              // Migration tracking
              migratedFromHolding: true,
            }
          });
          
          console.log(`Updated existing CryptoTracking with holdings for ${holding.crypto.symbol} (user: ${holding.userId})`);
        } else {
          // Create new CryptoTracking entry with holdings
          await tx.cryptoTracking.create({
            data: {
              userId: holding.userId,
              cryptoId: holding.cryptoId,
              isWatching: true,
              // Portfolio fields
              holdingAmount: holding.amount,
              averagePurchasePrice: holding.purchasePrice,
              totalInvested: holding.purchasePrice ? holding.amount * holding.purchasePrice : null,
              firstPurchaseDate: holding.purchaseDate || holding.createdAt,
              // Metadata
              addedAt: holding.createdAt,
              notes: holding.notes,
              tags: [],
              lastViewedAt: holding.createdAt,
              priceAlerts: [],
              // Migration tracking
              migratedFromFollowed: false,
              migratedFromHolding: true,
            }
          });
          
          console.log(`Created CryptoTracking with holdings for ${holding.crypto.symbol} (user: ${holding.userId})`);
        }
        
        // Mark as migrated
        await tx.portfolioHolding.update({
          where: { id: holding.id },
          data: { migratedToCryptoTracking: true }
        });
      }
      
      // 3. Generate summary report
      const totalCryptoTracking = await tx.cryptoTracking.count();
      const watchingOnly = await tx.cryptoTracking.count({
        where: { holdingAmount: null }
      });
      const withHoldings = await tx.cryptoTracking.count({
        where: { holdingAmount: { not: null } }
      });
      
      console.log('\n=== Migration Summary ===');
      console.log(`Total CryptoTracking entries: ${totalCryptoTracking}`);
      console.log(`Watching only: ${watchingOnly}`);
      console.log(`With holdings: ${withHoldings}`);
      console.log(`Migrated FollowedCoins: ${followedCoins.length}`);
      console.log(`Migrated PortfolioHoldings: ${portfolioHoldings.length}`);
      console.log('Migration completed successfully!');
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Self-executing function
if (require.main === module) {
  migrateToCryptoTracking()
    .then(() => {
      console.log('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToCryptoTracking };