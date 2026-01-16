# Valknut - Rechten & Toegangscontrole

## Hiërarchie van Gebruikersrechten

### 1. **Super User (Bot Owner)** 👑
- **Configuratie**: `OWNER_ID` in `.env` bestand
- **Toegang**: Volledige toegang tot alle functies
- **Rechten**:
  - Toegang tot alle Discord servers in de webinterface
  - Beheer van Allowed Users (moderators toevoegen/verwijderen)
  - Handmatige database backups via `/backup` command
  - Alle admin functies
  - Geen Discord role vereist

**Instellen**:
```env
OWNER_ID=746692172304351272
```

---

### 2. **Moderator (Allowed User)** 🛡️
- **Configuratie**: Via webinterface `/admin/users` (alleen toegankelijk voor Owner)
- **Toegang**: Beperkt tot specifieke servers met Mod role
- **Rechten**:
  - Kan inloggen op de webinterface
  - Ziet alleen servers waar ze **lid** van zijn **EN** de **"Mod" role** hebben
  - Kan guild settings beheren (log channel, prefix, taal)
  - Kan gebruikers bekijken en roles synchroniseren
  - Kan **GEEN** andere moderators toevoegen

**Vereisten per server**:
- Lid zijn van de Discord server
- **"Mod" role** hebben in die server

**Toevoegen als moderator**:
1. Log in als Owner op webinterface
2. Ga naar profiel dropdown → "Manage Users"
3. Zoek gebruiker op Discord username
4. Voeg toe met optionele reden

---

### 3. **Administrator** 👮
- **Configuratie**: Discord Administrator permission (0x8)
- **Toegang**: Automatisch toegang tot servers waar ze admin zijn
- **Rechten**:
  - Volledige toegang tot guild management
  - Kan alle instellingen wijzigen
  - Kan gebruikers en roles beheren
  - Geen whitelisting vereist

---

### 4. **DEV Role** 🔧
- **Configuratie**: Discord role genaamd "DEV"
- **Toegang**: Development/testing toegang
- **Rechten**:
  - Toegang tot guild management voor development
  - Dezelfde rechten als administrators
  - Bedoeld voor bot developers

---

## Toegangsmatrix

| Functie | Owner | Moderator (Mod role) | Admin Permission | DEV Role |
|---------|-------|----------------------|------------------|----------|
| Webinterface login | ✅ | ✅ | ❌ (moet in Allowed Users) | ❌ (moet in Allowed Users) |
| Alle servers zien | ✅ | ❌ (alleen met Mod role) | ❌ (alleen eigen servers) | ❌ (alleen eigen servers) |
| Guild settings beheren | ✅ | ✅ (met Mod role) | ✅ | ✅ |
| Gebruikers beheren | ✅ | ✅ (met Mod role) | ✅ | ✅ |
| Roles synchroniseren | ✅ | ✅ (met Mod role) | ✅ | ✅ |
| Moderators toevoegen | ✅ | ❌ | ❌ | ❌ |
| Database backups | ✅ | ❌ | ❌ | ❌ |

---

## Voorbeelden

### Voorbeeld 1: Moderator met 2 servers
**Situatie**:
- Gebruiker "JohnDoe" is toegevoegd aan Allowed Users
- Lid van Server A (heeft Mod role) ✅
- Lid van Server B (geen Mod role) ❌
- Lid van Server C (heeft Mod role) ✅

**Resultaat**: JohnDoe ziet **alleen Server A en Server C** in dashboard

---

### Voorbeeld 2: Admin zonder whitelist
**Situatie**:
- Gebruiker "JaneAdmin" heeft Administrator permission in Server X
- Is **NIET** toegevoegd aan Allowed Users

**Resultaat**: JaneAdmin kan **niet** inloggen op webinterface

---

### Voorbeeld 3: Owner
**Situatie**:
- Gebruiker met OWNER_ID in .env
- Is lid van 5 servers

**Resultaat**: Owner ziet **alle servers** waar de bot actief is, ongeacht lidmaatschap

---

## Technische Implementatie

### Middleware Checks

**`isAllowedUser`**:
- Checkt of gebruiker Owner is of in AllowedUser model staat
- Gebruikt voor webinterface toegang

**`hasGuildAccess`**:
```javascript
1. Is user Owner? → Toegang verleend
2. Heeft user Administrator permission? → Toegang verleend
3. Heeft user DEV role in server? → Toegang verleend
4. Is user in AllowedUser EN heeft Mod role? → Toegang verleend
5. Anders → Toegang geweigerd
```

**`isOwner`**:
- Alleen Owner heeft toegang
- Gebruikt voor admin pagina's

---

## Best Practices

### Voor Owners:
1. ✅ Voeg alleen vertrouwde personen toe als moderator
2. ✅ Gebruik altijd een reden bij het toevoegen van moderators
3. ✅ Review regelmatig de lijst van Allowed Users
4. ✅ Verwijder inactieve moderators

### Voor Moderators:
1. ✅ Vraag server admins om de "Mod" role toe te wijzen
2. ✅ Gebruik rechten alleen voor het bedoelde doel
3. ✅ Rapporteer problemen aan de bot owner
4. ❌ Probeer niet toegang te krijgen tot servers waar je geen Mod role hebt

### Voor Server Admins:
1. ✅ Maak een "Mod" role aan voor moderators
2. ✅ Wijs deze role alleen toe aan vertrouwde personen
3. ✅ Gebruik Discord permissions voor eigen team members
4. ✅ Houd de "Mod" role beperkt tot moderatie taken

---

## Troubleshooting

**Probleem**: Moderator kan server niet zien in dashboard
- ✅ Check: Is gebruiker lid van de server?
- ✅ Check: Heeft gebruiker "Mod" role in die server?
- ✅ Check: Is gebruiker toegevoegd aan Allowed Users door owner?

**Probleem**: Admin kan niet inloggen
- ✅ Check: Is gebruiker toegevoegd aan Allowed Users?
- ⚠️ Administrator permission geeft geen automatische webinterface toegang

**Probleem**: Owner ziet niet alle servers
- ✅ Check: Is OWNER_ID correct ingesteld in .env?
- ✅ Check: Zijn de containers herstart na .env wijziging?

---

## Security Notes

🔒 **Belangrijke beveiligingspunten**:
- OWNER_ID moet **altijd** geheim blijven
- `.env` bestand staat in `.gitignore` - commit deze **NOOIT**
- Moderators kunnen alleen servers beheren waar ze expliciet toegang toe hebben
- Session data wordt opgeslagen in MongoDB (persistent en veilig)
- Backups bevatten gevoelige data - bescherm `/db-backups` directory

---

## Commands Overview

| Command | Toegang | Beschrijving |
|---------|---------|--------------|
| `/backup` | Owner only | Handmatige database backup |
| `/register` | Alle server leden | Registreer jezelf in database |
| `/kick` | Kick Members permission | Kick een gebruiker |
| `/setlogchannel` | Manage Channels permission | Stel log kanaal in |
| `/help` | Iedereen | Toon alle beschikbare commands |
| `/ping` | Iedereen | Check bot latency |
| `/guildinfo` | Iedereen | Toon server informatie |
| `/listguilds` | Owner only | Lijst alle servers |

---

*Laatst bijgewerkt: 16 januari 2026*
