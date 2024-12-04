const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const Worker = require('../models/Worker');
const WorkerDetails = require('../models/WorkerDetails'); // Ensure you have a model for worker details

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Path to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  }
});

const upload = multer({ storage });

// Render worker signup form
router.get('/signup', (req, res) => {
  res.render('workerSignup'); // Ensure 'workerSignup.ejs' exists in the 'views' folder
});

// Handle worker signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newWorker = new Worker({ username, email, password: hashedPassword });
    await newWorker.save();
    res.send('Worker signup successful');
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send('Email is already registered. Please use a different email.');
    } else {
      res.status(400).send('Error signing up worker: ' + error.message);
    }
  }
});

// Render worker login form
router.get('/login', (req, res) => {
  res.render('workerLogin'); // Ensure 'workerLogin.ejs' exists in the 'views/' folder
});

// Handle worker login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const worker = await Worker.findOne({ email });
    if (!worker) return res.status(404).send('Worker not found');

    const isPasswordValid = await bcrypt.compare(password, worker.password);
    if (!isPasswordValid) return res.status(401).send('Invalid credentials');

    // Save worker's session and redirect to dashboard
    req.session.workerId = worker._id;
    res.redirect('/worker/details');
  } catch (error) {
    res.status(400).send('Error logging in worker: ' + error.message);
  }
});

// Middleware to check if the worker is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.workerId) {
    return next();
  } else {
    res.redirect('/worker/login'); // Redirect to login if not authenticated
  }
}

// Render Worker Details Dashboard (protected route)
router.get('/details', isAuthenticated, (req, res) => {
  res.render('workerDetailsForm'); // Ensure this file exists in the 'views/' folder
});

// Handle Worker Details Submission
router.post('/details', isAuthenticated, upload.single('image'), async (req, res) => {
  const { category, name, address, title } = req.body;
  const imageUrl = `/uploads/${req.file.filename}`; // Generate URL for the image
  const workerId = req.session.workerId; // Get worker ID from session

  try {
    const workerDetails = new WorkerDetails({
      category,
      name,
      address,
      title,
      imageUrl,
      workerId
    });
    await workerDetails.save();
    res.send('Worker details submitted successfully!');
  } catch (error) {
    res.status(400).send('Error saving worker details: ' + error.message);
  }
});
// Render explore page by category
router.get('/explore/:categoryName', async (req, res) => {
    const { categoryName } = req.params; // Get the category name from URL parameter
  
    try {
      // Query the database to get workers with the matching category
      const workersInCategory = await WorkerDetails.find({ category: categoryName });
  
      // Render the explore categories page and pass the filtered workers and category name
      res.render('exploreCategories', { categoryName, workersInCategory });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving workers for this category');
    }
  });
  

module.exports = router;
