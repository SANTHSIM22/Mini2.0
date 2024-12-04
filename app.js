require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const userAuthRoutes = require('./routes/userAuth'); // User authentication routes
const workerAuthRoutes = require('./routes/workerAuth'); // Worker authentication routes
const path = require('path');
const session = require('express-session'); // Required for session management

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data from forms
app.use(express.json()); // To parse JSON data
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); // Serve uploaded images
app.use(session({
  secret: 'your-secret-key', // A secret key to sign the session ID cookie
  resave: false,             // Don't save session if unmodified
  saveUninitialized: true,   // Save uninitialized sessions
  cookie: { secure: false }  // Set to true in production when using HTTPS
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Database Connection Error:', err));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Routes
app.use('/user', userAuthRoutes); // User authentication routes
app.use('/worker', workerAuthRoutes); // Worker authentication routes

// Root Route (Home Page)
app.get('/', (req, res) => {
  res.render('first'); // Render 'first.ejs' file for the home page
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
