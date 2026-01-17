import { MessageFlags } from 'discord.js';
import { logger } from '../utils/logger.js';
import { createErrorEmbed } from '../utils/embedBuilder.js';

export default {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                logger.error(`Command not found: ${interaction.commandName}`);
                return;
            }

            try {
                logger.info(`${interaction.user.tag} executed /${interaction.commandName} in ${interaction.guild?.name || 'DM'}`);
                await command.execute(interaction);
            } catch (error) {
                logger.error(`Error executing ${interaction.commandName}: ${error.message}`);

                const errorEmbed = createErrorEmbed(
                    'An error occurred while executing this command!'
                );

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                }
            }
        }

        // Handle button interactions
        if (interaction.isButton()) {
            logger.debug(`Button interaction: ${interaction.customId}`);
            // Add button handling logic here
        }

        // Handle select menu interactions - these are handled by the commands themselves
        if (interaction.isStringSelectMenu()) {
            logger.debug(`Select menu interaction: ${interaction.customId} by ${interaction.user.tag}`);
        }

        // Handle modal submissions - these are handled by the commands themselves
        if (interaction.isModalSubmit()) {
            logger.debug(`Modal submit interaction: ${interaction.customId} by ${interaction.user.tag}`);
        }
    }
};
