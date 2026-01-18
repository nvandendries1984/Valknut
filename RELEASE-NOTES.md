# Valknut Release Notes

---

## v1.0.2 - Bug Reporting System

**Release Date:** January 18, 2026
**Status:** ✅ Stable Update

### 🎉 What's New

#### Bug Reporting System
- ✅ **New `/bug` Command** - MOD/OWNER only command to report bugs via interactive modal
  - Comprehensive bug report form with 5 fields
  - Collects: Title, Steps to Reproduce, Expected Behavior, Actual Behavior, Additional Info
  - Sends formatted bug reports to configured bug channel
  - Permission-restricted to moderators and server owners
  - Full error handling and logging

- ✅ **New `/setbugchannel` Command** - Configure where bug reports are sent
  - MOD/OWNER only command
  - Validates bot permissions in selected channel
  - Stores bug channel configuration in database
  - Sends confirmation message to configured channel

#### Database Updates
- ✅ **Bug Channel Support** - Added `bugChannelId` field to Guild model
- ✅ **New Guild Methods** - Added `getBugChannel()` and `setBugChannel()` methods

#### Developer Experience
- ✅ **Modal Handler Extension** - Extended interactionCreate event to handle bug modal submissions
- ✅ **Permission Integration** - Bug commands use existing `canExecuteCommand()` utility

### 📋 New Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/bug` | Report a bug to moderators | MOD/OWNER |
| `/setbugchannel` | Set bug report channel | MOD/OWNER |

---

## v1.0.1 - Feedback & UX Improvements

**Release Date:** January 18, 2026
**Status:** ✅ Stable Update

### 🎉 What's New

#### Feedback System
- ✅ **New `/feedback` Command** - Users can now submit feedback directly to the bot owner via Discord
  - Interactive modal-based interface for better user experience
  - Collects name, email, subject, and detailed message
  - Sends formatted feedback to bot owner via DM
  - Provides confirmation message to the user
  - Full error handling and logging

#### User Experience Improvements
- ✅ **Enhanced Error Pages** - Improved error.ejs with better styling and user-friendly messages
- ✅ **404 Page Updates** - Better 404.ejs layout and navigation
- ✅ **Navbar Refinements** - Improved navigation bar in web dashboard
- ✅ **Auth Middleware** - Enhanced authentication error handling and logging

#### Developer Experience
- ✅ **Better Error Logging** - More comprehensive logging in interactionCreate event handler
- ✅ **Modal Interaction Support** - Extended interaction handler to support modal submissions
- ✅ **Improved Error Messages** - More descriptive error messages for troubleshooting

### 📋 Updated Commands List

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/feedback` | Submit feedback to bot owner | Everyone |

All commands from v1.0.0 remain available and unchanged.

### 🐛 Bug Fixes
- Fixed authentication error handling in web dashboard
- Improved error page rendering
- Enhanced navbar responsive behavior

### 🔧 Technical Changes
- Updated `interactionCreate.js` to handle modal submissions
- Enhanced `auth.js` middleware with better error handling
- Improved EJS templates for better UI/UX
- Added comprehensive logging for feedback submissions

---

## v1.0.0 - Initial Release

**Release Date:** January 18, 2026
**Status:** ✅ MVP (Minimum Viable Product)

### 🎉 Initial Release

Valknut v1.0.0 represents the first production-ready release of this modular Discord.js bot template. This MVP delivers a complete foundation for building scalable Discord bots with multi-guild support, web dashboard, and comprehensive management features.

---

## 🚀 Core Features

### Discord Bot Functionality

#### **Modular Architecture**
- ✅ Handler-based system for automatic command and event loading
- ✅ ES modules (ESM) support for modern JavaScript
- ✅ Category-based command organization (utility, moderation)
- ✅ Hot-reload development mode with `--watch` flag

#### **Slash Commands Support**
- ✅ Full Discord.js v14 slash commands implementation
- ✅ Automatic command deployment via `npm run deploy`
- ✅ Guild-specific and global command deployment options

#### **Multi-Guild Support**
- ✅ Seamless operation across unlimited Discord servers
- ✅ Automatic guild registration on bot join
- ✅ Guild-specific configuration (log channels, prefixes)
- ✅ Per-guild user registration system

### Database & Persistence

#### **MongoDB Integration**
- ✅ Mongoose ODM for data modeling
- ✅ Persistent storage for guilds, users, roles, and stats
- ✅ Automatic connection management with retry logic
- ✅ Guild-specific settings storage

#### **Data Models**
- **Guild Model** - Server configuration, log channels, prefixes
- **User Model** - Multi-guild user registration tracking
- **AllowedUser Model** - Web dashboard access control
- **Role Model** - Role synchronization and management
- **UserStats Model** - Activity tracking and statistics

### Web Dashboard

#### **Authentication & Security**
- ✅ Discord OAuth2 authentication via Passport.js
- ✅ Two-Factor Authentication (2FA) with TOTP
- ✅ Session management with MongoDB session store
- ✅ Cookie consent implementation (GDPR-compliant)
- ✅ Role-based access control (Admin/Moderator)

#### **Dashboard Features**
- ✅ Multi-guild selection and management
- ✅ Real-time guild information display
- ✅ User registration management per guild
- ✅ Role assignment and synchronization
- ✅ Guild backup and restore functionality
- ✅ Onboarding flow configuration

#### **Admin Panel**
- ✅ User access management
- ✅ Backup management (create, download, restore)
- ✅ System-wide user administration
- ✅ Guild overview and statistics

#### **Internationalization (i18n)**
- ✅ Multi-language support framework
- ✅ English locale (default)
- ✅ Easy translation file management

---

## 📋 Available Commands

### Utility Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/ping` | Check bot latency and API response time | Everyone |
| `/help` | Display all available commands with categories | Everyone |
| `/register` | Register yourself in the guild system | Everyone |
| `/guildinfo` | Display detailed server information | Admin |
| `/listguilds` | List all guilds the bot is in | Owner Only |
| `/setlogchannel` | Configure log channel for the server | Admin |
| `/setmod` | Manage moderator roles | Admin |
| `/backup` | Create backup of guild configuration | Admin |
| `/onboarding` | Configure guild onboarding settings | Admin |

### Moderation Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/kick` | Kick a member from the server | Kick Members |
| `/stats` | View user statistics and activity | Moderate Members |
| `/userlist` | Export user list to Excel file | Admin |

---

## 🎨 Utilities & Tools

### Embed System
- **Standard Embeds** - Consistent branding across all messages
- **Success Embeds** - Green embeds for successful operations
- **Error Embeds** - Red embeds for error messages
- **Warning Embeds** - Yellow embeds for warnings
- Auto-generated timestamps and bot footer

### Logging System
- **Color-coded Console Output** - Easy visual debugging
- **Multiple Log Levels** - ERROR, WARN, INFO, DEBUG
- **File Logging** - Persistent logs in `logs/bot.log`
- **Configurable Verbosity** - Set via `LOG_LEVEL` environment variable

### Permission Management
- **Role Hierarchy Checks** - Prevent privilege escalation
- **Per-Command Permissions** - Fine-grained access control
- **Owner-Only Commands** - Special commands for bot owner
- **Guild-Specific Permissions** - Different permissions per server

### Backup System
- **Guild Configuration Backups** - Save server settings
- **User Data Export** - Excel format user lists
- **Automated Backup Scheduling** - Regular automatic backups
- **Web Dashboard Integration** - Manage backups via web interface

---

## 🐳 Deployment Options

### Docker Support (Recommended)
- ✅ Complete Docker and Docker Compose configuration
- ✅ Automated container builds
- ✅ Volume management for persistent data
- ✅ Environment variable configuration
- ✅ Easy log viewing and container management

### Manual Installation
- ✅ npm script support for all operations
- ✅ Development mode with auto-restart
- ✅ Production-ready start scripts

---

## 🔧 Configuration

### Environment Variables

#### Required
- `DISCORD_TOKEN` - Bot token from Discord Developer Portal
- `CLIENT_ID` - Discord Application ID
- `DISCORD_CLIENT_SECRET` - OAuth2 client secret for web dashboard
- `MONGODB_URI` - MongoDB connection string
- `OWNER_ID` - Discord User ID of bot owner
- `SESSION_SECRET` - Secret for web session encryption

#### Optional
- `GUILD_ID` - Test server ID for faster command deployment
- `BOT_NAME` - Custom bot name (default: "Discord Bot")
- `BOT_PREFIX` - Legacy command prefix (default: "!")
- `LOG_LEVEL` - Logging verbosity (error/warn/info/debug)
- `WEB_PORT` - Web dashboard port (default: 16016)
- `DISCORD_CALLBACK_URL` - OAuth2 callback URL

---

## 📊 Event Handlers

The bot includes handlers for the following Discord events:
- `ready` - Bot startup and initialization
- `interactionCreate` - Slash command handling
- `messageCreate` - Message-based events
- `guildCreate` - New server join
- `guildDelete` - Server leave/kick
- `guildMemberUpdate` - Member role changes
- `voiceStateUpdate` - Voice channel activity

---

## 🛡️ Security Features

- ✅ No hardcoded credentials (100% .env configuration)
- ✅ `.gitignore` configured to prevent token leaks
- ✅ Two-Factor Authentication for web dashboard
- ✅ Session-based authentication with secure cookies
- ✅ GDPR-compliant cookie consent
- ✅ Role-based access control
- ✅ Permission validation on all commands
- ✅ MongoDB connection security

---

## 📦 Dependencies

### Core Dependencies
- **discord.js** v14.14.1 - Discord API wrapper
- **mongoose** v8.0.3 - MongoDB ODM
- **express** v4.22.1 - Web server
- **passport** v0.7.0 - Authentication middleware
- **passport-discord** v0.1.4 - Discord OAuth2 strategy

### Web Dashboard
- **ejs** v3.1.10 - Template engine
- **express-session** v1.18.2 - Session management
- **connect-mongo** v6.0.0 - MongoDB session store
- **i18n** v0.15.3 - Internationalization
- **speakeasy** v2.0.0 - 2FA TOTP implementation
- **qrcode** v1.5.4 - QR code generation

### Utilities
- **dotenv** v16.3.1 - Environment variable management
- **node-cron** v4.2.1 - Task scheduling
- **xlsx** v0.18.5 - Excel file generation
- **cookie-parser** v1.4.7 - Cookie handling

---

## 🔄 Migration Support

Includes migration script for upgrading from older single-guild versions:
```bash
npm run migrate
```

Migrates legacy `logChannel.json` data to MongoDB-based guild settings.

---

## 📁 Project Structure

```
Valknut/
├── src/                    # Bot source code
│   ├── commands/           # Slash commands (moderation, utility)
│   ├── events/             # Discord event handlers
│   ├── handlers/           # Command and event loaders
│   ├── models/             # Mongoose data models
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration management
│   ├── index.js            # Bot entry point
│   └── deploy-commands.js  # Command deployment script
├── web/                    # Web dashboard
│   ├── routes/             # Express routes
│   ├── views/              # EJS templates
│   ├── public/             # Static assets
│   ├── middleware/         # Custom middleware
│   ├── locales/            # Translation files
│   └── server.js           # Web server entry point
├── logs/                   # Log files
├── db-backups/            # Database backup storage
├── docs/                   # Documentation
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose setup
├── package.json            # Node.js dependencies
└── .env                    # Environment configuration
```

---

## 🚦 Getting Started

### Quick Start with Docker
```bash
# 1. Clone and configure
git clone <repository-url>
cd Valknut
cp .env.example .env
# Edit .env with your credentials

# 2. Deploy commands
docker-compose run --rm valknut-bot node src/deploy-commands.js

# 3. Start the bot
docker-compose up -d

# 4. View logs
docker-compose logs -f
```

### Manual Installation
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Deploy commands
npm run deploy

# 4. Start bot and web dashboard
npm start      # Bot
npm run web    # Dashboard (separate terminal)
```

---

## 📖 Documentation

Additional documentation available:
- [2FA Implementation Guide](docs/2FA-IMPLEMENTATION.md)
- [Cookie Consent Implementation](docs/COOKIE-CONSENT-IMPLEMENTATION.md)
- [Internationalization Guide](docs/I18N-IMPLEMENTATION.md)
- [Permissions Overview](PERMISSIONS.md)

---

## 🔍 System Requirements

- **Node.js** v18.0.0 or higher
- **MongoDB** v4.0 or higher
- **Discord Bot** with MESSAGE CONTENT INTENT enabled
- **Docker** (optional, for containerized deployment)

---

## 🐛 Known Limitations

This is an MVP release. Future enhancements may include:
- Additional moderation commands (ban, mute, warn)
- Advanced statistics and analytics
- Custom command creation via web dashboard
- Webhook integrations
- Music/audio features
- Advanced role management

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🙏 Credits

Built with Discord.js v14 and modern web technologies.

---

## 📞 Support

For issues, questions, or contributions, please refer to the project repository.

---

**Version:** 1.0.0
**Release Type:** Initial MVP Release
**Stability:** Production Ready ✅
