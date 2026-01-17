import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { canExecuteCommand } from '../../utils/permissions.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embedBuilder.js';
import { logger } from '../../utils/logger.js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export default {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('userlist')
        .setDescription('Generate an Excel file with all registered users and their data (moderator only)')
        .addStringOption(option =>
            option
                .setName('filter')
                .setDescription('Filter users by criteria')
                .addChoices(
                    { name: 'All users', value: 'all' },
                    { name: 'Bots only', value: 'bots' },
                    { name: 'Non-bots only', value: 'nonbots' },
                    { name: 'With onboarding data', value: 'onboarded' }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        // Check permissions (mod role or server owner)
        const permissionCheck = await canExecuteCommand(interaction);
        if (!permissionCheck.allowed) {
            return interaction.reply({
                embeds: [createErrorEmbed(permissionCheck.reason)],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Build query based on filter
            const filter = interaction.options.getString('filter') || 'all';
            let query = { guildId: interaction.guild.id };

            switch (filter) {
                case 'bots':
                    query.bot = true;
                    break;
                case 'nonbots':
                    query.bot = false;
                    break;
                case 'onboarded':
                    query['onboarding.name'] = { $ne: null };
                    break;
            }

            // Fetch all users for this guild with populated roles
            const users = await User.find(query).populate('roles').sort({ registeredAt: -1 });

            if (users.length === 0) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('No registered users found in this server!')]
                });
            }

            // Format date helper
            const formatDate = (date) => {
                if (!date) return '';
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            };

            // Prepare data for Excel
            const excelData = users.map((user, index) => {
                // Get Discord role names from user.roles array
                const roleNames = user.roles && user.roles.length > 0
                    ? user.roles.map(role => role.name).join(', ')
                    : '';

                return {
                    '#': index + 1,
                    'User ID': user.userId,
                    'Display Name': user.globalName || user.username,
                    'Registered Date': formatDate(user.registeredAt),

                    // Discord Server Roles
                    'Rank': roleNames,

                    // Onboarding data
                    'Real Name': user.onboarding?.name || '',
                    'Date of Birth': user.onboarding?.dateOfBirth || '',
                    'Email': user.onboarding?.email || '',
                    'Phone Number': user.onboarding?.phoneNumber || '',
                    'Address': user.onboarding?.address || '',
                    'Postcode': user.onboarding?.postcode || '',
                    'City (Woonplaats)': user.onboarding?.woonplaats || '',
                    'Saga': user.onboarding?.saga || '',
                    'Saga Level': user.onboarding?.sagaLevel || '',
                    'Year': user.onboarding?.year || '',
                    'Date Recruit': formatDate(user.onboarding?.datumRecruit),
                    'Date Warrior': formatDate(user.onboarding?.datumWarrior),
                    'Points': user.onboarding?.punten || 0,
                    'Penalty Points': user.onboarding?.strafpunten || 0,
                    'Strikes': user.onboarding?.strikes || 0,
                    'Notes': user.onboarding?.notes || ''
                };
            });

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Set column widths for better readability
            worksheet['!cols'] = [
                { wch: 5 },   // #
                { wch: 18 },  // User ID
                { wch: 20 },  // Display Name
                { wch: 15 },  // Registered Date
                { wch: 20 },  // Real Name
                { wch: 15 },  // Date of Birth
                { wch: 25 },  // Email
                { wch: 15 },  // Phone Number
                { wch: 30 },  // Address
                { wch: 10 },  // Postcode
                { wch: 20 },  // City
                { wch: 15 },  // Rank
                { wch: 20 },  // Saga
                { wch: 12 },  // Saga Level
                { wch: 8 },   // Year
                { wch: 15 },  // Date Recruit
                { wch: 15 },  // Date Warrior
                { wch: 10 },  // Points
                { wch: 15 },  // Penalty Points
                { wch: 10 },  // Strikes
                { wch: 40 }   // Notes
            ];

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'User List');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filterText = filter === 'all' ? 'all' :
                              filter === 'bots' ? 'bots' :
                              filter === 'nonbots' ? 'nonbots' :
                              'onboarded';
            const filename = `userlist_${interaction.guild.name.replace(/[^a-zA-Z0-9]/g, '_')}_${filterText}_${timestamp}.xlsx`;
            const filepath = path.join(process.cwd(), 'temp', filename);

            // Create temp directory if it doesn't exist
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Write the Excel file
            XLSX.writeFile(workbook, filepath);

            // Create attachment
            const attachment = new AttachmentBuilder(filepath, { name: filename });

            // Send the file
            await interaction.editReply({
                embeds: [createSuccessEmbed(
                    `📊 User list exported successfully!\n\n` +
                    `**Total users:** ${users.length}\n` +
                    `**Filter:** ${filterText === 'all' ? 'All users' : filterText === 'bots' ? 'Bots only' : filterText === 'nonbots' ? 'Non-bots only' : 'Users with onboarding data'}\n` +
                    `**File:** ${filename}`
                )],
                files: [attachment]
            });

            // Clean up the temporary file after sending
            setTimeout(() => {
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                    logger.debug(`Cleaned up temporary file: ${filename}`);
                }
            }, 5000);

            logger.info(`User list Excel file generated by ${interaction.user.tag} in guild ${interaction.guild.name} (${users.length} users)`);

        } catch (error) {
            logger.error(`Error in userlist command: ${error.message}`);

            const errorEmbed = createErrorEmbed(
                'An error occurred while fetching the user list. Please try again later.'
            );

            if (interaction.deferred) {
                return interaction.editReply({ embeds: [errorEmbed] });
            } else {
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
