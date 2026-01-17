import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { Strategy as DiscordStrategy } from 'passport-discord';
import path from 'path';
import { fileURLToPath } from 'url';
import i18n from 'i18n';
import { config } from '../src/config/config.js';
import { connectDatabase } from '../src/utils/database.js';
import { logger } from '../src/utils/logger.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import twofaRoutes from './routes/twofa.js';
import { checkCookieConsent } from './middleware/cookieConsent.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { AllowedUser } from '../src/models/AllowedUser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEB_PORT || 16016;

// Connect to database
await connectDatabase();

// Connect Discord client (read-only for fetching guild data)
let discordClient = null;
try {
    discordClient = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
    });
    await discordClient.login(process.env.DISCORD_TOKEN);
    app.set('client', discordClient); // Store as 'client' for admin routes
    logger.info('Discord client connected for web dashboard');
} catch (error) {
    logger.warn('Could not connect Discord client for web dashboard');
}

// Passport Discord Strategy
passport.use(new DiscordStrategy({
    clientID: config.clientId,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || `http://localhost:${PORT}/auth/callback`,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    // Attach access token to profile for API calls
    profile.accessToken = accessToken;
    logger.info(`User authenticated: ${profile.username} (${profile.id})`);
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// i18n configuration
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

app.use(i18n.init);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'valknut-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://admin:Pasja@2025@mongo:27017/valknut?authSource=admin',
        touchAfter: 24 * 3600 // Lazy session update (seconds)
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        secure: false, // Set to false for HTTP
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user and bot info available in all views
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.botUser = discordClient?.user || null;
    res.locals.botName = config.botName;
    res.locals.__ = res.__;
    res.locals.currentLang = req.getLocale();
    next();
});

// Check cookie consent for authenticated users
app.use(checkCookieConsent);

// Check 2FA status for all authenticated requests
app.use(async (req, res, next) => {
    if (req.isAuthenticated()) {
        try {
            const allowedUser = await AllowedUser.findOne({ userId: req.user.id });
            res.locals.twoFactorEnabled = allowedUser?.twoFactorEnabled || false;
        } catch (error) {
            res.locals.twoFactorEnabled = false;
        }
    } else {
        res.locals.twoFactorEnabled = false;
    }
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/auth/2fa', twofaRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Language switcher
app.get('/language/:lang', (req, res) => {
    const { lang } = req.params;
    if (['nl', 'en'].includes(lang)) {
        res.cookie('language', lang, { maxAge: 365 * 24 * 60 * 60 * 1000 }); // 1 year
        req.setLocale(lang);
    }
    const referer = req.get('Referer') || '/';
    res.redirect(referer);
});

// Home page
app.get('/', (req, res) => {
    res.render('index', {
        title: config.botName,
        user: req.user,
        query: req.query
    });
});

// Privacy Policy page
app.get('/privacy', (req, res) => {
    res.render('privacy', {
        title: 'Privacybeleid',
        user: req.user,
        botName: config.botName
    });
});

// Terms of Service page
app.get('/terms', (req, res) => {
    res.render('terms', {
        title: 'Gebruiksvoorwaarden',
        user: req.user,
        botName: config.botName
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error(`Web error: ${err.message}`);
    res.status(500).render('error', {
        title: 'Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
app.listen(PORT, () => {
    logger.success(`Web dashboard started on port ${PORT}`);
    logger.info(`Visit: http://localhost:${PORT}`);
});

export default app;
