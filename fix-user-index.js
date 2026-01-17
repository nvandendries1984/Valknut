import { connectDatabase, mongoose } from './src/utils/database.js';
import { logger } from './src/utils/logger.js';

/**
 * Fix duplicate key error by removing old userId index
 * The schema now uses a compound index (userId + guildId) instead
 */
async function fixUserIndex() {
    try {
        await connectDatabase();

        const User = mongoose.connection.collection('users');

        // Get current indexes
        const indexes = await User.indexes();
        logger.info('Current indexes:');
        console.log(JSON.stringify(indexes, null, 2));

        // Check if old userId_1 index exists
        const hasOldIndex = indexes.some(idx => idx.name === 'userId_1' && idx.unique === true);

        if (hasOldIndex) {
            logger.warn('Found old userId_1 unique index - dropping it...');
            await User.dropIndex('userId_1');
            logger.success('✅ Dropped old userId_1 index');
        } else {
            logger.info('✓ No problematic userId_1 unique index found');
        }

        // Verify compound index exists
        const hasCompoundIndex = indexes.some(idx =>
            idx.name === 'userId_1_guildId_1' ||
            (idx.key && idx.key.userId === 1 && idx.key.guildId === 1)
        );

        if (!hasCompoundIndex) {
            logger.warn('Compound index (userId + guildId) not found - creating it...');
            await User.createIndex({ userId: 1, guildId: 1 }, { unique: true });
            logger.success('✅ Created compound index');
        } else {
            logger.info('✓ Compound index (userId + guildId) exists');
        }

        // Show final indexes
        const finalIndexes = await User.indexes();
        logger.info('\nFinal indexes:');
        console.log(JSON.stringify(finalIndexes, null, 2));

        logger.success('\n✅ Index fix completed successfully');

    } catch (error) {
        logger.error(`Error fixing indexes: ${error.message}`);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fixUserIndex();
