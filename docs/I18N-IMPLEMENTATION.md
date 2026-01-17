# Internationalisatie (i18n) Documentatie

## Overzicht

Valknut maakt gebruik van de `i18n` package om meertalige ondersteuning te bieden voor de webinterface. Momenteel zijn Nederlands (nl) en Engels (en) ondersteund, maar je kunt eenvoudig extra talen toevoegen.

## Configuratie

De i18n configuratie is ingesteld in `web/server.js`:

```javascript
i18n.configure({
    locales: ['nl', 'en'],
    defaultLocale: 'nl',
    directory: path.join(__dirname, 'locales'),
    cookie: 'language',
    queryParameter: 'lang',
    updateFiles: false,
    syncFiles: false,
    objectNotation: true
});
```

## Vertaalbestanden

Vertaalbestanden bevinden zich in `web/locales/`:
- `nl.json` - Nederlandse vertalingen
- `en.json` - Engelse vertalingen

### Structuur

De vertalingen zijn georganiseerd met objectnotatie voor betere structuur:

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "logout": "Uitloggen"
  },
  "home": {
    "title": "Welkom bij Valknut",
    "subtitle": "Een krachtige Discord bot voor jouw server"
  }
}
```

## Gebruik in EJS Templates

### Basis gebruik

```ejs
<h1><%= __('home.title') %></h1>
<p><%= __('home.subtitle') %></p>
```

### Met variabelen

```ejs
<p><%= __('dashboard.welcomeBack') %>, <strong><%= user.username %></strong>!</p>
```

## Taalwisselaar

De gebruiker kan van taal wisselen via de dropdown in de navbar (rechtsboven). De gekozen taal wordt opgeslagen in een cookie voor 1 jaar.

### Route

`GET /language/:lang` - Wissel naar een andere taal (nl of en)

De route redirect terug naar de vorige pagina.

## Een nieuwe taal toevoegen

### Stap 1: Voeg de taal toe aan de configuratie

In `web/server.js`:

```javascript
i18n.configure({
    locales: ['nl', 'en', 'de'], // Voeg 'de' (Duits) toe
    // ...
});
```

### Stap 2: Maak een nieuw vertaalbestand

Maak `web/locales/de.json` aan en kopieer de structuur van `nl.json` of `en.json`. Vertaal alle waarden:

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "logout": "Abmelden"
  },
  "home": {
    "title": "Willkommen bei Valknut",
    "subtitle": "Ein leistungsstarker Discord-Bot für deinen Server"
  }
}
```

### Stap 3: Voeg de taal toe aan de navbar

In `web/views/partials/navbar.ejs`, voeg een nieuwe dropdown item toe:

```html
<li>
    <a class="dropdown-item <%= currentLang === 'de' ? 'active' : '' %>" href="/language/de">
        <img src="https://flagcdn.com/16x12/de.png" alt="Deutsch" class="me-2">
        Deutsch
    </a>
</li>
```

En update de dropdown button om de Duitse vlag te tonen wanneer die taal actief is:

```html
<% } else if (currentLang === 'de') { %>
    <img src="https://flagcdn.com/16x12/de.png" alt="Deutsch" class="me-1">
    DE
```

### Stap 4: Update de taal validator in server.js

In `web/server.js`, bij de language switcher route:

```javascript
app.get('/language/:lang', (req, res) => {
    const { lang } = req.params;
    if (['nl', 'en', 'de'].includes(lang)) { // Voeg 'de' toe
        res.cookie('language', lang, { maxAge: 365 * 24 * 60 * 60 * 1000 });
        req.setLocale(lang);
    }
    const referer = req.get('Referer') || '/';
    res.redirect(referer);
});
```

## Beschikbare vertaalsleutels

Alle beschikbare vertaalsleutels vind je in de locale bestanden. Hier zijn de belangrijkste categorieën:

- `nav.*` - Navigatiebalk items
- `home.*` - Homepage content
- `dashboard.*` - Dashboard pagina
- `guild.*` - Server management pagina
- `onboarding.*` - Onboarding instellingen
- `backups.*` - Backup management
- `admin.*` - Admin paneel
- `twofa.*` - 2FA instellingen
- `errors.*` - Foutmeldingen
- `footer.*` - Footer content
- `common.*` - Herbruikbare teksten (buttons, etc.)

## Best Practices

1. **Consistentie**: Gebruik dezelfde sleutels voor vergelijkbare acties (bijv. `common.save` voor alle "Opslaan" buttons)
2. **Organisatie**: Groepeer gerelateerde vertalingen onder dezelfde namespace
3. **Leesbaarheid**: Gebruik duidelijke sleutelnamen die de context aangeven
4. **Volledigheid**: Zorg ervoor dat alle locale bestanden dezelfde sleutels bevatten
5. **HTML lang attribuut**: Update altijd `<html lang="<%= currentLang %>">` in je templates

## Huidige taalondersteuning

| Taal | Code | Status | Vlaggen URL |
|------|------|--------|-------------|
| Nederlands | nl | ✅ Volledig | https://flagcdn.com/16x12/nl.png |
| Engels | en | ✅ Volledig | https://flagcdn.com/16x12/gb.png |

## Troubleshooting

### Vertaling niet gevonden

Als een vertaling niet wordt gevonden, toont i18n de sleutel zelf (bijv. `home.title`). Controleer:
1. Of de sleutel correct gespeld is
2. Of de sleutel bestaat in het actieve locale bestand
3. Of `objectNotation: true` is ingesteld in de configuratie

### Taal wordt niet opgeslagen

Controleer of cookies zijn ingeschakeld in de browser. De taalvoorkeur wordt opgeslagen in de `language` cookie.

### Nieuwe vertalingen worden niet geladen

Herstart de server nadat je wijzigingen hebt aangebracht in de locale bestanden. Met `npm run web:dev` zou de server automatisch herstarten.
