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

        // Validatie checks
        if (!target) {
            return interaction.reply({
                embeds: [createErrorEmbed('Member niet gevonden!')],
                ephemeral: true
            });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({
                embeds: [createErrorEmbed('Je kunt jezelf niet kicken!')],
                ephemeral: true
            });
        }

        if (target.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                embeds: [createErrorEmbed('Je kunt deze member niet kicken vanwege role hierarchy!')],
                ephemeral: true
            });
        }

        if (!target.kickable) {
            return interaction.reply({
                embeds: [createErrorEmbed('Ik kan deze member niet kicken!')],
                ephemeral: true
            });
        }

        // Kick de member
        try {
            await target.kick(reason);

            const embed = createSuccessEmbed(
                `**${target.user.tag}** is gekicked door **${interaction.user.tag}**\n**Reden:** ${reason}`
            );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({
                embeds: [createErrorEmbed(`Fout bij kicken: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
