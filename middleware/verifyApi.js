const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'default_secret_key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ message: 'No token provided' });
    }

    const tokenParts = authHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(403).json({ message: 'Invalid token format' });
    }

    const token = tokenParts[1];

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            console.error('Token Verification Error:', err);
            return res.status(500).json({ message: 'Failed to authenticate token' });
        }

        req.userId = decoded.id;
        req.user = decoded.name;
        next();
    });
};

module.exports = authenticateToken;
