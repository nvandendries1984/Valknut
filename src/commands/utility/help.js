import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { config } from '../../config/config.js';
import { canExecuteCommand } from '../../utils/permissions.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands')
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
        const commands = interaction.client.commands;

        // Group commands by category
        const categories = {};
        commands.forEach(command => {
            // Get category from command path (e.g. 'utility' or 'moderation')
            const category = command.category || 'General';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(command);
        });

        // Create fields for each category
        const fields = Object.entries(categories).map(([category, cmds]) => ({
            name: `📂 ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            value: cmds.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n'),
            inline: false
        }));

        const embed = createEmbed({
            title: `📚 ${config.botName} - Help`,
            description: 'Here is a list of all available commands:',
            fields: fields,
            color: 0x5865F2
        });

        await interaction.reply({ embeds: [embed] });
    }
};
