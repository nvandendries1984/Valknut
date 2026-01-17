import mongoose from 'mongoose';

const allowedUserSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        required: true
    },
    discriminator: {
        type: String,
        default: '0'
    },
    addedBy: {
        type: String,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    reason: {
        type: String,
        default: ''
    },
    // 2FA fields
    twoFactorSecret: {
        type: String,
        default: null
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    backupCodes: {
        type: [String],
        default: []
    },
    // Remember device fields
    rememberToken: {
        type: String,
        default: null
    },
    rememberTokenExpiry: {
        type: Date,
        default: null
    }
});

// Static method to check if user is allowed
allowedUserSchema.statics.isAllowed = async function(userId) {
    const user = await this.findOne({ userId });
    return !!user;
};

// Static method to add user
allowedUserSchema.statics.addUser = async function(userId, username, discriminator, addedBy, reason = '') {
    const existing = await this.findOne({ userId });
    if (existing) {
        return { success: false, message: 'User already allowed' };
    }

    const allowedUser = new this({
        userId,
        username,
        discriminator,
        addedBy,
        reason
    });

    await allowedUser.save();
    return { success: true, user: allowedUser };
};

// Static method to remove user
allowedUserSchema.statics.removeUser = async function(userId) {
    const result = await this.deleteOne({ userId });
    return result.deletedCount > 0;
};

export const AllowedUser = mongoose.model('AllowedUser', allowedUserSchema);
