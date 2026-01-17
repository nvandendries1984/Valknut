import { mongoose } from '../utils/database.js';

const userSchema = new mongoose.Schema({
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
    guildName: {
        type: String,
        default: null
    },

    // User roles (references to Role IDs)
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],

    // Onboarding information
    onboarding: {
        name: {
            type: String,
            default: null
        },
        dateOfBirth: {
            type: String,
            default: null
        },
        address: {
            type: String,
            default: null
        },
        phoneNumber: {
            type: String,
            default: null
        },
        email: {
            type: String,
            default: null
        },
        rank: {
            type: String,
            default: null
        },
        dateRegistered: {
            type: Date,
            default: null
        },
        year: {
            type: Number,
            default: null
        },
        saga: {
            type: String,
            enum: ['Beardserker', 'Sideburn Soldier', 'Moustache Militia', 'Goatee Gladiator', 'Whaler', 'Shieldmaiden', null],
            default: null
        },
        postcode: {
            type: String,
            default: null
        },
        woonplaats: {
            type: String,
            default: null
        },
        sagaLevel: {
            type: Number,
            default: null
        },
        datumRecruit: {
            type: Date,
            default: null
        },
        datumWarrior: {
            type: Date,
            default: null
        },
        punten: {
            type: Number,
            default: 0
        },
        strafpunten: {
            type: Number,
            default: 0
        },
        strikes: {
            type: Number,
            default: 0
        },
        notes: {
            type: String,
            default: null
        }
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Compound unique index for userId + guildId
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

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
userSchema.statics.findByUserId = function(userId, guildId) {
    return this.findOne({ userId, guildId });
};

userSchema.statics.isRegistered = async function(userId, guildId) {
    const user = await this.findByUserId(userId, guildId);
    return !!user;
};

userSchema.statics.findAllByUserId = function(userId) {
    return this.find({ userId });
};

userSchema.methods.addRole = async function(roleId) {
    if (!this.roles.includes(roleId)) {
        this.roles.push(roleId);
        await this.save();
    }
    return this;
};

userSchema.methods.removeRole = async function(roleId) {
    this.roles = this.roles.filter(id => !id.equals(roleId));
    await this.save();
    return this;
};

userSchema.methods.hasRole = function(roleId) {
    return this.roles.some(id => id.equals(roleId));
};

export const User = mongoose.model('User', userSchema);
