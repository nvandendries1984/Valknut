# Valknut - Permissions & Access Control

## User Permission Hierarchy

### 1. **Super User (Bot Owner)** 👑
- **Configuration**: `OWNER_ID` in `.env` file
- **Access**: Full access to all functions
- **Permissions**:
  - Access to all Discord servers in the web interface
  - Management of Allowed Users (add/remove moderators)
  - Manual database backups via `/backup` command
  - All admin functions
  - No Discord role required

**Setup**:
```env
OWNER_ID=746692172304351272
```

---

### 2. **Moderator (Allowed User)** 🛡️
- **Configuration**: Via web interface `/admin/users` (only accessible to Owner)
- **Access**: Limited to specific servers with Mod role
- **Permissions**:
  - Can log in to the web interface
  - Only sees servers where they are a **member** **AND** have the **"Mod" role**
  - Can manage guild settings (log channel, prefix, language)
  - Can view users and synchronize roles
  - **CANNOT** add other moderators

**Requirements per server**:
- Be a member of the Discord server
- Have the **"Mod" role** in that server

**Adding as moderator**:
1. Log in as Owner on web interface
2. Go to profile dropdown → "Manage Users"
3. Search user by Discord username
4. Add with optional reason

---

### 3. **Administrator** 👮
- **Configuration**: Discord Administrator permission (0x8)
- **Access**: Automatic access to servers where they are admin
- **Permissions**:
  - Full access to guild management
  - Can change all settings
  - Can manage users and roles
  - No whitelisting required

---

### 4. **DEV Role** 🔧
- **Configuration**: Discord role named "DEV"
- **Access**: Development/testing access
- **Permissions**:
  - Access to guild management for development
  - Same permissions as administrators
  - Intended for bot developers

---

## Access Matrix

| Function | Owner | Moderator (Mod role) | Admin Permission | DEV Role |
|---------|-------|----------------------|------------------|----------|
| Web interface login | ✅ | ✅ | ❌ (must be in Allowed Users) | ❌ (must be in Allowed Users) |
| See all servers | ✅ | ❌ (only with Mod role) | ❌ (only own servers) | ❌ (only own servers) |
| Manage guild settings | ✅ | ✅ (with Mod role) | ✅ | ✅ |
| Manage users | ✅ | ✅ (with Mod role) | ✅ | ✅ |
| Synchronize roles | ✅ | ✅ (with Mod role) | ✅ | ✅ |
| Add moderators | ✅ | ❌ | ❌ | ❌ |
| Database backups | ✅ | ❌ | ❌ | ❌ |

---

## Examples

### Example 1: Moderator with 2 servers
**Situation**:
- User "JohnDoe" is added to Allowed Users
- Member of Server A (has Mod role) ✅
- Member of Server B (no Mod role) ❌
- Member of Server C (has Mod role) ✅

**Result**: JohnDoe sees **only Server A and Server C** in dashboard

---

### Example 2: Admin without whitelist
**Situation**:
- User "JaneAdmin" has Administrator permission in Server X
- Is **NOT** added to Allowed Users

**Result**: JaneAdmin **cannot** log in to web interface

---

### Example 3: Owner
**Situation**:
- User with OWNER_ID in .env
- Is member of 5 servers

**Result**: Owner sees **all servers** where the bot is active, regardless of membership

---

## Technical Implementation

### Middleware Checks

**`isAllowedUser`**:
- Checks if user is Owner or in AllowedUser model
- Used for web interface access

**`hasGuildAccess`**:
```javascript
1. Is user Owner? → Access granted
2. Does user have Administrator permission? → Access granted
3. Does user have DEV role in server? → Access granted
4. Is user in AllowedUser AND has Mod role? → Access granted
5. Otherwise → Access denied
```

**`isOwner`**:
- Only Owner has access
- Used for admin pages

---

## Best Practices

### For Owners:
1. ✅ Only add trusted people as moderator
2. ✅ Always use a reason when adding moderators
3. ✅ Regularly review the list of Allowed Users
4. ✅ Remove inactive moderators

### For Moderators:
1. ✅ Ask server admins to assign the "Mod" role
2. ✅ Use permissions only for their intended purpose
3. ✅ Report issues to the bot owner
4. ❌ Don't try to access servers where you don't have the Mod role

### For Server Admins:
1. ✅ Create a "Mod" role for moderators
2. ✅ Only assign this role to trusted people
3. ✅ Use Discord permissions for your own team members
4. ✅ Keep the "Mod" role limited to moderation tasks

---

## Troubleshooting

**Problem**: Moderator cannot see server in dashboard
- ✅ Check: Is user a member of the server?
- ✅ Check: Does user have "Mod" role in that server?
- ✅ Check: Has user been added to Allowed Users by owner?

**Problem**: Admin cannot log in
- ✅ Check: Has user been added to Allowed Users?
- ⚠️ Administrator permission does not give automatic web interface access

**Problem**: Owner doesn't see all servers
- ✅ Check: Is OWNER_ID correctly set in .env?
- ✅ Check: Have containers been restarted after .env change?

---

## Security Notes

🔒 **Important security points**:
- OWNER_ID must **always** remain secret
- `.env` file is in `.gitignore` - **NEVER** commit it
- Moderators can only manage servers where they have explicit access
- Session data is stored in MongoDB (persistent and secure)
- Backups contain sensitive data - protect `/db-backups` directory

---

## Commands Overview

| Command | Access | Description |
|---------|---------|--------------|
| `/backup` | Server Owner + Mod Role | Manual database backup |
| `/register` | Server Owner + Mod Role | Register yourself in database |
| `/kick` | Server Owner + Mod Role | Kick a user |
| `/setlogchannel` | Server Owner + Mod Role | Set log channel |
| `/setmod` | Server Owner + Mod Role | Set moderator role |
| `/help` | Server Owner + Mod Role | Show all available commands |
| `/ping` | Server Owner + Mod Role | Check bot latency |
| `/guildinfo` | Server Owner + Mod Role | Show server information |
| `/listguilds` | Server Owner + Mod Role | List all servers |
| `/onboarding` | Server Owner + Mod Role | Manage onboarding settings |

**Important**: All commands can only be executed by:
- The **Server Owner** (owner of the Discord server)
- Users with the **Mod Role** that was set via `/setmod`

---

*Last updated: January 17, 2026*
