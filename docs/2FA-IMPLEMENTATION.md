# Two-Factor Authentication (2FA) Implementatie

## Overzicht

De webinterface van Valknut is nu beveiligd met Two-Factor Authentication (2FA) via TOTP (Time-based One-Time Password). Dit voegt een extra beveiligingslaag toe bovenop de Discord OAuth2 authenticatie.

## Functionaliteit

### Voor Gebruikers

1. **Eerste Login**: Gebruikers loggen in via Discord OAuth2 zoals normaal
2. **2FA Setup**:
   - Ga naar het gebruikersmenu → "2FA Settings"
   - Klik op "Enable 2FA"
   - Scan de QR-code met een authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
   - Voer de 6-cijferige code in ter verificatie
   - **Belangrijk**: Bewaar de 10 backup codes op een veilige plek!

3. **Login met 2FA**:
   - Na Discord login wordt je doorgestuurd naar de 2FA verificatie pagina
   - Voer de 6-cijferige code uit je authenticator app in
   - Alternatief: gebruik een backup code als je geen toegang hebt tot je authenticator

4. **2FA Beheer**:
   - **Status**: Bekijk of 2FA actief is en hoeveel backup codes je nog hebt
   - **Backup Codes Regenereren**: Genereer nieuwe backup codes (oude worden ongeldig)
   - **2FA Uitschakelen**: Schakel 2FA uit (vereist een verificatiecode)

### Technische Details

#### Packages
- `speakeasy`: TOTP generatie en verificatie
- `qrcode`: QR-code generatie voor eenvoudige setup

#### Database Model
Het `AllowedUser` model is uitgebreid met:
- `twoFactorSecret`: Encrypted TOTP secret
- `twoFactorEnabled`: Boolean voor 2FA status
- `backupCodes`: Array van 10 backup codes

#### Authenticatie Flow

```
1. Discord OAuth2 Login
   ↓
2. Check 2FA Status (in auth callback)
   ↓
3a. 2FA Disabled → Dashboard (session.twoFactorVerified = true)
3b. 2FA Enabled → 2FA Verificatie Pagina
   ↓
4. Verificatie Code Invoer
   ↓
5. Verificatie Succesvol → Dashboard (session.twoFactorVerified = true)
```

#### Middleware

**`isTwoFactorVerified`**:
- Controleert of `req.session.twoFactorVerified === true`
- Redirect naar `/auth/2fa/verify` indien niet geverifieerd
- Gebruikt voor alle beschermde routes (setup, disable, regenerate)

**`isAllowedUser` & `isOwner`**:
- Uitgebreid met 2FA check
- Redirect naar 2FA verificatie als niet geverifieerd

#### Routes

- `GET /auth/2fa/setup` - QR code en setup pagina
- `POST /auth/2fa/enable` - Activeer 2FA met verificatie
- `GET /auth/2fa/verify` - Verificatie pagina na login
- `POST /auth/2fa/verify` - Submit verificatiecode
- `GET /auth/2fa/status` - Status en beheer pagina
- `POST /auth/2fa/disable` - Schakel 2FA uit
- `POST /auth/2fa/regenerate-backup-codes` - Genereer nieuwe backup codes

#### Session Beveiliging

- 2FA status wordt opgeslagen in `req.session.twoFactorVerified`
- Session wordt gereset bij logout
- Session timeout blijft 7 dagen (maar 2FA moet opnieuw bij nieuwe session)

## Aanbevelingen

### Voor Administrators

1. **Forceer 2FA voor Owners**: Overweeg 2FA verplicht te maken voor de OWNER_ID
2. **Audit Logging**: Log 2FA events (enable/disable/failed attempts)
3. **Rate Limiting**: Voeg rate limiting toe aan verification endpoint
4. **Backup Codes**: Herinner gebruikers regelmatig om hun backup codes te controleren

### Voor Gebruikers

1. **Gebruik een betrouwbare authenticator app**:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy (met cloud backup)
   - 1Password / Bitwarden (met TOTP support)

2. **Bewaar backup codes veilig**:
   - Print ze uit en bewaar ze op een veilige locatie
   - Sla ze op in een password manager
   - Deel ze NOOIT met anderen

3. **Test je 2FA setup**:
   - Log direct na setup uit en weer in om te testen
   - Controleer of je backup codes werken

## Troubleshooting

### "Invalid verification code"
- Controleer of de tijd op je apparaat correct is (TOTP is tijd-gebaseerd)
- Wacht tot de volgende code gegenereerd wordt (codes zijn 30 seconden geldig)
- Probeer een backup code als alternatief

### "Lost authenticator device"
- Gebruik een backup code om in te loggen
- Ga naar 2FA Settings en regenereer nieuwe backup codes
- Optioneel: disable en re-enable 2FA voor een nieuwe QR code

### Database migratie
Bestaande gebruikers hebben automatisch `twoFactorEnabled: false`, dus 2FA is opt-in.

## Toekomstige Verbeteringen

- [ ] WebAuthn/FIDO2 support (hardware security keys)
- [ ] SMS 2FA als backup optie
- [ ] Email verificatie codes
- [ ] Admin dashboard om 2FA status van users te zien
- [ ] Force 2FA voor specifieke roles/permissions
- [ ] 2FA grace period (bijv. 7 dagen op trusted devices)
- [ ] Audit log voor alle 2FA events

## Beveiliging Overwegingen

✅ **Geïmplementeerd**:
- TOTP met 32-character secret
- Backup codes (10 stuks, cryptographisch veilig)
- Session-based verificatie status
- Codes verlopen na 30 seconden (standaard TOTP)
- Window van 2 periodes voor clock skew

⚠️ **TODO**:
- Rate limiting op verification endpoint
- Brute force protection
- Audit logging van events
- Account lockout na X failed attempts
- Encrypted storage van secrets in database

## Gebruik

```bash
# Installeer dependencies (al gedaan)
npm install speakeasy qrcode

# Start webserver
npm run web

# Of met auto-reload tijdens development
npm run web:dev
```

Toegang tot 2FA: Log in op de webinterface → Gebruikersmenu → "2FA Settings"
