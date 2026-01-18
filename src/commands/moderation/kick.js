import { SlashCommandBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { canExecuteCommand } from '../../utils/permissions.js';
import KickLog from '../../models/KickLog.js';
import { logger } from '../../utils/logger.js';

export default {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
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

        const target = interaction.options.getMember('target');

        // Validation checks
        if (!target) {
            return interaction.reply({
                embeds: [createErrorEmbed('Member not found!')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({
                embeds: [createErrorEmbed('You cannot kick yourself!')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (target.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                embeds: [createErrorEmbed('You cannot kick this member due to role hierarchy!')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (!target.kickable) {
            return interaction.reply({
                embeds: [createErrorEmbed('I cannot kick this member!')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Create and show modal
        const modal = new ModalBuilder()
            .setCustomId(`kickModal_${target.id}`)
            .setTitle(`Kick ${target.user.tag}`);

        const messageInput = new TextInputBuilder()
            .setCustomId('messageToUser')
            .setLabel('Message to User')
            .setPlaceholder('Enter the message to send to the user...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        const standingInput = new TextInputBuilder()
            .setCustomId('standing')
            .setLabel('Standing (Good Standing / Bad Standing)')
            .setPlaceholder('Type: Good Standing or Bad Standing')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(13);

        const messageRow = new ActionRowBuilder().addComponents(messageInput);
        const standingRow = new ActionRowBuilder().addComponents(standingInput);

        modal.addComponents(messageRow, standingRow);

        await interaction.showModal(modal);
    },

    async handleModalSubmit(interaction) {
        try {
            // Extract target user ID from customId
            const targetId = interaction.customId.split('_')[1];
            const target = await interaction.guild.members.fetch(targetId);

            if (!target) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Member not found!')],
                    flags: MessageFlags.Ephemeral
                });
            }

            // Get modal values
            const messageToUser = interaction.fields.getTextInputValue('messageToUser');
            const standingInput = interaction.fields.getTextInputValue('standing');

            // Validate standing input
            const standing = standingInput.trim();
            if (standing !== 'Good Standing' && standing !== 'Bad Standing') {
                return interaction.reply({
                    embeds: [createErrorEmbed('Standing must be either "Good Standing" or "Bad Standing"!')],
                    flags: MessageFlags.Ephemeral
                });
            }

            // Defer reply as kick operation might take time
            await interaction.deferReply();

            // Try to DM the user before kicking
            try {
                const dmEmbed = createErrorEmbed(
                    `You have been kicked from **${interaction.guild.name}**\n\n` +
                    `**Message:** ${messageToUser}\n` +
                    `**Standing:** ${standing}`
                );
                dmEmbed.setTitle('🔨 You Have Been Kicked');

                await target.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                logger.warn(`Could not DM user ${target.user.tag} before kicking: ${dmError.message}`);
            }

            // Kick the member
            await target.kick(`Kicked by ${interaction.user.tag}: ${messageToUser}`);

            // Save to database
            await KickLog.createKickLog(
                interaction.guild.id,
                target.user,
                interaction.user,
                messageToUser,
                standing
            );

            // Send confirmation
            const embed = createSuccessEmbed(
                `**${target.user.tag}** has been kicked by **${interaction.user.tag}**\n\n` +
                `**Message:** ${messageToUser}\n` +
                `**Standing:** ${standing}`
            );
            embed.setTitle('✅ Member Kicked');

            await interaction.editReply({ embeds: [embed] });

            logger.info(`${interaction.user.tag} kicked ${target.user.tag} from ${interaction.guild.name} with standing: ${standing}`);

        } catch (error) {
            logger.error(`Error handling kick modal: ${error.message}`);

            const errorEmbed = createErrorEmbed(`Error while kicking: ${error.message}`);

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            }
        }
    }
};
