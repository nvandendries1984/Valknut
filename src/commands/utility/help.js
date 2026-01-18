import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { config } from '../../config/config.js';
import { canExecuteCommand } from '../../utils/permissions.js';

// Command details with permissions
const commandDetails = {
    // Utility Commands
    'ping': { emoji: '🏓', permissions: 'All registered users', description: 'Check the bot latency and API response time' },
    'help': { emoji: '📚', permissions: 'All registered users', description: 'Show all available commands with explanations' },
    'guildinfo': { emoji: 'ℹ️', permissions: 'Moderators + Server Owner', description: 'Display information about this server, such as members, roles, and settings' },
    'register': { emoji: '📝', permissions: 'Moderators + Server Owner', description: 'Register a user in the database for access to bot functions' },
    'onboarding': { emoji: '👤', permissions: 'Moderators + Server Owner', description: 'Start onboarding process for a user (Saga, name, date of birth, etc.)' },
    'setlogchannel': { emoji: '📢', permissions: 'Moderators + Server Owner', description: 'Set the channel where bot logs will be sent' },
    'setbugchannel': { emoji: '🐛', permissions: 'Moderators + Server Owner', description: 'Set the channel where bug reports will be sent' },
    'setmod': { emoji: '🛡️', permissions: 'Server Owner only', description: 'Set the moderator role for this server' },
    'listguilds': { emoji: '🌐', permissions: 'Moderators + Server Owner', description: 'Show list of all servers where the bot is active' },
    'backup': { emoji: '💾', permissions: 'Moderators + Server Owner', description: 'Create a manual database backup (automatic backup daily at 00:00)' },
    'feedback': { emoji: '💬', permissions: 'Everyone', description: 'Submit feedback to the bot owner via interactive modal' },
    'bug': { emoji: '🐞', permissions: 'Moderators + Server Owner', description: 'Report a bug to moderators via interactive modal' },
    'setprogress': { emoji: '📈', permissions: 'Moderators + Server Owner', description: 'Set Saga & Progress information for a member via interactive modal' },

    // Moderation Commands
    'kick': { emoji: '👢', permissions: 'Moderators + Server Owner', description: 'Kick a member from the server with optional reason' },
    'stats': { emoji: '📊', permissions: 'Moderators + Server Owner', description: 'View user statistics (messages, voice time) for 1, 7, and 14 days' },
    'userlist': { emoji: '📋', permissions: 'Moderators + Server Owner', description: 'Generate Excel file with all registered users and their data' },
    'setpoints': { emoji: '⭐', permissions: 'Moderators + Server Owner', description: 'Set Points & Statistics for a user via interactive modal (Points, Penalty Points, Strikes, Notes)' }
};

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands with detailed information')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Get detailed info about a specific command')
                .setRequired(false))
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

        const specificCommand = interaction.options.getString('command');
        const commands = interaction.client.commands;

        // Show detailed info for specific command
        if (specificCommand) {
            const cmd = commands.get(specificCommand);
            if (!cmd) {
                return interaction.reply({
                    embeds: [createErrorEmbed(`Command \`/${specificCommand}\` not found!`)],
                    ephemeral: true
                });
            }

            const details = commandDetails[specificCommand] || {
                emoji: '❔',
                permissions: 'Unknown',
                description: cmd.data.description
            };

            const embed = createEmbed({
                title: `${details.emoji} /${specificCommand}`,
                description: details.description,
                fields: [
                    { name: '📋 Category', value: cmd.category || 'General', inline: true },
                    { name: '🔐 Permissions', value: details.permissions, inline: true },
                    { name: '📝 Usage', value: `\`/${cmd.data.name}\``, inline: false }
                ],
                color: 0x5865F2
            });

            // Add options if any
            if (cmd.data.options && cmd.data.options.length > 0) {
                const optionsText = cmd.data.options.map(opt =>
                    `\`${opt.name}\` - ${opt.description} ${opt.required ? '(Required)' : '(Optional)'}`
                ).join('\n');
                embed.addFields({ name: '⚙️ Options', value: optionsText, inline: false });
            }

            return interaction.reply({ embeds: [embed] });
        }

        // Group commands by category
        const categories = {};
        commands.forEach(command => {
            const category = command.category || 'General';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(command);
        });

        // Create fields for each category with emojis and permissions
        const fields = [];

        // Utility commands
        if (categories['utility']) {
            const utilityCommands = categories['utility'].map(cmd => {
                const details = commandDetails[cmd.data.name] || { emoji: '❔', permissions: 'Onbekend' };
                return `${details.emoji} \`/${cmd.data.name}\` - ${cmd.data.description}`;
            }).join('\n');
            fields.push({
                name: '🔧 Utility Commands',
                value: utilityCommands,
                inline: false
            });
        }

        // Moderation commands
        if (categories['moderation']) {
            const moderationCommands = categories['moderation'].map(cmd => {
                const details = commandDetails[cmd.data.name] || { emoji: '❔', permissions: 'Onbekend' };
                return `${details.emoji} \`/${cmd.data.name}\` - ${cmd.data.description}`;
            }).join('\n');
            fields.push({
                name: '🛡️ Moderation Commands',
                value: moderationCommands,
                inline: false
            });
        }

        // Add permissions info
        fields.push({
            name: '🔐 Permission System',
            value:
                '**Server Owner:** Full access to all commands\n' +
                '**Moderators:** Access via configured moderator role (`/setmod`)\n' +
                '**Registered Users:** Basic commands like `/ping`, `/help`, `/guildinfo`\n\n' +
                '💡 *Use `/help <command>` for detailed info about a specific command*',
            inline: false
        });

        const embed = createEmbed({
            title: `📚 ${config.botName} - Help`,
            description:
                '**Welcome to the Valknut Discord Bot!**\n\n' +
                'This bot helps manage your server with handy utility and moderation tools.\n' +
                'All commands are available via slash commands (`/`).\n\n' +
                '🌐 **Web Dashboard:** Manage your server via the web interface for extended options!',
            fields: fields,
            color: 0x5865F2
        });

        await interaction.reply({ embeds: [embed] });
    }
};
