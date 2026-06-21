const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to Database
mongoose.connect('mongodb://127.0.0.1:27017/travelBuddyDB')
    .then(() => console.log("✅ Success: Database Connected"))
    .catch(err => console.log("❌ Database Error:", err));

// 2. User Setup
const User = mongoose.model('User', new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

// 3. FRONT DOOR: This is why http://127.0.0.1:5000/ says "Backend is running!"
app.get('/', (req, res) => {
    res.send("Startup Test Version 2!");
});

// 4. THE FIX: Adding the missing door so /users stops giving an error!
app.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'email');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch users" });
    }
});

// 5. Signup Map
app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({ email: req.body.email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Created" });
    } catch (err) { res.status(400).json({ message: "Exists" }); }
});

// 6. Login Map
app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        res.json({ message: "Success" });
    } else { res.status(400).json({ message: "Fail" }); }
});

app.listen(5000, '127.0.0.1', () => {
    console.log("🚀 Server running on http://127.0.0.1:5000");
});
