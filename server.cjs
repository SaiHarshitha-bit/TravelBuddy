const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/../public'));

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// 1. Connect to Database
mongoose.connect('mongodb://127.0.0.1:27017/travelBuddyDB')
    .then(() => console.log("✅ Success: Database Connected"))
    .catch(err => console.log("❌ Database Error:", err));

// 2. User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// 3. FRONT DOOR
app.get('/', (req, res) => {
    res.send("Startup Test Version 2!");
});

// 4. GET all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'email username');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch users" });
    }
});

// 5. NEW: Signup with /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = new User({ 
            email, 
            username: username || email,
            password: hashedPassword,
            isAdmin: false
        });
        
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            message: "Account created successfully",
            token,
            user: {
                _id: newUser._id,
                email: newUser.email,
                username: newUser.username,
                isAdmin: newUser.isAdmin
            }
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Signup failed" });
    }
});

// 6. NEW: Login with /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ 
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Login failed" });
    }
});

// LEGACY ENDPOINTS (for backward compatibility)
app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({ email: req.body.email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Created" });
    } catch (err) { 
        res.status(400).json({ message: "Exists" }); 
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            res.json({ message: "Success" });
        } else { 
            res.status(400).json({ message: "Fail" }); 
        }
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
});

app.listen(5000, '127.0.0.1', () => {
    console.log("🚀 Server running on http://127.0.0.1:5000");
});
