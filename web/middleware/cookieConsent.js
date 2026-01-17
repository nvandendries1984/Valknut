import { logger } from '../../src/utils/logger.js';

/**
 * Middleware to check if user has accepted cookies before allowing login
 */
export function requireCookieConsent(req, res, next) {
    const consent = req.cookies.cookie_consent;

    if (!consent || consent !== 'accepted') {
        logger.warn(`Login attempt without cookie consent from IP: ${req.ip}`);
        return res.redirect('/?error=consent_required');
    }

    next();
}

/**
 * Middleware to check cookie consent for all authenticated routes
 */
export function checkCookieConsent(req, res, next) {
    if (req.isAuthenticated()) {
        const consent = req.cookies.cookie_consent;

        if (!consent || consent !== 'accepted') {
            logger.warn(`User ${req.user.username} lost cookie consent, logging out`);
            req.logout((err) => {
                if (err) {
                    logger.error('Logout error:', err);
                }
                return res.redirect('/?error=consent_revoked');
            });
            return;
        }
    }

    next();
}

export default {
    requireCookieConsent,
    checkCookieConsent
};
