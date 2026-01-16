import { mongoose } from '../utils/database.js';

const roleSchema = new mongoose.Schema({
    // Guild ID
    guildId: {
        type: String,
        required: true,
        index: true
    },

    // Role name
    name: {
        type: String,
        required: true
    },

    // Discord Role ID (optional - can be linked to actual Discord role)
    discordRoleId: {
        type: String,
        default: null
    },

    // Role color (hex)
    color: {
        type: String,
        default: '#6B7280'
    },

    // Role description
    description: {
        type: String,
        default: ''
    },

    // Position/order for display
    position: {
        type: Number,
        default: 0
    },

    // Active status
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'roles'
});

// Compound index for guild + name uniqueness
roleSchema.index({ guildId: 1, name: 1 }, { unique: true });

// Static methods
roleSchema.statics.findByGuildId = function(guildId) {
    return this.find({ guildId, active: true }).sort({ position: 1, name: 1 });
};

roleSchema.statics.findByDiscordRoleId = function(guildId, discordRoleId) {
    return this.findOne({ guildId, discordRoleId });
};

export const Role = mongoose.model('Role', roleSchema);
