import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../src/config/config.js';
import { connectDatabase } from '../src/utils/database.js';
import { logger } from '../src/utils/logger.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import apiRoutes from './routes/api.js';
import { Client, GatewayIntentBits } from 'discord.js';

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
        intents: [GatewayIntentBits.Guilds]
    });
    await discordClient.login(process.env.DISCORD_TOKEN);
    app.set('discordClient', discordClient);
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
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'valknut-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
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

// Make user available in all views
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api', apiRoutes);

// Home page
app.get('/', (req, res) => {
    res.render('index', {
        title: config.botName,
        user: req.user
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
