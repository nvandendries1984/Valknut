import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Role } from '../../models/Role.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { config } from '../../config/config.js';
import { logger } from '../../utils/logger.js';
import { canExecuteCommand } from '../../utils/permissions.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register a user in the database')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to register')
                .setRequired(true)
        )
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

        const targetUser = interaction.options.getUser('user');
        const guildId = interaction.guild?.id;

        if (!guildId) {
            return interaction.reply({
                embeds: [createErrorEmbed('This command can only be used in a server!')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Check if user is already registered in this guild
            const existingUser = await User.findByUserId(targetUser.id, guildId);

            if (existingUser) {
                return interaction.editReply({
                    embeds: [createErrorEmbed(
                        `**${targetUser.tag}** is already registered in this server.\n\n` +
                        `**Registered at:** ${existingUser.registeredAt.toLocaleString('nl-NL')}\n` +
                        `**Registered by:** <@${existingUser.registeredBy}>`
                    )]
                });
            }

            // Fetch full user data
            const fullUser = await interaction.client.users.fetch(targetUser.id, { force: true });

            // Get member to fetch roles
            const member = await interaction.guild.members.fetch(targetUser.id);

            // Get member's Discord role IDs (excluding @everyone)
            const memberDiscordRoleIds = Array.from(member.roles.cache.keys())
                .filter(roleId => roleId !== guildId);

            // Find corresponding roles in database
            const dbRoles = await Role.find({
                guildId,
                discordRoleId: { $in: memberDiscordRoleIds }
            });

            // Create new user document
            const newUser = new User({
                userId: fullUser.id,
                guildId: guildId,
                username: fullUser.username,
                globalName: fullUser.globalName,
                discriminator: fullUser.discriminator,
                avatar: fullUser.avatar,
                avatarURL: fullUser.displayAvatarURL({ size: 512, extension: 'png' }),
                bot: fullUser.bot,
                createdAt: fullUser.createdAt,
                flags: fullUser.flags?.bitfield || 0,
                premiumType: fullUser.premiumType || 0,
                banner: fullUser.banner,
                accentColor: fullUser.accentColor,
                registeredBy: interaction.user.id,
                guildName: interaction.guild?.name || null,
                roles: dbRoles.map(role => role._id) // Add Discord roles
            });

            await newUser.save();

            // Check if user is registered in other guilds
            const otherRegistrations = await User.findAllByUserId(fullUser.id);
            const registrationCount = otherRegistrations.length;

            // Success embed with all user details
            const embed = createSuccessEmbed(
                `✅ Successfully registered **${fullUser.tag}** in this server`
            )
                .addFields(
                    { name: '👤 Display Name', value: newUser.getDisplayName(), inline: true },
                    { name: '🆔 User ID', value: fullUser.id, inline: true },
                    { name: '🤖 Bot Account', value: fullUser.bot ? 'Yes' : 'No', inline: true },
                    { name: '📅 Account Created', value: `<t:${Math.floor(fullUser.createdTimestamp / 1000)}:F>`, inline: false },
                    { name: '📝 Registered By', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '🏠 Guild', value: interaction.guild?.name || 'Unknown', inline: true },
                    { name: '🌐 Total Registrations', value: `${registrationCount} server(s)`, inline: true }
                )
                .setThumbnail(fullUser.displayAvatarURL({ size: 256 }));

            if (fullUser.banner) {
                embed.setImage(fullUser.bannerURL({ size: 512 }));
            }

            logger.info(
                `User ${fullUser.tag} (${fullUser.id}) registered in ${interaction.guild.name} by ${interaction.user.tag}`,
                interaction.guild?.id
            );

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.error(`Error registering user: ${error.message}`, interaction.guild?.id);

            return interaction.editReply({
                embeds: [createErrorEmbed(
                    '❌ An error occurred while registering the user.\n' +
                    'Please check the logs for more details.'
                )]
            });
        }
    }
};
