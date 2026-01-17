import { SlashCommandBuilder } from 'discord.js';
import { Guild } from '../../models/Guild.js';
import { User } from '../../models/User.js';
import { createEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { canExecuteCommand } from '../../utils/permissions.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('guildinfo')
        .setDescription('Display information about this server')
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

        await interaction.deferReply();

        try {
            const guild = interaction.guild;
            const dbGuild = await Guild.findByGuildId(guild.id);

            if (!dbGuild) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('This guild is not registered in the database yet!')]
                });
            }

            // Count registered users in this guild
            const registeredUsers = await User.countDocuments({ guildId: guild.id });

            // Get log channel
            const logChannel = dbGuild.logChannelId
                ? `<#${dbGuild.logChannelId}>`
                : 'Not configured';

            const embed = createEmbed('Guild Information')
                .addFields(
                    { name: '📝 Name', value: guild.name, inline: true },
                    { name: '🆔 Guild ID', value: guild.id, inline: true },
                    { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '👥 Members', value: guild.memberCount.toString(), inline: true },
                    { name: '📊 Registered Users', value: registeredUsers.toString(), inline: true },
                    { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: '🤖 Bot Joined', value: `<t:${Math.floor(dbGuild.joinedAt.getTime() / 1000)}:F>`, inline: true },
                    { name: '📢 Log Channel', value: logChannel, inline: true },
                    { name: '💬 Prefix', value: dbGuild.settings?.prefix || 'Default (!)', inline: true },
                    { name: '🌐 Language', value: dbGuild.settings?.language || 'en', inline: true },
                    { name: '✅ Status', value: dbGuild.active ? 'Active' : 'Inactive', inline: true }
                );

            if (guild.icon) {
                embed.setThumbnail(guild.iconURL({ size: 256 }));
            }

            if (guild.banner) {
                embed.setImage(guild.bannerURL({ size: 512 }));
            }

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            return interaction.editReply({
                embeds: [createErrorEmbed('An error occurred while fetching guild information!')]
            });
        }
    }
};
