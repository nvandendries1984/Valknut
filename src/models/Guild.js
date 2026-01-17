import { mongoose } from '../utils/database.js';

const guildSchema = new mongoose.Schema({
    // Discord Guild ID
    guildId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Guild Name
    guildName: {
        type: String,
        required: true
    },

    // Guild Icon
    icon: {
        type: String,
        default: null
    },

    // Owner ID
    ownerId: {
        type: String,
        required: true
    },

    // Member Count
    memberCount: {
        type: Number,
        default: 0
    },

    // Log Channel ID
    logChannelId: {
        type: String,
        default: null
    },

    // Bot joined at
    joinedAt: {
        type: Date,
        default: Date.now
    },

    // Active status
    active: {
        type: Boolean,
        default: true
    },

    // Guild settings
    settings: {
        prefix: {
            type: String,
            default: null // null means use default from config
        },
        language: {
            type: String,
            default: 'en'
        },
        modRoleId: {
            type: String,
            default: null
        }
    }
}, {
    timestamps: true,
    collection: 'guilds'
});

// Instance methods
guildSchema.methods.getIconURL = function(size = 256) {
    if (!this.icon) return null;
    return `https://cdn.discordapp.com/icons/${this.guildId}/${this.icon}.png?size=${size}`;
};

// Static methods
guildSchema.statics.findByGuildId = function(guildId) {
    return this.findOne({ guildId });
};

guildSchema.statics.getLogChannel = async function(guildId) {
    const guild = await this.findByGuildId(guildId);
    return guild?.logChannelId || null;
};

guildSchema.statics.setLogChannel = async function(guildId, channelId) {
    const guild = await this.findByGuildId(guildId);
    if (!guild) return false;

    guild.logChannelId = channelId;
    await guild.save();
    return true;
};

guildSchema.statics.registerGuild = async function(discordGuild) {
    const existing = await this.findByGuildId(discordGuild.id);

    if (existing) {
        // Update existing guild
        existing.guildName = discordGuild.name;
        existing.icon = discordGuild.icon;
        existing.ownerId = discordGuild.ownerId;
        existing.memberCount = discordGuild.memberCount;
        existing.active = true;
        await existing.save();
        return existing;
    }

    // Create new guild
    const newGuild = new this({
        guildId: discordGuild.id,
        guildName: discordGuild.name,
        icon: discordGuild.icon,
        ownerId: discordGuild.ownerId,
        memberCount: discordGuild.memberCount
    });

    await newGuild.save();
    return newGuild;
};

export const Guild = mongoose.model('Guild', guildSchema);
