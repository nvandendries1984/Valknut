export function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
}

export function isOwner(req, res, next) {
    if (req.isAuthenticated() && req.user.id === process.env.OWNER_ID) {
        return next();
    }
    res.status(403).render('error', {
        title: 'Access Denied',
        error: { message: 'This page is only accessible to the bot owner' }
    });
}
