import { SlashCommandBuilder } from 'discord.js';
import { createDatabaseBackup } from '../../utils/backup.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { canExecuteCommand } from '../../utils/permissions.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Create a manual database backup')
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
