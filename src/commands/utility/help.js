import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { config } from '../../config/config.js';
import { canExecuteCommand } from '../../utils/permissions.js';

// Command details with permissions
const commandDetails = {
    // Utility Commands
    'ping': { emoji: '🏓', permissions: 'Alle geregistreerde gebruikers', description: 'Check de bot latency en API responstijd' },
    'help': { emoji: '📚', permissions: 'Alle geregistreerde gebruikers', description: 'Toon alle beschikbare commands met uitleg' },
    'guildinfo': { emoji: 'ℹ️', permissions: 'Alle geregistreerde gebruikers', description: 'Toon informatie over deze server, zoals leden, rollen en instellingen' },
    'register': { emoji: '📝', permissions: 'Moderators + Server Owner', description: 'Registreer een gebruiker in de database voor toegang tot bot functies' },
    'onboarding': { emoji: '👤', permissions: 'Moderators + Server Owner', description: 'Start onboarding proces voor een gebruiker (Saga, naam, geboortedatum, etc.)' },
    'setlogchannel': { emoji: '📢', permissions: 'Moderators + Server Owner', description: 'Stel het kanaal in waar bot logs naartoe gestuurd worden' },
    'setmod': { emoji: '🛡️', permissions: 'Alleen Server Owner', description: 'Stel de moderator rol in voor deze server' },
    'listguilds': { emoji: '🌐', permissions: 'Moderators + Server Owner', description: 'Toon lijst van alle servers waar de bot actief is' },
    'backup': { emoji: '💾', permissions: 'Moderators + Server Owner', description: 'Maak een handmatige database backup (automatisch elke dag om 00:00)' },

    // Moderation Commands
    'kick': { emoji: '👢', permissions: 'Moderators + Server Owner', description: 'Kick een lid van de server met optionele reden' }
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
                    embeds: [createErrorEmbed(`Command \`/${specificCommand}\` niet gevonden!`)],
                    ephemeral: true
                });
            }

            const details = commandDetails[specificCommand] || {
                emoji: '❔',
                permissions: 'Onbekend',
                description: cmd.data.description
            };

            const embed = createEmbed({
                title: `${details.emoji} /${specificCommand}`,
                description: details.description,
                fields: [
                    { name: '📋 Categorie', value: cmd.category || 'General', inline: true },
                    { name: '🔐 Rechten', value: details.permissions, inline: true },
                    { name: '📝 Gebruik', value: `\`/${cmd.data.name}\``, inline: false }
                ],
                color: 0x5865F2
            });

            // Add options if any
            if (cmd.data.options && cmd.data.options.length > 0) {
                const optionsText = cmd.data.options.map(opt =>
                    `\`${opt.name}\` - ${opt.description} ${opt.required ? '(Verplicht)' : '(Optioneel)'}`
                ).join('\n');
                embed.addFields({ name: '⚙️ Opties', value: optionsText, inline: false });
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
            name: '🔐 Rechten Systeem',
            value:
                '**Server Owner:** Volledige toegang tot alle commands\n' +
                '**Moderators:** Toegang via ingestelde moderator rol (`/setmod`)\n' +
                '**Geregistreerde Gebruikers:** Basis commands zoals `/ping`, `/help`, `/guildinfo`\n\n' +
                '💡 *Gebruik `/help <command>` voor gedetailleerde info over een specifiek command*',
            inline: false
        });

        const embed = createEmbed({
            title: `📚 ${config.botName} - Help`,
            description:
                '**Welkom bij de Valknut Discord Bot!**\n\n' +
                'Deze bot helpt bij het beheren van je server met handige utility en moderation tools.\n' +
                'Alle commands zijn beschikbaar via slash commands (`/`).\n\n' +
                '🌐 **Web Dashboard:** Beheer je server via de webinterface voor uitgebreide opties!',
            fields: fields,
            color: 0x5865F2
        });

        await interaction.reply({ embeds: [embed] });
    }
};
