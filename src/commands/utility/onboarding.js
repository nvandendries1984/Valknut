import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Guild } from '../../models/Guild.js';
import { createSuccessEmbed, createErrorEmbed, createEmbed } from '../../utils/embedBuilder.js';
import { logger } from '../../utils/logger.js';
import { canExecuteCommand } from '../../utils/permissions.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('onboarding')
        .setDescription('Start onboarding process for a user')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to onboard')
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
        const guildId = interaction.guild.id;

        logger.info(`Starting onboarding for ${targetUser.tag} in guild ${interaction.guild.name}`);

        // Create select menu for Saga selection
        const sagaSelect = new StringSelectMenuBuilder()
            .setCustomId(`saga-select-${targetUser.id}`)
            .setPlaceholder('Select a Saga')
            .addOptions([
                { label: 'Beardserker', value: 'Beardserker', emoji: '🧔' },
                { label: 'Sideburn Soldier', value: 'Sideburn Soldier', emoji: '👨' },
                { label: 'Moustache Militia', value: 'Moustache Militia', emoji: '🥸' },
                { label: 'Goatee Gladiator', value: 'Goatee Gladiator', emoji: '🗡️' },
                { label: 'Whaler', value: 'Whaler', emoji: '🐋' },
                { label: 'Shieldmaiden', value: 'Shieldmaiden', emoji: '🛡️' }
            ]);

        const row = new ActionRowBuilder().addComponents(sagaSelect);

        const embed = createEmbed(
            `**Onboarding: ${targetUser.username}**\n\n` +
            `First, select the Saga for this user, then fill in their details.`
        );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });

        // Wait for saga selection
        try {
            const sagaResponse = await interaction.channel.awaitMessageComponent({
                filter: i => i.customId === `saga-select-${targetUser.id}` && i.user.id === interaction.user.id,
                time: 60000
            });

            const selectedSaga = sagaResponse.values[0];

            // Create modal for remaining fields
            const modal = new ModalBuilder()
                .setCustomId(`onboarding-${targetUser.id}`)
                .setTitle(`Onboarding: ${targetUser.username}`);

            // Name
            const nameInput = new TextInputBuilder()
                .setCustomId('name')
                .setLabel('Name')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(100);

            // Date of Birth
            const dobInput = new TextInputBuilder()
                .setCustomId('dateOfBirth')
                .setLabel('Date of Birth (DD-MM-YYYY)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setPlaceholder('01-01-2000')
                .setMaxLength(10);

            // Postcode
            const postcodeInput = new TextInputBuilder()
                .setCustomId('postcode')
                .setLabel('Postcode')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(10);

            // Woonplaats
            const woonplaatsInput = new TextInputBuilder()
                .setCustomId('woonplaats')
                .setLabel('Woonplaats')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(100);

            // Address
            const addressInput = new TextInputBuilder()
                .setCustomId('address')
                .setLabel('Address')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(200);

            // Phone Number
            const phoneInput = new TextInputBuilder()
                .setCustomId('phoneNumber')
                .setLabel('Phone Number')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(20);

            // Create action rows
            const firstRow = new ActionRowBuilder().addComponents(nameInput);
            const secondRow = new ActionRowBuilder().addComponents(dobInput);
            const thirdRow = new ActionRowBuilder().addComponents(postcodeInput);
            const fourthRow = new ActionRowBuilder().addComponents(woonplaatsInput);
            const fifthRow = new ActionRowBuilder().addComponents(addressInput);

            modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

            await sagaResponse.showModal(modal);

            // Wait for modal submission
            try {
                const submitted = await sagaResponse.awaitModalSubmit({
                    filter: i => i.customId === `onboarding-${targetUser.id}` && i.user.id === interaction.user.id,
                    time: 300000 // 5 minutes
                });

                // Get values from modal
                const name = submitted.fields.getTextInputValue('name');
                const dateOfBirth = submitted.fields.getTextInputValue('dateOfBirth') || null;
                const postcode = submitted.fields.getTextInputValue('postcode') || null;
                const woonplaats = submitted.fields.getTextInputValue('woonplaats') || null;
                const address = submitted.fields.getTextInputValue('address') || null;
                const phoneNumber = submitted.fields.getTextInputValue('phoneNumber') || null;

                // Save to database
                try {
                    const user = await User.findOneAndUpdate(
                        { userId: targetUser.id, guildId },
                        {
                            userId: targetUser.id,
                            guildId,
                            username: targetUser.username,
                            discriminator: targetUser.discriminator,
                            registeredBy: interaction.user.id,
                            onboarding: {
                                name,
                                dateOfBirth,
                                postcode,
                                woonplaats,
                                address,
                                phoneNumber,
                                rank: null,
                                dateRegistered: new Date(),
                                year: new Date().getFullYear(),
                                saga: selectedSaga,
                                notes: null
                            },
                            registeredAt: new Date()
                        },
                        { upsert: true, new: true }
                    );

                    logger.info(`Onboarding data saved for ${targetUser.tag} in guild ${guildId}`);

                    await submitted.reply({
                        embeds: [createSuccessEmbed(
                            `✅ Onboarding completed for ${targetUser.username}!\n\n` +
                            `**Saga:** ${selectedSaga}\n` +
                            `**Name:** ${name}\n` +
                            `${dateOfBirth ? `**Date of Birth:** ${dateOfBirth}\n` : ''}` +
                            `${postcode ? `**Postcode:** ${postcode}\n` : ''}` +
                            `${woonplaats ? `**Woonplaats:** ${woonplaats}\n` : ''}` +
                            `${address ? `**Address:** ${address}\n` : ''}` +
                            `${phoneNumber ? `**Phone:** ${phoneNumber}\n` : ''}` +
                            `**Year:** ${new Date().getFullYear()}`
                        )],
                        ephemeral: true
                    });

                } catch (error) {
                    logger.error(`Failed to save onboarding data: ${error.message}`);
                    await submitted.reply({
                        embeds: [createErrorEmbed('Failed to save onboarding data. Please try again.')],
                        ephemeral: true
                    });
                }

            } catch (error) {
                if (error.message.includes('time')) {
                    logger.info(`Onboarding modal timed out for ${targetUser.tag}`);
                    await interaction.editReply({
                        content: 'Onboarding timed out. Please try again.',
                        components: [],
                        embeds: []
                    });
                } else {
                    logger.error(`Onboarding modal error: ${error.message}`);
                }
            }

        } catch (error) {
            if (error.message.includes('time')) {
                logger.info(`Saga selection timed out for ${targetUser.tag}`);
                await interaction.editReply({
                    content: 'Selection timed out. Please try again.',
                    components: [],
                    embeds: []
                });
            } else {
                logger.error(`Saga selection error: ${error.message}`);
            }
        }
    }
};
