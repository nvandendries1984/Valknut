import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createDatabaseBackup } from '../../utils/backup.js';
import { createEmbed, createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Create a manual database backup (Owner only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check if user is bot owner
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                embeds: [createErrorEmbed('This command is only available to the bot owner.')],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const backupPath = await createDatabaseBackup();
            const fileName = backupPath.split('/').pop();

            const embed = createSuccessEmbed(
                '💾 Database Backup Created',
                `**File:** \`${fileName}\`\n**Location:** \`${backupPath}\`\n**Format:** Compressed (tar.gz)\n\n📅 **Auto Backup:** Daily at 00:00 (Europe/Amsterdam)\n🗄️ **Retention:** Last 7 backups`
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply({
                embeds: [createErrorEmbed(`Failed to create backup: ${error.message}`)]
            });
        }
    }
};
