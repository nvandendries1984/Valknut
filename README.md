# Valknut - Discord Bot Template

A fully modular Discord.js v14 bot template with command handling, event handling, MongoDB integration, and complete .env configuration. **Now with Multi-Guild Support!**

## Features

- ✅ **Fully modular** - Commands and events in separate files
- 🐳 **Docker ready** - Easy deployment with Docker and Docker Compose
- 🔐 **Secure configuration** - All sensitive data in .env
- 📝 **Slash commands** - Modern Discord slash command support
- 🎨 **Embed utilities** - Easy-to-use embed creation
- 📊 **Logging system** - Colored console logging with levels
- ⚡ **Hot reload** - Development mode with auto-restart
- 🏗️ **Scalable** - Easily extensible with new commands and events
- 🌐 **Multi-Guild Support** - Works seamlessly across multiple Discord servers
- 💾 **MongoDB Integration** - Persistent data storage with Mongoose
- 🔧 **Guild-Specific Settings** - Per-server configuration (log channels, prefixes, etc.)

## Installation

### Option 1: Docker (Recommended)

1. Clone this repository
```bash
git clone <repository-url>
cd Valknut
```

2. Configure your bot
```bash
cp .env.example .env
```

3. Fill in your `.env` file with your Discord bot credentials
   - Go to https://discord.com/developers/applications
   - Create a new application or select an existing one
   - Copy the Bot Token and Client ID
   - Add your MongoDB connection string (MONGODB_URI)
   - Add your Discord User ID as OWNER_ID
   - Fill these into your `.env` file

4. Deploy slash commands (one-time setup)
```bash
docker-compose run --rm valknut-bot node src/deploy-commands.js
```

5. Start the bot
```bash
docker-compose up -d
```

6. View logs
```bash
docker-compose logs -f
```

### Option 2: Manual Installation

1. Clone this repository
```bash
git clone <repository-url>
cd Valknut
```

2. Install dependencies
```bash
npm install
```

3. Configure your bot
```bash
cp .env.example .env
```

4. Fill in your `.env` file with your Discord bot credentials
   - Go to https://discord.com/developers/applications
   - Create a new application or select an existing one
   - Copy the Bot Token and Client ID
   - Add your MongoDB connection string (MONGODB_URI)
   - Add your Discord User ID as OWNER_ID
   - Fill these into your `.env` file

5. Deploy slash commands
```bash
npm run deploy
```

6. Start the bot
```bash
npm start
```

## Docker Commands

### Start the bot
```bash
docker-compose up -d
```

### Stop the bot
```bash
docker-compose down
```

### Restart the bot
```bash
docker-compose restart
```

### View logs
```bash
docker-compose logs -f
```

### Rebuild container (after code changes)
```bash
docker-compose up -d --build
```

### Deploy commands in Docker
```bash
docker-compose run --rm valknut-bot node src/deploy-commands.js
```

## Development

For development with auto-restart on file changes:
```bash
npm run dev
```

## Project Structure

```
src/, register, guildinfo, listguilds)
│   └── moderation/    # Moderation commands (kick, ban, etc)
├── events/            # Discord event handlers
│   ├── ready.js       # Bot startup and guild registration
│   ├── guildCreate.js # New guild join handler
│   ├── guildDelete.js # Guild leave handler
│   ├── interactionCreate.js
│   └── messageCreate.js
├── handlers/          # Command and event loaders
│   ├── commandHandler.js
│   └── eventHandler.js
├── models/            # MongoDB/Mongoose models
│   ├── Guild.js       # Guild data and settings
│   └── User.js        # User registration (per-guild)
├── utils/             # Utility functions
│   ├── logger.js
│   ├── embedBuilder.js
│   └── database.js    # MongoDB connection
├── config/            # Configuration files
│   └── config.js
├── index.js           # Main bot entry point
└── deploy-commands.js # Slash command deployer
```

## Multi-Guild Features

The bot now supports multiple Discord servers with guild-specific settings:

### Automatic Guild Registration
- New guilds are automatically registered when the bot joins
- Existing guilds are registered on bot startup
- Guild data includes name, member count, owner, and settings

### Guild-Specific Settings
Each guild can have its own:
- **Log Channel** - Set with `/setlogchannel`
- **Custom Prefix** - Per-guild prefix configuration
- **Language Settings** - Multi-language support ready

### Guild Management Commands
- `/guildinfo` - Display detailed information about the current server (Admin only)
- `/listguilds` - List all guilds the bot is in (Owner only)
- `/setlogchannel` - Configure the log channel for this server (Admin only)

### User Registration
- Users are registered per-guild (same user can be registered in multiple servers)
- Track which guilds a user is registered in
- `/register` command now supports multi-guild registration

## Migration from Single-Guild

If you're upgrading from an older version:

1. Run the migration script to transfer log channel data:
```bash
npm run migrate
```

2. After successful migration, you can safely delete `src/config/logChannel.json─ index.js           # Main bot entry point
└── deploy-commands.js # Slash command deployer
```

## Adding a New Command

1. Create a new file in `src/commands/<category>/`
### Required
- `DISCORD_TOKEN` - Your bot token from Discord Developer Portal
- `CLIENT_ID` - Your application ID
- `MONGODB_URI` - MongoDB connection string (e.g., `mongodb://localhost:27017/valknut`)
- `OWNER_ID` - Your Discord user ID (for owner-only commands)

### Optional
- `GUILD_ID` - Test server ID (for faster command deployment during development)
- `BOT_NAME` - The name of your bot (default: "Discord Bot")
- `BOT_PREFIX` - Prefix for legacy text commands (default: "!")
- `LOG_LEVEL` - Logging level: error/warn/info/debug (default: "info"
export default {
    category: 'utility', // Optional, for help command
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Command description'),

    async execute(interaction) {
        // Command logic here
        await interaction.reply('Response!');
    }
};
```

3. Deploy the commands again: `npm run deploy`
4. Restart the bot

## Adding a New Event

Create a new file in `src/events/`:

```javascript
import { logger } from '../utils/logger.js';

export default {
    name: 'eventName', // Discord.js event name
    once: false, // true for one-time events like 'clientReady'
    async execute(...args) {
        // Event logic here
    }
};
```

## Configuration

All configuration is done via `.env`:

- `DISCORD_TOKEN` - Your bot token
- `CLIENT_ID` - Your application ID
- `GUILD_ID` - Test server ID (optional)
- `BOT_NAME` - The name of your bot (configurable)
- `BOT_PREFIX` - Prefix for legacy text commands
- `LOG_LEVEL` - Logging level (error/warn/info/debug)

## Bot Permissions

Make sure your bot has the following permissions:
- Send Messages
- Embed Links
- Read Message History
- Use Slash Commands
- Kick Members (for moderation commands)

## License

MIT
