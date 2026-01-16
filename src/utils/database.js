import mongoose from 'mongoose';
import { config } from '../config/config.js';
import { logger } from './logger.js';

let isConnected = false;

/**
 * Connect to MongoDB database
 */
export async function connectDatabase() {
    if (isConnected) {
        logger.debug('MongoDB already connected');
        return;
    }

    try {
        await mongoose.connect(config.mongodbUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        
        const dbName = mongoose.connection.db.databaseName;
        const host = mongoose.connection.host;
        const port = mongoose.connection.port;
        
        logger.info(`✓ MongoDB connected successfully`);
        logger.info(`📊 Database: ${dbName}`);
        logger.info(`🔌 Host: ${host}:${port}`);

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            logger.error(`MongoDB connection error: ${error.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
            isConnected = true;
        });

    } catch (error) {
        logger.error(`Failed to connect to MongoDB: ${error.message}`);
        throw error;
    }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectDatabase() {
    if (!isConnected) {
        return;
    }

    try {
        await mongoose.disconnect();
        isConnected = false;
        logger.info('MongoDB disconnected successfully');
    } catch (error) {
        logger.error(`Failed to disconnect from MongoDB: ${error.message}`);
        throw error;
    }
}

/**
 * Get connection status
 */
export function isMongoConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get mongoose instance for creating models
 */
export { mongoose };
