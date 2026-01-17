# Cookie Consent & Privacy Implementatie

## Overzicht
Dit document beschrijft de implementatie van GDPR/AVG-compliant cookie consent en privacy beleid voor Valknut.

## Wat is geïmplementeerd?

### 1. Cookie Consent Banner (`/web/views/partials/cookie-consent.ejs`)
- **Functionaliteit:**
  - Modal overlay die verschijnt bij eerste bezoek
  - Blokkeert scrollen totdat een keuze is gemaakt
  - Drie opties: Accepteren, Weigeren, Meer informatie
  - Toont welke gegevens worden verzameld
  - Legt uit welke cookies worden gebruikt

- **Technisch:**
  - JavaScript gebruikt localStorage/cookies om keuze op te slaan
  - Cookie: `cookie_consent` met waarde `accepted` of `declined`
  - Geldigheid: 365 dagen
  - Blokkeert login functionaliteit als cookies geweigerd zijn

### 2. Privacy Policy Pagina (`/web/views/privacy.ejs`)
- **Route:** `/privacy`
- **Inhoud:**
  - Welke gegevens worden verzameld (Discord ID, username, server config, etc.)
  - Hoe gegevens worden gebruikt
  - Cookie tabel met typen en doeleinden
  - AVG/GDPR rechten uitleg
  - Beveiligingsmaatregelen
  - Bewaartermijnen
  - Contact informatie

### 3. Terms of Service Pagina (`/web/views/terms.ejs`)
- **Route:** `/terms`
- **Inhoud:**
  - Gebruiksvoorwaarden
  - Toegestaan en verboden gebruik
  - Account verantwoordelijkheden
  - Disclaimer en aansprakelijkheid
  - Intellectueel eigendom
  - Wettelijke informatie

### 4. Cookie Consent Middleware (`/web/middleware/cookieConsent.js`)

#### `requireCookieConsent`
- Controleert of cookie consent is gegeven voor login
- Gebruikt bij `/auth/login` route
- Redirect naar home met error parameter als consent ontbreekt

#### `checkCookieConsent`
- Controleert cookie consent voor alle authenticated routes
- Logt gebruiker automatisch uit als consent wordt ingetrokken
- Gebruikt globaal in server.js

### 5. Styling (`/web/public/css/style.css`)
- **Viking-themed design:**
  - Gradient backgrounds met Viking kleuren
  - Smooth animations (fadeIn, slideUp)
  - Responsive design voor mobiel
  - Overlay met blur effect
  - Goud/bloed kleurenschema

### 6. Server Routes (`/web/server.js`)
- **Nieuwe routes:**
  - `GET /privacy` - Privacy policy pagina
  - `GET /terms` - Terms of service pagina
- **Middleware integratie:**
  - Cookie consent check voor alle authenticated requests
  - BotName beschikbaar in alle views

## Hoe werkt het?

### Flow voor nieuwe bezoekers:

1. **Eerste bezoek:**
   ```
   Bezoeker → Homepage → Cookie Banner verschijnt
   ```

2. **Als cookies geaccepteerd:**
   ```
   Klik "Accepteren" → Cookie wordt opgeslagen → Banner verdwijnt → Kan inloggen
   ```

3. **Als cookies geweigerd:**
   ```
   Klik "Weigeren" → Cookie wordt opgeslagen → Banner verdwijnt → Kan NIET inloggen
   ```

4. **Login poging zonder consent:**
   ```
   Klik "Login" → Middleware check → Redirect naar home met waarschuwing
   ```

### Flow voor ingelogde gebruikers:

1. **Cookie consent check bij elke request:**
   ```
   Request → checkCookieConsent middleware →
   Als consent ontbreekt → Logout → Redirect
   ```

2. **Cookie verloopt na 365 dagen:**
   ```
   Cookie expired → Bij volgende bezoek → Banner verschijnt opnieuw
   ```

## Juridische compliance

### AVG/GDPR Vereisten ✅
- ✅ **Informed consent:** Duidelijke uitleg wat wordt opgeslagen
- ✅ **Opt-in:** Geen cookies zonder expliciete toestemming
- ✅ **Rechten uitleg:** Privacy policy legt alle rechten uit
- ✅ **Data minimalisatie:** Alleen noodzakelijke gegevens
- ✅ **Transparantie:** Volledige uitleg van verwerking
- ✅ **Contact informatie:** Voor het uitoefenen van rechten

### Cookie Types
1. **Noodzakelijke cookies:**
   - Sessie cookies (authenticatie)
   - Cookie consent cookie
   - Verplicht voor werking

2. **Functionele cookies:**
   - 2FA remember device
   - Gebruikersvoorkeuren
   - Optioneel maar aanbevolen

## Aanpassingen die je moet maken

### ⚠️ VERPLICHT:
Voeg jouw contact informatie toe in beide bestanden:

#### In `/web/views/privacy.ejs` en `/web/views/terms.ejs`:
```html
<p class="mb-2"><i class="fas fa-at me-2"></i><strong>E-mail:</strong> [JOUW EMAIL]</p>
<p class="mb-2"><i class="fab fa-discord me-2"></i><strong>Discord:</strong> [JOUW DISCORD SERVER LINK]</p>
```

### Optioneel:
Voeg in `.env` toe (voor website URL in privacy policy):
```env
WEBSITE_URL=https://jouw-website.nl
```

## Testen

### Test Scenario's:

1. **Test cookie banner:**
   ```bash
   - Open website in incognito mode
   - Controleer of banner verschijnt
   - Test "Accepteren" knop
   - Controleer of banner verdwijnt
   - Ververs pagina - banner moet weg blijven
   ```

2. **Test login blokkering:**
   ```bash
   - Open website in incognito mode
   - Klik "Weigeren" in cookie banner
   - Probeer in te loggen
   - Moet waarschuwing tonen
   ```

3. **Test privacy pages:**
   ```bash
   curl http://localhost:16016/privacy
   curl http://localhost:16016/terms
   ```

4. **Test cookie expiry:**
   ```bash
   - Login met cookies geaccepteerd
   - Verwijder `cookie_consent` cookie in browser
   - Refresh pagina
   - Moet automatisch uitloggen
   ```

## Browser Developer Tools Testen

### Cookies inspecteren:
```javascript
// In browser console:
document.cookie.split(';').filter(c => c.includes('cookie_consent'))

// Output zou moeten zijn:
// [" cookie_consent=accepted"]
```

### Cookie verwijderen voor hertest:
```javascript
// In browser console:
document.cookie = 'cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
location.reload();
```

## Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Security Features

1. **Cookie settings:**
   - `httpOnly: true` voor sessie cookies (XSS bescherming)
   - `sameSite: 'lax'` (CSRF bescherming)
   - `secure: false` (set to true in production met HTTPS!)

2. **Middleware protection:**
   - Controleert consent bij elke authenticated request
   - Automatische logout bij consent intrekking

3. **No tracking:**
   - Geen third-party tracking cookies
   - Geen analytics zonder consent
   - Alleen functionele cookies

## Production Checklist

### Voor deployment naar productie:

- [ ] Voeg jouw contact email toe in privacy.ejs en terms.ejs
- [ ] Voeg Discord server link toe in privacy.ejs en terms.ejs
- [ ] Update `WEBSITE_URL` in .env
- [ ] Zet `secure: true` in session cookie config (voor HTTPS)
- [ ] Test alle flows op productie environment
- [ ] Backup van oude config maken
- [ ] Monitor logs voor cookie consent errors
- [ ] Informeer gebruikers over nieuwe privacy policy

## Troubleshooting

### Banner verschijnt niet:
```javascript
// Check in browser console:
console.log(document.cookie);
// Als cookie_consent bestaat, verwijder deze en reload
```

### Login werkt niet na accepteren:
```bash
# Check server logs:
docker logs valknut-bot

# Kijk naar:
# "Login attempt without cookie consent from IP: ..."
```

### Styling issues:
```bash
# Controleer of CSS goed geladen is:
curl http://localhost:16016/css/style.css | grep cookie-consent
```

## Onderhoud

### Updates in de toekomst:
1. **Bij nieuwe features die cookies gebruiken:**
   - Update privacy.ejs met uitleg
   - Update cookie tabel
   - Overweeg nieuwe consent versie

2. **Bij wijzigingen in data opslag:**
   - Update privacy policy
   - Update "Laatste update" datum
   - Informeer bestaande gebruikers

3. **Bij wet wijzigingen:**
   - Controleer AVG updates
   - Pas policy aan indien nodig
   - Legal review aanbevolen

## Links & Resources

- [GDPR Info](https://gdpr.eu/)
- [AVG Autoriteit Persoonsgegevens](https://autoriteitpersoonsgegevens.nl/)
- [Discord Terms of Service](https://discord.com/terms)
- [Cookie Law Explained](https://gdpr.eu/cookies/)

## Support

Voor vragen over deze implementatie:
- Check de code comments in de bestanden
- Zie de inline documentatie
- Open een issue op GitHub

---

**Versie:** 1.0
**Datum:** 17 januari 2026
**Status:** ✅ Compleet en getest
