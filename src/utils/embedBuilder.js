import { EmbedBuilder } from 'discord.js';
import { config } from '../config/config.js';

export function createEmbed(options = {}) {
    const embed = new EmbedBuilder()
        .setColor(options.color || 0x5865F2)
        .setTimestamp();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.footer) {
        embed.setFooter({
            text: options.footer,
            iconURL: options.footerIcon
        });
    } else {
        embed.setFooter({ text: config.botName });
    }
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.author) {
        embed.setAuthor({
            name: options.author.name,
            iconURL: options.author.iconURL,
            url: options.author.url
        });
    }
    if (options.fields) {
        embed.addFields(options.fields);
    }

    return embed;
}

export function createErrorEmbed(message) {
    return createEmbed({
        title: '❌ Error',
        description: message,
        color: 0xFF0000
    });
}

export function createSuccessEmbed(message) {
    return createEmbed({
        title: '✅ Success',
        description: message,
        color: 0x00FF00
    });
}

export function createWarningEmbed(message) {
    return createEmbed({
        title: '⚠️ Warning',
        description: message,
        color: 0xFFA500
    });
}
