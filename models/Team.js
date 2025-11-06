const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    playerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    playerName: {
        type: String,
        required: true
    },
    role: { 
        type: String, 
        required: true,
        enum: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper', 'Batsman/Wicket-keeper', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Raider', 'Defender', 'All-rounder', 'Captain', 'Vice Captain', 'Player'],
        default: 'Player'
    },
    joinedAt: { 
        type: Date, 
        default: Date.now 
    }
});

const teamSchema = new mongoose.Schema({
    teamName: { 
        type: String, 
        required: [true, 'Team name is required'],
        trim: true,
        unique: true,
        minlength: [3, 'Team name must be at least 3 characters long']
    },
    teamDescription: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be longer than 500 characters']
    },
    teamLogo: {
        type: String, // URL to the stored image
        default: '/images/default-team-logo.png'
    },
    sportType: {
        type: String,
        required: [true, 'Sport type is required'],
        enum: ['Cricket', 'Football', 'Kabaddi', 'Basketball', 'Volleyball', 'Other']
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    captainId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamPlayers: [teamMemberSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    matchHistory: [{
        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Match'
        },
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled', 'postponed']
        },
        date: Date,
        opponent: String,
        result: String
    }],
    stats: {
        matchesPlayed: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        matchesLost: { type: Number, default: 0 },
        matchesDrawn: { type: Number, default: 0 },
        winPercentage: { type: Number, default: 0 }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
teamSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
