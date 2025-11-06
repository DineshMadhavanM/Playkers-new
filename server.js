const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();


// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});


const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('✅ Connected to MongoDB');
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
});


// User Schema
const userSchema = new mongoose.Schema({
    googleId: { type: String, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    profilePic: String,
    dob: Date,
    place: String,
    lastLogin: Date,
    createdAt: { type: Date, default: Date.now }
});


const User = mongoose.model('User', userSchema);


// Team Model
const Team = require('./models/Team');


// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
};


// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
};


// Debug: Check users in database
async function debugUsers() {
    try {
        const count = await User.countDocuments({});
        console.log(`📊 Total users in database: ${count}`);
        if (count > 0) {
            const sampleUser = await User.findOne({});
            console.log('Sample user structure:', JSON.stringify(sampleUser, null, 2));
        }
    } catch (error) {
        console.error('Error checking users:', error);
    }
}


// Run debug on startup
debugUsers();


const app = express();
const PORT = process.env.PORT || 5502;


// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:5502', 
        'http://localhost:5502', 
        'http://localhost:5500', 
        'http://127.0.0.1:5500',
        'http://localhost:5501',  // Add this if your frontend runs on port 5501
        'http://127.0.0.1:5501'   // Add this if your frontend runs on port 5501
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Handle preflight requests
app.options('*', cors());
app.use(express.json());


// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));


// API: Search users by email
app.get('/api/users/search', async (req, res) => {
    try {
        console.log('🔍 Search request received:', {
            method: req.method,
            url: req.originalUrl,
            query: req.query,
            headers: req.headers
        });
        
        const { email } = req.query;
        
        if (!email || email.length < 2) {
            return res.status(400).json({ error: 'Please provide at least 2 characters to search' });
        }
        
        console.log('Searching for users with email/name containing:', email);
        
        // More flexible search that handles partial matches
        const searchQuery = {
            $or: [
                { email: { $regex: email, $options: 'i' } },
                { name: { $regex: email, $options: 'i' } }
            ]
        };
        
        // Only add status filter if it exists in the schema
        const userSchemaPaths = Object.keys(User.schema.paths);
        if (userSchemaPaths.includes('status')) {
            searchQuery.status = 'active';
        }
        
        console.log('MongoDB Query:', JSON.stringify(searchQuery, null, 2));
        
        const users = await User.find(searchQuery)
            .select('_id name email profilePic')
            .limit(10)
            .lean(); // Convert to plain JavaScript objects
            
        console.log('Found users:', users);
        
        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());


// Configure Passport to use the User model for sessions
passport.serializeUser((user, done) => {
    done(null, user._id);
});


passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});


// Debug route to catch all requests (at the beginning)
app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.url}`);
    next();
});


// Function to store or update user in MongoDB
async function storeUser(userData) {
    try {
        const user = await User.findOneAndUpdate(
            { $or: [
                { googleId: userData.googleId },
                { email: userData.email }
            ]},
            {
                $set: {
                    name: userData.name,
                    email: userData.email,
                    profilePic: userData.picture || userData.profilePic,
                    lastLogin: new Date()
                },
                $setOnInsert: {
                    googleId: userData.googleId,
                    createdAt: new Date()
                }
            },
            { 
                new: true, 
                upsert: true, 
                setDefaultsOnInsert: true 
            }
        );
        return user;
    } catch (error) {
        console.error('Error saving user to MongoDB:', error);
        throw error;
    }
}


// Passport configuration
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5502/auth/google/callback"
    }, async function(accessToken, refreshToken, profile, cb) {
        try {
            // Create user object from Google profile
            const userData = {
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                picture: profile.photos[0]?.value
            };
            
            // Store user in MongoDB
            const user = await storeUser(userData);
            return cb(null, user);
        } catch (error) {
            console.error('Google OAuth error:', error);
            return cb(error, null);
        }
    }));
} else {
    console.log('⚠️  Google OAuth credentials not found. Using demo mode.');
    console.log('📝 To set up real Google OAuth:');
    console.log('   1. Create a .env file in the project root');
    console.log('   2. Add: GOOGLE_CLIENT_ID=your-client-id');
    console.log('   3. Add: GOOGLE_CLIENT_SECRET=your-client-secret');
    console.log('   4. Restart the server');
}


passport.serializeUser((user, done) => {
    done(null, user);
});


passport.deserializeUser((user, done) => {
    done(null, user);
});


// Routes


// Handle GET requests to /api/register (method not allowed)
app.get('/api/register', (req, res) => {
    console.log('❌ GET request to /api/register - Method not allowed');
    res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST for registration.'
    });
});


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        
        if (user) {
            // In a real app, you should use bcrypt to compare hashed passwords
            // For now, we'll assume the password matches if user is found
            // Update last login time
            user.lastLogin = new Date();
            await user.save();
            
            res.json({
                success: true,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});


// Handle availability submissions
app.post('/api/availabilities', isAuthenticated, async (req, res) => {
    try {
        const { date, time, place, notes } = req.body;
        
        // Basic validation
        if (!date || !time || !place) {
            return res.status(400).json({
                success: false,
                error: 'Date, time, and place are required fields'
            });
        }

        // Here you would typically save to a database
        // For now, we'll just return the received data
        console.log('New availability submitted:', { date, time, place, notes });
        
        res.status(201).json({
            success: true,
            message: 'Availability saved successfully',
            data: { date, time, place, notes }
        });
    } catch (error) {
        console.error('Error saving availability:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save availability'
        });
    }
});

app.post('/api/register', async (req, res) => {
    console.log('🔍 Registration endpoint hit');
    console.log('📝 Request method:', req.method);
    console.log('📝 Request body:', req.body);
    try {
        const { name, email, password, dob, place } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        
        // Create new user
        const newUser = new User({
            name,
            email,
            password, // In a real app, hash this password
            dob,
            place
        });
        
        await newUser.save();
        
        console.log('✅ New user registered:', { email, name });
        res.status(201).json({
            success: true,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
});


// Availability route
app.post('/api/availabilities', async (req, res) => {
    try {
        const availabilityData = req.body;
        
        // For now, just log the data and return success
        console.log('Availability data received:', availabilityData);
        
        res.json({
            success: true,
            message: 'Availability saved successfully',
            data: availabilityData
        });
    } catch (error) {
        console.error('Error saving availability:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while saving availability'
        });
    }
});


// Google OAuth routes
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here') {
    app.get('/auth/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );


    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/login.html' }),
        function(req, res) {
            // Successful authentication, redirect to home page
            res.redirect('/index.html');
        }
    );
} else {
    // Demo mode - simulate Google OAuth for development
    app.get('/auth/google', (req, res) => {
        // Redirect to a demo Google sign-in page
        res.redirect('/demo-google-auth.html');
    });
    
    app.get('/auth/google/callback', async (req, res) => {
        try {
            // Create a demo user
            const demoUserData = {
                name: 'Demo Google User',
                email: 'demo@gmail.com',
                googleId: 'demo_google_user',
                picture: null
            };
            
            // Store the demo user in memory
            storeUser(demoUserData);
            
            // Redirect to home page
            res.redirect('/index.html?demo=true');
        } catch (error) {
            console.error('Demo OAuth error:', error);
            res.redirect('/login.html?error=demo_failed');
        }
    });
}


// API endpoint to get all users (for admin panel)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password') // Exclude password from response
            .sort({ createdAt: -1 }); // Sort by newest first
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Server error while fetching users'
        });
    }
});


// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});


app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});


app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel.html'));
});


app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel.html'));
});


app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-connection.html'));
});


app.get('/test-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-admin.html'));
});


app.get('/test-register', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-register.html'));
});


app.get('/debug-api', (req, res) => {
    res.sendFile(path.join(__dirname, 'debug-api.html'));
});


app.get('/test-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-simple.html'));
});


// Static file serving - moved after API routes
app.use(express.static(path.join(__dirname)));


// 404 handler for API routes that don't exist
app.use('/api/*', (req, res) => {
    console.log(`❌ API route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'API endpoint not found' });
});


// Team Routes


// Get team details by ID
app.get('/api/teams/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid team ID format' 
            });
        }
        
        const team = await Team.findById(teamId)
            .populate('captainId', 'name email profilePic')
            .populate('createdBy', 'name email')
            .populate('teamPlayers.playerId', 'name email profilePic');
            
        if (!team) {
            return res.status(404).json({ 
                success: false, 
                message: 'Team not found' 
            });
        }
        
        res.json({ 
            success: true, 
            data: team 
        });
        
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch team details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// Create a new team
app.post('/api/teams', isAuthenticated, upload.single('teamLogo'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { teamName, teamDescription, sportType, players } = req.body;
        const creatorId = req.user._id;


        // Validate authentication
        if (!creatorId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }


        // Validate required fields
        if (!teamName || !sportType) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false, 
                message: 'Team name and sport type are required' 
            });
        }


        // Parse players JSON string
        let teamPlayers = [];
        try {
            teamPlayers = JSON.parse(players || '[]');
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid players data format' 
            });
        }


        // Check if team name already exists (case insensitive)
        const existingTeam = await Team.findOne({ 
            teamName: { $regex: new RegExp(`^${teamName}$`, 'i') } 
        }).session(session);


        if (existingTeam) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false, 
                message: 'Team name already exists. Please choose a different name.' 
            });
        }


        // Verify all players exist and get their details
        const playerIds = teamPlayers.map(p => p.playerId);
        const users = await User.find({ 
            _id: { $in: playerIds } 
        }).session(session);


        if (users.length !== playerIds.length) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false, 
                message: 'One or more players not found' 
            });
        }


        // Create user map for quick lookup
        const userMap = users.reduce((acc, user) => ({
            ...acc,
            [user._id.toString()]: user
        }), {});


        // Prepare team players with names
        const formattedPlayers = teamPlayers.map(player => ({
            playerId: player.playerId,
            playerName: userMap[player.playerId]?.name || 'Unknown Player',
            role: player.role || 'Player',
            joinedAt: new Date()
        }));


        // Create team with additional fields
        const team = new Team({
            teamName,
            teamDescription: teamDescription || '',
            sportType,
            captainId: creatorId,
            teamPlayers: formattedPlayers,
            createdBy: creatorId,
            updatedBy: creatorId,
            teamLogo: req.file ? `/uploads/${req.file.filename}` : '',
            status: 'active',
            isActive: true,
            stats: {
                matchesPlayed: 0,
                matchesWon: 0,
                matchesLost: 0,
                matchesDrawn: 0,
                winPercentage: 0
            }
        });


        const savedTeam = await team.save({ session });
        await session.commitTransaction();
        session.endSession();
        
        // Populate the createdBy field with user data
        await savedTeam.populate('createdBy', 'name email');
        await savedTeam.populate('captainId', 'name email');
        
        res.status(201).json({ 
            success: true, 
            message: 'Team created successfully',
            team: savedTeam
        });


    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error creating team:', error);
        
        // Handle duplicate key error (e.g., unique team name)
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Team name already exists. Please choose a different name.' 
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Validation error',
                errors: messages 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create team',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// Player search endpoint
app.get('/api/player/search', isAuthenticated, async (req, res) => {
    try {
        const { field, query } = req.query;
        
        if (!field || !query) {
            return res.status(400).json({
                success: false,
                error: 'Both field and query parameters are required'
            });
        }


        // Define search query based on the field
        let searchQuery = {};
        
        switch (field) {
            case 'email':
                searchQuery.email = { $regex: query, $options: 'i' };
                break;
            case 'name':
                searchQuery.name = { $regex: query, $options: 'i' };
                break;
            case 'age':
                // Assuming age is stored as a number
                const age = parseInt(query);
                if (isNaN(age)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Age must be a valid number'
                    });
                }
                searchQuery.age = age;
                break;
            case 'city':
                searchQuery.place = { $regex: query, $options: 'i' };
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid search field. Must be one of: email, name, age, city'
                });
        }


        // Add status filter if it exists in the schema
        const userSchemaPaths = Object.keys(User.schema.paths);
        if (userSchemaPaths.includes('status')) {
            searchQuery.status = 'active';
        }


        // Search for users
        const users = await User.find(searchQuery)
            .select('-password -__v -createdAt -googleId') // Exclude sensitive/irrelevant fields
            .limit(50) // Limit results to prevent performance issues
            .lean();


        res.json(users);


    } catch (error) {
        console.error('Error searching players:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search players',
            details: error.message
        });
    }
});


// Serve uploaded files
app.use('/uploads', express.static(uploadDir));


// Get all teams with filtering and pagination
app.get('/api/teams', isAuthenticated, async (req, res) => {
    try {
        const { page = 1, limit = 10, sportType, search, status } = req.query;
        const skip = (page - 1) * limit;
        
        // Build query
        const query = { isActive: true };
        
        // Filter by sport type if provided
        if (sportType) {
            query.sportType = sportType;
        }
        
        // Filter by status if provided
        if (status) {
            query.status = status;
        } else {
            // Default to active teams only if no status filter
            query.status = 'active';
        }
        
        // Search by team name, description, or player names if search term provided
        if (search) {
            query.$or = [
                { teamName: { $regex: search, $options: 'i' } },
                { teamDescription: { $regex: search, $options: 'i' } },
                { 'teamPlayers.playerName': { $regex: search, $options: 'i' } }
            ];
        }
        
        // Use Promise.all for parallel execution of queries
        const [teams, total] = await Promise.all([
            Team.find(query)
                .populate('captainId', 'name email profilePic')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(parseInt(skip))
                .limit(parseInt(limit)),
            Team.countDocuments(query)
        ]);
        
        res.json({
            success: true,
            data: teams,
            pagination: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch teams',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// Get a single team by ID
app.get('/api/teams/:id', isAuthenticated, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('captainId', 'name email')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .populate('teamPlayers.playerId', 'name email profilePic');
            
        if (!team) {
            return res.status(404).json({ 
                success: false, 
                message: 'Team not found' 
            });
        }
        
        res.json({ success: true, data: team });
        
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch team',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// Update a team
app.put('/api/teams/:id', isAuthenticated, upload.single('teamLogo'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { teamName, teamDescription, sportType, players, status } = req.body;
        const userId = req.user._id;
        
        // Find the team
        const team = await Team.findById(req.params.id).session(session);
        if (!team) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ 
                success: false, 
                message: 'Team not found' 
            });
        }
        
        // Check if user is authorized to update this team
        if (team.createdBy.toString() !== userId.toString() && !req.user.isAdmin) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this team' 
            });
        }
        
        // Update team fields
        if (teamName) team.teamName = teamName;
        if (teamDescription !== undefined) team.teamDescription = teamDescription;
        if (sportType) team.sportType = sportType;
        if (status) team.status = status;
        
        // Handle logo upload if provided
        if (req.file) {
            // Delete old logo if exists
            if (team.teamLogo) {
                const oldLogoPath = path.join(__dirname, team.teamLogo);
                if (fs.existsSync(oldLogoPath)) {
                    fs.unlinkSync(oldLogoPath);
                }
            }
            team.teamLogo = `/uploads/${req.file.filename}`;
        }
        
        // Update players if provided
        if (players) {
            try {
                const playersData = JSON.parse(players);
                
                // Verify all players exist
                const playerIds = playersData.map(p => p.playerId);
                const existingPlayers = await User.find({ 
                    _id: { $in: playerIds } 
                }).session(session);
                
                if (existingPlayers.length !== playerIds.length) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ 
                        success: false, 
                        message: 'One or more players not found' 
                    });
                }
                
                // Map player data
                const userMap = existingPlayers.reduce((acc, user) => ({
                    ...acc,
                    [user._id.toString()]: user
                }), {});
                
                // Update team players
                team.teamPlayers = playersData.map(player => ({
                    playerId: player.playerId,
                    playerName: userMap[player.playerId]?.name || 'Unknown Player',
                    role: player.role || 'Player',
                    joinedAt: player.joinedAt || new Date()
                }));
                
            } catch (e) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid players data format' 
                });
            }
        }
        
        // Update timestamps
        team.updatedAt = new Date();
        team.updatedBy = userId;
        
        // Save the updated team
        await team.save({ session });
        await session.commitTransaction();
        session.endSession();
        
        // Populate the updated team
        const updatedTeam = await Team.findById(team._id)
            .populate('captainId', 'name email')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .populate('teamPlayers.playerId', 'name email profilePic');
        
        res.json({ 
            success: true, 
            message: 'Team updated successfully',
            data: updatedTeam
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error updating team:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Validation error',
                errors: messages 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update team',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// Delete a team (soft delete)
app.delete('/api/teams/:id', isAuthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const team = await Team.findById(req.params.id).session(session);
        
        if (!team) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Team not found' });
        }
        
        // Check if user is authorized (admin or team captain)
        if (team.captainId.toString() !== userId.toString() && req.user.role !== 'admin') {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this team' 
            });
        }
        
        // Update team fields
        if (teamName) team.teamName = teamName;
        if (teamDescription !== undefined) team.teamDescription = teamDescription;
        if (sportType) team.sportType = sportType;
        if (status) team.status = status;
        if (req.file) team.teamLogo = `/uploads/${req.file.filename}`;
        
        // Update players if provided
        if (players && Array.isArray(players)) {
            team.teamPlayers = players.map(player => ({
                playerId: player.playerId,
                playerName: player.playerName || 'Unknown Player',
                role: player.role || 'Player',
                joinedAt: player.joinedAt || new Date()
            }));
        }
        
        team.updatedBy = userId;
        team.updatedAt = new Date();
        
        const updatedTeam = await team.save({ session });
        await session.commitTransaction();
        session.endSession();
        
        // Populate the updated team data
        await updatedTeam.populate('captainId', 'name email');
        await updatedTeam.populate('createdBy', 'name email');
        await updatedTeam.populate('updatedBy', 'name email');
        
        res.json({ 
            success: true, 
            message: 'Team updated successfully',
            team: updatedTeam
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error updating team:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Team name already exists. Please choose a different name.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update team',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// Delete a team (soft delete)
app.delete('/api/teams/:id', isAuthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const team = await Team.findById(req.params.id).session(session);
        if (!team) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Team not found' });
        }
        
        // Check if user is authorized (admin or team captain)
        if (team.captainId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this team' 
            });
        }
        
        // Soft delete
        team.isActive = false;
        team.deletedAt = new Date();
        team.updatedBy = req.user._id;
        
        await team.save({ session });
        await session.commitTransaction();
        session.endSession();
        
        res.json({ 
            success: true, 
            message: 'Team deleted successfully' 
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error deleting team:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete team',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Google OAuth routes:');
    console.log(`- GET /auth/google (initiate OAuth)`);
    console.log(`- GET /auth/google/callback (OAuth callback)`);
    console.log(`- Admin Panel: http://localhost:${PORT}/admin-panel`);
});