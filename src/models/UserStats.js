import { mongoose } from '../utils/database.js';

const userStatsSchema = new mongoose.Schema({
    // Discord User ID
    userId: {
        type: String,
        required: true,
        index: true
    },

    // Guild ID (for multi-guild support)
    guildId: {
        type: String,
        required: true,
        index: true
    },

    // Date of the stats (YYYY-MM-DD format for daily tracking)
    date: {
        type: String,
        required: true,
        index: true
    },

    // Number of messages sent on this date
    messageCount: {
        type: Number,
        default: 0
    },

    // Total voice channel time in seconds on this date
    voiceTime: {
        type: Number,
        default: 0
    },

    // Voice channel session tracking (for active sessions)
    voiceSessionStart: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'userstats'
});

// Compound unique index for userId + guildId + date
userStatsSchema.index({ userId: 1, guildId: 1, date: 1 }, { unique: true });

// Static method to get or create today's stats entry
userStatsSchema.statics.getTodayStats = async function(userId, guildId) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    let stats = await this.findOne({ userId, guildId, date: today });

    if (!stats) {
        stats = await this.create({
            userId,
            guildId,
            date: today,
            messageCount: 0,
            voiceTime: 0
        });
    }

    return stats;
};

// Static method to increment message count
userStatsSchema.statics.incrementMessageCount = async function(userId, guildId) {
    const stats = await this.getTodayStats(userId, guildId);
    stats.messageCount += 1;
    await stats.save();
    return stats;
};

// Static method to get stats for a period (1, 7, or 14 days)
userStatsSchema.statics.getStatsForPeriod = async function(userId, guildId, days) {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    const stats = await this.find({
        userId,
        guildId,
        date: { $in: dates }
    });

    // Calculate totals
    const totalMessages = stats.reduce((sum, stat) => sum + stat.messageCount, 0);
    const totalVoiceTime = stats.reduce((sum, stat) => sum + stat.voiceTime, 0);

    return {
        period: days,
        totalMessages,
        totalVoiceTime,
        dailyStats: stats
    };
};

// Static method to start a voice session
userStatsSchema.statics.startVoiceSession = async function(userId, guildId) {
    const stats = await this.getTodayStats(userId, guildId);
    stats.voiceSessionStart = new Date();
    await stats.save();
    return stats;
};

// Static method to end a voice session and add time
userStatsSchema.statics.endVoiceSession = async function(userId, guildId) {
    const stats = await this.getTodayStats(userId, guildId);

    if (stats.voiceSessionStart) {
        const sessionDuration = Math.floor((Date.now() - stats.voiceSessionStart.getTime()) / 1000);
        stats.voiceTime += sessionDuration;
        stats.voiceSessionStart = null;
        await stats.save();
    }

    return stats;
};

// Static method to update voice session across day boundary
userStatsSchema.statics.updateVoiceSession = async function(userId, guildId, oldDate) {
    // End session for old date
    const oldDateStr = oldDate.toISOString().split('T')[0];
    const oldStats = await this.findOne({ userId, guildId, date: oldDateStr });

    if (oldStats && oldStats.voiceSessionStart) {
        const sessionDuration = Math.floor((oldDate.getTime() - oldStats.voiceSessionStart.getTime()) / 1000);
        oldStats.voiceTime += sessionDuration;
        oldStats.voiceSessionStart = null;
        await oldStats.save();
    }

    // Start new session for today
    return await this.startVoiceSession(userId, guildId);
};

export const UserStats = mongoose.model('UserStats', userStatsSchema);
