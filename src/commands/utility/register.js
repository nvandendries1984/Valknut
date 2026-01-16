import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { createEmbed, createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { config } from '../../config/config.js';
import { logger } from '../../utils/logger.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register a user in the database (Owner only)')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to register')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        // Owner check
        if (interaction.user.id !== config.ownerId) {
            return interaction.reply({
                embeds: [createErrorEmbed('🚫 This command is only available to the bot owner.')],
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        
        await interaction.deferReply();

        try {
            // Check if user is already registered
            const existingUser = await User.findByUserId(targetUser.id);
            
            if (existingUser) {
                return interaction.editReply({
                    embeds: [createErrorEmbed(
                        `**${targetUser.tag}** is already registered in the database.\n\n` +
                        `**Registered at:** ${existingUser.registeredAt.toLocaleString('nl-NL')}\n` +
                        `**Registered by:** <@${existingUser.registeredBy}>`
                    )]
                });
            }

            // Fetch full user data
            const fullUser = await interaction.client.users.fetch(targetUser.id, { force: true });

            // Create new user document
            const newUser = new User({
                userId: fullUser.id,
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
                guildId: interaction.guild?.id || null,
                guildName: interaction.guild?.name || null
            });

            await newUser.save();

            // Success embed with all user details
            const embed = createSuccessEmbed(
                `✅ Successfully registered **${fullUser.tag}**`
            )
                .addFields(
                    { name: '👤 Display Name', value: newUser.getDisplayName(), inline: true },
                    { name: '🆔 User ID', value: fullUser.id, inline: true },
                    { name: '🤖 Bot Account', value: fullUser.bot ? 'Yes' : 'No', inline: true },
                    { name: '📅 Account Created', value: `<t:${Math.floor(fullUser.createdTimestamp / 1000)}:F>`, inline: false },
                    { name: '📝 Registered By', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '🏠 Guild', value: interaction.guild?.name || 'DM', inline: true }
                )
                .setThumbnail(fullUser.displayAvatarURL({ size: 256 }));

            if (fullUser.banner) {
                embed.setImage(fullUser.bannerURL({ size: 512 }));
            }

            logger.info(
                `User ${fullUser.tag} (${fullUser.id}) registered by ${interaction.user.tag}`,
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
