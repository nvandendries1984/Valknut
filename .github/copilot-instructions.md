# Copilot Instructions for Valknut

## Project Overview
Valknut is a modular Discord.js v14 bot template built with ES modules. The project is fully configurable via `.env` files, where the bot name and all sensitive data are not hardcoded. The architecture is based on a handler pattern for commands and events.

---

## Architecture & Key Components

### Handlers (src/handlers/)
- `commandHandler.js` - Automatically loads all commands from subdirectories in `src/commands/`
- `eventHandler.js` - Automatically loads all Discord events from `src/events/`

### Commands (src/commands/)
Organized by category in subdirectories:
- `utility/` - General utility commands (ping, help)
- `moderation/` - Moderation commands with permission checks

**Command structure:**
```javascript
export default {
    category: 'utility', // For help command categorization
    data: new SlashCommandBuilder()
        .setName('name')
        .setDescription('description'),
    async execute(interaction) { /* logic */ }
};
```

### Events (src/events/)
Event files export a default object with `name`, `once`, and `execute`:
```javascript
export default {
    name: 'eventName',
    once: false, // true for ready event
    async execute(...args) { /* logic */ }
};
```

### Utilities (src/utils/)
- `logger.js` - Colored console logging with levels (error/warn/info/debug)
- `embedBuilder.js` - Helper functions for Discord embeds with consistent styling

### Configuration (src/config/)
- `config.js` - Centralizes all environment variables and bot settings
- Uses `dotenv` for .env file parsing
- `validateConfig()` checks required variables at startup

---

## Developer Workflows

### First Time Setup
```bash
npm install
cp .env.example .env
# Fill in .env with Discord credentials
npm run deploy  # Deploy slash commands to Discord
npm start
```

### Development
```bash
npm run dev  # Start bot with --watch flag for auto-restart on file changes
```

### Deploy Commands
```bash
npm run deploy  # Run after adding/modifying commands
```

**Critical:** Slash commands must be deployed to Discord API before they work. Always run `npm run deploy` after changing command definitions (name, description, options).

### Debugging
- Check console logs - all events and commands are logged with timestamp
- Use `LOG_LEVEL=debug` in .env for detailed logging
- Test commands in a private test server first (use GUILD_ID for faster deployment)

---

## Code Conventions & Patterns

### File Organization
- **Commands:** `src/commands/<category>/<commandname>.js`
- **Events:** `src/events/<eventName>.js` (exact Discord.js event name)
- **Utilities:** `src/utils/<utility>.js` for reusable functions
- Use ES modules (`import`/`export`), not CommonJS

### Command Patterns
```javascript
// Permissions check example (see kick.js)
.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

// Validation pattern
if (!target.kickable) {
    return interaction.reply({
        embeds: [createErrorEmbed('Cannot kick')],
        ephemeral: true
    });
}

// Always add category property for help command
category: 'moderation'
```

### Error Handling
- Use `createErrorEmbed()` for user-facing errors
- Log errors with `logger.error()` for debugging
- Check `interaction.replied` before calling `followUp()` or `reply()`
- Wrap command execute in try-catch (see interactionCreate.js)

### Embed Styling
- Use `createEmbed()`, `createSuccessEmbed()`, `createErrorEmbed()`, `createWarningEmbed()`
- Timestamp is automatically added
- Footer always shows bot name (via config)

### File Paths in Handlers
Always use `file://` protocol for dynamic imports:
```javascript
const command = await import(`file://${filePath}`);
```

---

## Dependencies & Integration Points

### Discord.js v14
- Uses slash commands (not legacy message commands)
- GatewayIntentBits: Guilds, GuildMessages, MessageContent, GuildMembers, GuildModeration
- Partials for Message, Channel, Reaction caching

### Environment Variables (.env)
**Required:**
- `DISCORD_TOKEN` - Bot token from Discord Developer Portal
- `CLIENT_ID` - Application ID of your bot

**Optional:**
- `GUILD_ID` - For faster guild-specific command deployment during development
- `BOT_NAME` - Custom bot name (default: "Discord Bot")
- `BOT_PREFIX` - For legacy prefix commands (default: "!")
- `LOG_LEVEL` - error/warn/info/debug (default: "info")

**Security:** `.env` is in `.gitignore` - NEVER commit tokens!

---

## Common Tasks

### Adding a Command
1. Create file in `src/commands/<category>/<name>.js`
2. Export default object with `data` (SlashCommandBuilder) and `execute` function
3. Add `category` property for help command
4. Run `npm run deploy` to deploy command to Discord
5. Restart bot with `npm start` or `npm run dev`

### Adding an Event Handler
1. Create file in `src/events/<eventName>.js` with exact Discord.js event name
2. Export default object with `name`, `once`, `execute`
3. Bot restart will automatically load event (no deploy needed)

### Adding Permissions to Command
```javascript
import { PermissionFlagsBits } from 'discord.js';

.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
```

Also check runtime permissions:
```javascript
if (target.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({ embeds: [createErrorEmbed('Role hierarchy!')], ephemeral: true });
}
```

### Changing Bot Name
Update `BOT_NAME` in `.env` and restart bot. No code changes needed - config.js reads this.

---

## Important Notes

- **Node Version:** Minimum v18.0.0 required for native fetch and ES modules
- **Command Deployment:** Changes to command structure (name, options, description) require `npm run deploy`
- **Guild vs Global:** Development uses global deployment - for faster testing, uncomment guild deployment in `deploy-commands.js`
- **Intents:** MessageContent is a privileged intent - must be enabled in Discord Developer Portal
- **Hot Reload:** `npm run dev` uses `--watch` flag but this doesn't reload command changes to Discord API (deploy again for this)

### Discord Developer Portal Setup
1. Enable MESSAGE CONTENT INTENT under Bot settings
2. OAuth2 → URL Generator: Select `bot` and `applications.commands` scopes
3. Bot Permissions: Send Messages, Embed Links, Use Slash Commands, Kick Members
4. Copy Client ID for CLIENT_ID in .env
5. Reset token and copy for DISCORD_TOKEN in .env
