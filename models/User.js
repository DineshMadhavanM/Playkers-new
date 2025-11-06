const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password only required if not Google OAuth user
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    picture: {
        type: String
    },
    dateOfBirth: {
        type: Date
    },
    place: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        enum: ['email', 'google'],
        default: 'email'
    },
    signUpDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual for user age
userSchema.virtual('age').get(function() {
    if (this.dateOfBirth) {
        return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }
    return null;
});

// Method to update last login
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Static method to find by email or Google ID
userSchema.statics.findByEmailOrGoogleId = function(email, googleId) {
    return this.findOne({
        $or: [
            { email: email },
            { googleId: googleId }
        ]
    });
};

module.exports = mongoose.model('User', userSchema); 