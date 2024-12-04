const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();
router.get('/dashboard', isAuthenticated, (req, res) => {
  const username = req.session.username; // Get username from session
  const categories = [
    { name: 'Beauty Parlor', image: '/images/beauty.jpg' },
    { name: 'Men Salon', image: '/images/men-salon.jpg' },
    { name: 'Cleaning', image: '/images/cleaning.jpg' },
    { name: 'AC', image: '/images/ac.jpg' },
  ];

  res.render('dashboard', { username, categories }); // Pass username and categories to EJS
});

// Render User Signup Page
router.get('/signup', (req, res) => {
  res.render('userSignup');
});

// Handle User Signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.send('User signup successful');
  } catch (error) {
    res.status(400).send('Error signing up user: ' + error.message);
  }
});

// Render User Login Page
router.get('/login', (req, res) => {
  res.render('userLogin');
});
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    res.redirect('/user/login'); // Redirect to login if not authenticated
  }
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }); // or Worker.findOne() for workers
    if (!user) return res.status(404).send('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).send('Invalid credentials');

    // Save user's name in the session
    req.session.userId = user._id;
    req.session.username = user.username; // Save username in the session

    res.redirect('/user/dashboard'); // Redirect to dashboard or home page after login
  } catch (error) {
    res.status(400).send('Error logging in user: ' + error.message);
  }
});
// routes/workerAuth.js
router.get('/explore/:id', async (req, res) => {
  try {
    const category = await WorkerDetails.findById(req.params.id).populate('workerId');
    if (!category) return res.status(404).send('Category not found');
    
    res.render('categoryDetails', { category });
  } catch (error) {
    res.status(400).send('Error retrieving category details: ' + error.message);
  }
});

module.exports = router;
