import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export async function createDatabaseBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = '/app/db-backups';
        const backupName = `valknut-backup-${timestamp}`;
        const tempBackupPath = path.join(backupDir, 'temp', backupName);
        const archivePath = path.join(backupDir, `${backupName}.tar.gz`);

        // MongoDB connection details from environment
        const mongoHost = process.env.MONGODB_HOST || 'mongo';
        const mongoPort = process.env.MONGODB_PORT || '27017';
        const mongoUser = process.env.MONGODB_USER || 'admin';
        const mongoPassword = process.env.MONGODB_PASSWORD || 'Pasja@2025';
        const mongoDatabase = process.env.MONGODB_DATABASE || 'valknut';

        logger.info('Starting database backup...');

        // Create temp directory
        await execAsync(`mkdir -p ${path.join(backupDir, 'temp')}`);

        // Create backup using mongodump
        const dumpCommand = `mongodump --host=${mongoHost} --port=${mongoPort} --username=${mongoUser} --password=${mongoPassword} --authenticationDatabase=admin --db=${mongoDatabase} --out=${tempBackupPath}`;
        await execAsync(dumpCommand);

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
