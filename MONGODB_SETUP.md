# MongoDB Setup Guide

This guide will help you set up MongoDB for your PLAYKERS BOOKING application.

## Option 1: Local MongoDB Installation

### Step 1: Install MongoDB Community Edition

1. **Download MongoDB Community Server**:
   - Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Select your operating system and download the installer

2. **Install MongoDB**:
   - Run the installer and follow the setup wizard
   - Choose "Complete" installation
   - Install MongoDB Compass (GUI tool) if prompted

3. **Start MongoDB Service**:
   - MongoDB should start automatically as a Windows service
   - To check: Open Services (services.msc) and look for "MongoDB"

### Step 2: Verify Installation

```bash
# Check if MongoDB is running
mongod --version

# Connect to MongoDB shell
mongosh
```

## Option 2: MongoDB Atlas (Cloud - Recommended)

### Step 1: Create MongoDB Atlas Account

1. **Sign up**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create cluster**: Choose the free tier (M0)
3. **Set up database access**: Create a username and password
4. **Set up network access**: Allow access from anywhere (0.0.0.0/0)

### Step 2: Get Connection String

1. **Click "Connect"** on your cluster
2. **Choose "Connect your application"**
3. **Copy the connection string**
4. **Replace `<password>` with your actual password**

## Step 3: Configure Environment Variables

Create or update your `.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/playkers-booking

# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/playkers-booking

# Other configurations
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret
PORT=5500
NODE_ENV=development
```

## Step 4: Start the Application

```bash
npm start
```

You should see:
```
✅ MongoDB connected successfully
Server running on http://localhost:5500
```

## Step 5: Test the Setup

1. **Register a new user** at `http://127.0.0.1:5500/signup.html`
2. **Check admin panel** at `http://localhost:5500/admin-panel`
3. **Verify data persistence** by restarting the server

## MongoDB Compass (Optional)

MongoDB Compass is a GUI for MongoDB:

1. **Download**: [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. **Install and connect** to your database
3. **Browse collections** and view your data

## Database Structure

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,
  googleId: String,
  picture: String,
  dateOfBirth: Date,
  place: String,
  source: String, // 'email' or 'google'
  signUpDate: Date,
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Connection Issues
- **Check if MongoDB is running**: `mongod --version`
- **Verify connection string**: Make sure it's correct
- **Check firewall**: Allow MongoDB port (27017)
- **Network access**: For Atlas, ensure IP is whitelisted

### Data Issues
- **Check database name**: Should be `playkers-booking`
- **Verify collections**: Should have `users` collection
- **Check indexes**: Email and Google ID should be indexed

## Backup and Restore

### Backup
```bash
mongodump --db playkers-booking --out ./backup
```

### Restore
```bash
mongorestore --db playkers-booking ./backup/playkers-booking
```

## Security Notes

- **Never commit passwords** to version control
- **Use environment variables** for sensitive data
- **Enable authentication** in production
- **Use SSL/TLS** for Atlas connections
- **Regular backups** are recommended 