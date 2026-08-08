const jwt = require('jsonwebtoken');
const config = require('./config');

function signAccessToken(user) {
    return jwt.sign({ sub: user.id, ver: user.authVersion }, config.jwtSecret, { expiresIn: '8h', issuer: 'obe-api' });
}

function createAuthMiddleware(pool) {
    return async function authenticate(req, res, next) {
        const authorization = req.get('authorization') || '';
        const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
        if (!token) return res.status(401).json({ error: 'Authentication required.' });

        let payload;
        try {
            payload = jwt.verify(token, config.jwtSecret, { issuer: 'obe-api' });
        } catch {
            return res.status(401).json({ error: 'Invalid or expired access token.' });
        }

        try {
            const result = await pool.query(
                `SELECT id, username, name, nuptk, role, permissions,
                        permissions_locked AS "permissionsLocked", active, auth_version AS "authVersion",
                        faculty_id AS "facultyId", study_program_id AS "prodiId"
                 FROM users WHERE id = $1`,
                [payload.sub]
            );
            const user = result.rows[0];
            if (!user || !user.active) return res.status(401).json({ error: 'Account is inactive or unavailable.' });
            if (payload.ver !== user.authVersion) return res.status(401).json({ error: 'Access token has been revoked.' });
            req.user = user;
            next();
        } catch (error) {
            next(error);
        }
    };
}

function requireAdministrator(req, res, next) {
    if (req.user.role !== 'administrator') {
        return res.status(403).json({ error: 'Administrator access required.' });
    }
    next();
}

module.exports = { signAccessToken, createAuthMiddleware, requireAdministrator };
