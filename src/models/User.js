import { mongoose } from '../utils/database.js';

const userSchema = new mongoose.Schema({
    // Discord User ID
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Username
    username: {
        type: String,
        required: true
    },
    
    // Global display name
    globalName: {
        type: String,
        default: null
    },
    
    // Discriminator (legacy)
    discriminator: {
        type: String,
        default: null
    },
    
    // Avatar hash
    avatar: {
        type: String,
        default: null
    },
    
    // Avatar URL (full URL)
    avatarURL: {
        type: String,
        default: null
    },
    
    // Bot account
    bot: {
        type: Boolean,
        default: false
    },
    
    // Account creation date from Discord
    createdAt: {
        type: Date,
        required: true
    },
    
    // User flags (badges, etc.)
    flags: {
        type: Number,
        default: 0
    },
    
    // Premium type (Nitro)
    premiumType: {
        type: Number,
        default: 0
    },
    
    // Banner hash
    banner: {
        type: String,
        default: null
    },
    
    // Banner color
    accentColor: {
        type: Number,
        default: null
    },
    
    // Registered by (owner user ID)
    registeredBy: {
        type: String,
        required: true
    },
    
    // Registration timestamp
    registeredAt: {
        type: Date,
        default: Date.now
    },
    
    // Guild context (where they were registered)
    guildId: {
        type: String,
        default: null
    },
    
    guildName: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Instance methods
userSchema.methods.getDisplayName = function() {
    return this.globalName || this.username;
};

userSchema.methods.getTag = function() {
    return this.discriminator !== '0' && this.discriminator
        ? `${this.username}#${this.discriminator}`
        : this.username;
};

// Static methods
userSchema.statics.findByUserId = function(userId) {
    return this.findOne({ userId });
};

userSchema.statics.isRegistered = async function(userId) {
    const user = await this.findByUserId(userId);
    return !!user;
};

export const User = mongoose.model('User', userSchema);
