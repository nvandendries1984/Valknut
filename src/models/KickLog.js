import { mongoose } from '../utils/database.js';

const kickLogSchema = new mongoose.Schema({
    // Guild ID
    guildId: {
        type: String,
        required: true,
        index: true
    },

    // User who was kicked
    kickedUserId: {
        type: String,
        required: true,
        index: true
    },

    kickedUserTag: {
        type: String,
        required: true
    },

    // User who performed the kick
    kickedByUserId: {
        type: String,
        required: true
    },

    kickedByUserTag: {
        type: String,
        required: true
    },

    // Kick details
    messageToUser: {
        type: String,
        required: true
    },

    standing: {
        type: String,
        enum: ['Good Standing', 'Bad Standing'],
        required: true
    },

    // Timestamps
    kickedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
kickLogSchema.index({ guildId: 1, kickedUserId: 1, kickedAt: -1 });

// Static method to create a kick log
kickLogSchema.statics.createKickLog = async function(guildId, kickedUser, kickedByUser, messageToUser, standing) {
    return await this.create({
        guildId,
        kickedUserId: kickedUser.id,
        kickedUserTag: kickedUser.tag,
        kickedByUserId: kickedByUser.id,
        kickedByUserTag: kickedByUser.tag,
        messageToUser,
        standing
    });
};

// Static method to get kick logs for a user
kickLogSchema.statics.getUserKickLogs = async function(guildId, userId) {
    return await this.find({ guildId, kickedUserId: userId })
        .sort({ kickedAt: -1 });
};

// Static method to get recent kicks in a guild
kickLogSchema.statics.getRecentKicks = async function(guildId, limit = 10) {
    return await this.find({ guildId })
        .sort({ kickedAt: -1 })
        .limit(limit);
};

const KickLog = mongoose.model('KickLog', kickLogSchema);

export default KickLog;
