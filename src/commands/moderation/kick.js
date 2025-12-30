import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';

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
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the kick'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Validation checks
        if (!target) {
            return interaction.reply({
                embeds: [createErrorEmbed('Member not found!')],
                ephemeral: true
            });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({
                embeds: [createErrorEmbed('You cannot kick yourself!')],
                ephemeral: true
            });
        }

        if (target.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                embeds: [createErrorEmbed('You cannot kick this member due to role hierarchy!')],
                ephemeral: true
            });
        }

        if (!target.kickable) {
            return interaction.reply({
                embeds: [createErrorEmbed('I cannot kick this member!')],
                ephemeral: true
            });
        }

        // Kick the member
        try {
            await target.kick(reason);

            const embed = createSuccessEmbed(
                `**${target.user.tag}** has been kicked by **${interaction.user.tag}**\n**Reason:** ${reason}`
            );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({
                embeds: [createErrorEmbed(`Error while kicking: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
