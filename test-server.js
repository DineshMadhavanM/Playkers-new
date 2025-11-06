const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5502;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5502', 'http://localhost:5502', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());

// Debug route to catch all requests
app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.url}`);
    next();
});

// API Routes
app.post('/api/register', async (req, res) => {
    console.log('🔍 Registration endpoint hit');
    console.log('📝 Request method:', req.method);
    console.log('📝 Request body:', req.body);
    
    try {
        const { name, email, password, dob, place } = req.body;
        
        // Simulate success response
        res.status(201).json({
            success: true,
            message: 'User registered successfully (test mode)',
            data: { name, email, dob, place }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
});

app.post('/api/login', async (req, res) => {
    console.log('🔍 Login endpoint hit');
    console.log('📝 Request method:', req.method);
    console.log('📝 Request body:', req.body);
    
    try {
        const { email, password } = req.body;
        
        // Simulate success response
        res.json({
            success: true,
            message: 'Login successful (test mode)',
            user: { email, name: 'Test User' }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});

app.get('/api/users', async (req, res) => {
    console.log('🔍 Users endpoint hit');
    
    try {
        // Simulate users response
        res.json([
            { id: 1, name: 'Test User 1', email: 'test1@example.com' },
            { id: 2, name: 'Test User 2', email: 'test2@example.com' }
        ]);
        
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Server error while fetching users'
        });
    }
});

// Test page route
app.get('/test-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-simple.html'));
});

// 404 handler for API routes that don't exist
app.use('/api/*', (req, res) => {
    console.log(`❌ API route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'API endpoint not found' });
});

// Static file serving - moved after API routes
app.use(express.static(path.join(__dirname)));

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log('📝 API endpoints:');
    console.log(`- POST /api/register`);
    console.log(`- POST /api/login`);
    console.log(`- GET /api/users`);
    console.log(`- GET /test-simple`);
}); 