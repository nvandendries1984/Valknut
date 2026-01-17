import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { canExecuteCommand } from '../../utils/permissions.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot latency')
        .setDMPermission(false),

    async execute(interaction) {
        // Check permissions
        const permissionCheck = await canExecuteCommand(interaction);
        if (!permissionCheck.allowed) {
            return interaction.reply({
                embeds: [createErrorEmbed(permissionCheck.reason)],
                ephemeral: true
            });
        }
        await interaction.reply({
            content: 'Pinging...'
        });

        const sent = await interaction.fetchReply();

        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = createEmbed({
            title: '🏓 Pong!',
            fields: [
                {
                    name: 'Latency',
                    value: `${latency}ms`,
                    inline: true
                },
                {
                    name: 'API Latency',
                    value: `${apiLatency}ms`,
                    inline: true
                }
            ],
            color: latency < 100 ? 0x00FF00 : latency < 200 ? 0xFFA500 : 0xFF0000
        });

        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
