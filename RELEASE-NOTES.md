# Valknut Release Notes

---

## v1.0.4 - Documentation & UX Improvements

**Release Date:** January 18, 2026
**Status:** ✅ Stable Update

### 🎉 What's New

#### Documentation Improvements
- ✅ **Updated Web Help Page** - Aligned help.ejs with Discord help command structure
  - Synchronized all command descriptions between web and Discord interfaces
  - Consistent terminology across all platforms
  - Improved clarity and conciseness
  - English language standardization throughout

#### User Experience Enhancements
- ✅ **Standardized Command Descriptions** - All commands now have consistent, clear descriptions
  - Removed redundant explanations from command descriptions
  - Focused on core functionality in descriptions
  - Detailed usage information available via command parameters

#### Web Interface Updates
- ✅ **Help Page Refinements**
  - Updated section titles to match Discord help command categories
  - Improved command card descriptions for better readability
  - Enhanced permission system explanation clarity
  - Streamlined tips and tricks section

### 🔧 Technical Changes
- Updated `help.ejs` template with aligned descriptions
- Standardized command documentation format
- Improved consistency between Discord bot and web dashboard

### 📋 Updated Documentation

All command descriptions have been standardized:

| Command | Updated Description |
|---------|-------------------|
| `/help` | Show all available commands with detailed information |
| `/feedback` | Submit feedback to the bot owner via interactive modal |
| `/register` | Register a user in the database for access to bot functions |
| `/onboarding` | Start onboarding process for a user (Saga, name, date of birth, etc.) |
| `/viewuserstats` | View complete user profile with personal information, saga progress, points, and activity statistics |
| `/setprogress` | Set Saga & Progress information for a member via interactive modal |
| `/setpoints` | Set Points & Statistics for a user via interactive modal (Points, Penalty Points, Strikes, Notes) |
| `/kick` | Kick a member from the server via interactive modal (message, standing) |
| `/stats` | View user statistics (messages, voice time) for 1, 7, and 14 days |
| `/userlist` | Generate Excel file with all registered users and their data |
| `/guildinfo` | Display information about this server, such as members, roles, and settings |
| `/setmod` | Set the moderator role for this server |
| `/setlogchannel` | Set the channel where bot logs will be sent |
| `/setbugchannel` | Set the channel where bug reports will be sent |
| `/listguilds` | Show list of all servers where the bot is active |
| `/bug` | Report a bug to moderators via interactive modal |
| `/backup` | Create a manual database backup (automatic backup daily at 00:00) |

### 🎯 Benefits
**For Users:**
- Clearer understanding of command functionality
- Consistent information across Discord and web interfaces
- Easier to learn and use bot commands

**For Administrators:**
- Better documentation for training new moderators
- Unified command reference
- Professional, polished presentation

### 📝 Notes
This release focuses on improving documentation quality and user experience without introducing breaking changes. All existing commands and features remain fully functional.

---

## v1.0.3 - Advanced User Management & Statistics

**Release Date:** January 18, 2026
**Status:** ✅ Major Feature Update

### 🎉 What's New

#### User Statistics System
- ✅ **New `/stats` Command** - View comprehensive user activity statistics (MOD/OWNER only)
  - Track message counts over 1, 7, and 14 day periods
  - Track voice channel time across multiple time periods
  - Beautiful embed with daily breakdown of activity
  - Real-time voice session tracking
  - Automatic daily statistics collection

- ✅ **New `/viewuserstats` Command** - Complete user profile viewer (MOD/OWNER only)
  - View all registered user information in one place
  - Display onboarding details (name, email, phone, address)
  - Show saga progression and level information
  - View points, penalty points (strafpunten), and strikes
  - Display registration dates (recruit and warrior dates)
  - Formatted embeds with user avatar and timestamps
  - Error handling for unregistered users

#### User Management Commands
- ✅ **New `/setpoints` Command** - Set user points and statistics via interactive modal (MOD/OWNER only)
  - Update points (punten), penalty points (strafpunten), and strikes
  - Pre-filled modal with current values
  - Validates numeric input
  - Comprehensive error handling and logging
  - Confirmation embed with updated values

- ✅ **New `/setprogress` Command** - Update user saga progression (MOD/OWNER only)
  - Set saga type (Beardserker, Sideburn Soldier, Moustache Militia, Goatee Gladiator, Whaler, Shieldmaiden)
  - Update saga level (numeric)
  - Set recruit and warrior dates
  - Add custom notes for moderation tracking
  - Pre-filled modal with existing user data
  - Full validation and error handling

- ✅ **New `/backup` Command** - Manual database backup creation (BOT OWNER only)
  - Create instant compressed database backups
  - Owner-only command for security
  - Returns backup file location and name
  - Shows auto-backup schedule information
  - Integration with automatic daily backup system

#### Database Enhancements
- ✅ **UserStats Model** - New collection for tracking daily user activity
  - Automatic daily stats aggregation
  - Message count tracking per day
  - Voice time tracking with session management
  - Compound indexes for efficient queries
  - Static helper methods for common operations

- ✅ **User Model Extensions** - Enhanced user schema
  - Saga progression fields (saga type and level)
  - Points system (punten, strafpunten, strikes)
  - Date tracking (recruit date, warrior date)
  - Notes field for moderation records
  - Full onboarding information support

#### Event Tracking System
- ✅ **Message Tracking** - Automatic message count tracking in `messageCreate` event
  - Increments daily message statistics
  - Per-guild tracking
  - Non-blocking background operation
  - Error resilience

- ✅ **Voice Tracking** - Real-time voice channel activity tracking in `voiceStateUpdate` event
  - Automatic session start/stop detection
  - Calculates total voice time per day
  - Handles disconnects and channel switches
  - Persistent session tracking

#### Web Dashboard Updates
- ✅ **Updated Help Page** - Added documentation for new backup command
- ✅ **Help Command Updates** - Updated `/help` command to include all new features

### 📋 New Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/stats` | View user activity statistics (messages/voice) | MOD/OWNER |
| `/viewuserstats` | View complete user profile and information | MOD/OWNER |
| `/setpoints` | Set points, penalty points, and strikes | MOD/OWNER |
| `/setprogress` | Update saga progression and notes | MOD/OWNER |
| `/backup` | Create manual database backup | BOT OWNER |

### 🔧 Technical Changes
- Enhanced `messageCreate.js` event handler with stats tracking
- Enhanced `voiceStateUpdate.js` event handler with voice time calculation
- Added voice session management logic for accurate tracking
- Implemented compound indexes on UserStats for performance
- Extended interaction handlers to support multiple new modals
- Added comprehensive validation for saga types and numeric fields

### 🎯 Use Cases
**For Moderators:**
- Track active community members with `/stats`
- View complete user profiles with `/viewuserstats`
- Update member progression with `/setprogress`
- Manage points and penalties with `/setpoints`

**For Bot Owners:**
- Create on-demand database backups with `/backup`
- Monitor bot data integrity
- Prepare for maintenance windows

**Automatic Features:**
- Message activity is tracked automatically
- Voice channel time is recorded in real-time
- Daily statistics aggregation happens in background
- No user action required for tracking

### 📊 Statistics Tracked
- **Messages:** Total message count per day (1/7/14 day views)
- **Voice Time:** Total seconds in voice channels per day
- **Daily Breakdown:** Individual daily statistics for last 7 days
- **Session Management:** Active voice sessions tracked separately

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
