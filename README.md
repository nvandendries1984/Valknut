# Valknut - Discord Bot Template

A fully modular Discord.js v14 bot template with command handling, event handling, and complete .env configuration.

## Features

- ✅ **Fully modular** - Commands and events in separate files
- 🔐 **Secure configuration** - All sensitive data in .env
- 📝 **Slash commands** - Modern Discord slash command support
- 🎨 **Embed utilities** - Easy-to-use embed creation
- 📊 **Logging system** - Colored console logging with levels
- ⚡ **Hot reload** - Development mode with auto-restart
- 🏗️ **Scalable** - Easily extensible with new commands and events

## Installation

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
   - Fill these into your `.env` file

5. Deploy slash commands
```bash
npm run deploy
```

6. Start the bot
```bash
npm start
```

## Development

For development with auto-restart on file changes:
```bash
npm run dev
```

## Project Structure

```
src/
├── commands/           # All bot commands
│   ├── utility/       # Utility commands (ping, help)
│   └── moderation/    # Moderation commands (kick, ban, etc)
├── events/            # Discord event handlers
│   ├── ready.js
│   ├── interactionCreate.js
│   └── messageCreate.js
├── handlers/          # Command and event loaders
│   ├── commandHandler.js
│   └── eventHandler.js
├── utils/             # Utility functions
│   ├── logger.js
│   └── embedBuilder.js
├── config/            # Configuration files
│   └── config.js
├── index.js           # Main bot entry point
└── deploy-commands.js # Slash command deployer
```

## Adding a New Command

1. Create a new file in `src/commands/<category>/`
2. Use this template:

```javascript
import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embedBuilder.js';

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
    once: false, // true for one-time events like 'ready'
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
