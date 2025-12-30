import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, '../../config/logChannel.json');

// Ensure config directory exists
const configDir = dirname(configPath);
if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
}

// Initialize config file if it doesn't exist
if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify({ channels: {} }, null, 2));
}

export function getLogChannel(guildId) {
    try {
        const data = JSON.parse(readFileSync(configPath, 'utf8'));
        return data.channels[guildId] || null;
    } catch (error) {
        return null;
    }
}

export function setLogChannel(guildId, channelId) {
    try {
        const data = existsSync(configPath)
            ? JSON.parse(readFileSync(configPath, 'utf8'))
            : { channels: {} };

        data.channels[guildId] = channelId;
        writeFileSync(configPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('setlogchannel')
        .setDescription('Set the channel where bot logs will be sent')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to send logs to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        // Check if bot has permission to send messages in the channel
        const permissions = channel.permissionsFor(interaction.guild.members.me);
        if (!permissions.has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({
                embeds: [createErrorEmbed('I don\'t have permission to send messages in that channel!')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Save the log channel
        const success = setLogChannel(interaction.guild.id, channel.id);

        if (success) {
            const embed = createSuccessEmbed(
                `Log channel has been set to ${channel}\n\nAll bot logs will now be sent to this channel.`
            );
            await interaction.reply({ embeds: [embed] });

            // Send test message to the log channel
            await channel.send({
                embeds: [createSuccessEmbed('✅ Log channel configured successfully!')]
            });
        } else {
            return interaction.reply({
                embeds: [createErrorEmbed('Failed to save log channel configuration!')],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
