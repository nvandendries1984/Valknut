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
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }

        // Handle button interactions
        if (interaction.isButton()) {
            logger.debug(`Button interaction: ${interaction.customId}`);
            // Add button handling logic here
        }

        // Handle select menu interactions
        if (interaction.isStringSelectMenu()) {
            logger.debug(`Select menu interaction: ${interaction.customId}`);
            // Add select menu handling logic here
        }
    }
};
