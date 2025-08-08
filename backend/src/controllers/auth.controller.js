const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key';

// =================================================================
// --- NEW FUNCTION: Add this to your controller ---
// This function gets the data for the currently logged-in user.
exports.getMe = async (req, res) => {
    try {
        // The user's ID is attached to the request object by the auth middleware.
        // We find the user by their ID and exclude the password from the result.
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('GetMe Error:', err.message);
        res.status(500).send('Server Error');
    }
};
// =================================================================


// --- Your existing signup function (UNCHANGED) ---
exports.signup = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User with this email already exists' });

        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Note: The payload here should contain the user object for the middleware
        const payload = { user: { id: user.id } }; 
        jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).send('Server error');
    }
};

// --- Your existing login function (UNCHANGED) ---
exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password.' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Note: The payload here should contain the user object for the middleware
        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).send('Server error');
    }
};
