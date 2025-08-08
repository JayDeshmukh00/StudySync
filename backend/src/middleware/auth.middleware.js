const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key';

/**
 * This middleware function verifies the JWT token from the request header.
 * If the token is valid, it attaches the user's ID to the request object.
 * If the token is missing or invalid, it sends a 401 Unauthorized response.
 */
const authMiddleware = (req, res, next) => {
    // Get token from the 'x-auth-token' header
    const token = req.header('x-auth-token');

    // Check if no token is provided
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // --- IMPORTANT CORRECTION ---
        // Your middleware needs to attach the 'user' object from the decoded token
        req.user = decoded.user; 
        
        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        // If token is not valid, respond with an error
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
