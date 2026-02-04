import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from './logger.js';
import { config } from '../config/config.js';
import { mongoose } from './database.js';

const execAsync = promisify(exec);

export async function createDatabaseBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = config.backupDir;
        const backupName = `valknut-backup-${timestamp}`;
        const tempBackupPath = path.join(backupDir, 'temp', backupName);
        const archivePath = path.join(backupDir, `${backupName}.tar.gz`);

        logger.info('Starting database backup...');

        // Create temp directory
        await execAsync(`mkdir -p ${tempBackupPath}`);

        // Get all collections from the database
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        logger.info(`Found ${collections.length} collections to backup`);

        // Export each collection as JSON
        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            const collection = db.collection(collectionName);

            // Get all documents from collection
            const documents = await collection.find({}).toArray();

            // Write to JSON file
            const outputPath = path.join(tempBackupPath, `${collectionName}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2));

            logger.info(`Backed up collection: ${collectionName} (${documents.length} documents)`);
        }

        // Create metadata file
        const metadata = {
            database: db.databaseName,
            timestamp: new Date().toISOString(),
            collections: collections.map(c => c.name),
            mongooseVersion: mongoose.version
        };
        fs.writeFileSync(
            path.join(tempBackupPath, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        // Compress backup to tar.gz
        const compressCommand = `cd ${backupDir}/temp && tar -czf ${archivePath} ${backupName}`;
        await execAsync(compressCommand);

        // Remove temp directory
        await execAsync(`rm -rf ${tempBackupPath}`);

        const successMessage = `✓ Database backup created: ${backupName}.tar.gz`;
        logger.success(successMessage);

        // Clean up old backups (keep last 7 days)
        await cleanupOldBackups(backupDir);

        return archivePath;
    } catch (error) {
        const errorMessage = `Database backup failed: ${error.message}`;
        logger.error(errorMessage);

        throw error;
    }
}

async function cleanupOldBackups(backupDir) {
    try {
        const { stdout } = await execAsync(`ls -t ${backupDir}`);
        const backups = stdout.trim().split('\n').filter(f => f.startsWith('valknut-backup-') && f.endsWith('.tar.gz'));

        // Keep only the last 7 backups
        if (backups.length > 7) {
            const toDelete = backups.slice(7);
            logger.info(`Cleaning up ${toDelete.length} old backup(s)...`);

            for (const backup of toDelete) {
                const backupPath = path.join(backupDir, backup);
                await execAsync(`rm -rf ${backupPath}`);
                logger.info(`Deleted old backup: ${backup}`);
            }
        }
    } catch (error) {
        logger.warn('Failed to cleanup old backups:', error.message);
    }
}
