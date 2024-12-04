const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const Worker = require('../models/Worker');
const WorkerDetails = require('../models/WorkerDetails');
const Appointment = require('../models/Appointment');
const router = express.Router();
const mongoose = require('mongoose');

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

// Middleware to check if the worker is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.workerId) {
    return next();
  } else {
    res.redirect('/worker/login'); // Redirect to login if not authenticated
  }
}

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
router.get('/details', isAuthenticated, async (req, res) => {
    const workerId = req.session.workerId; // Get worker ID from session
    
    try {
      // Fetch all appointments and include the workerId, along with appointment details
      const appointments = await Appointment.find().populate('workerId').exec(); // Populate workerId to get worker details too
      
      console.log('Appointments with worker details:', appointments); // Debug log to check the appointments
  
      // Render the worker details form and pass both appointments and workerId
      res.render('workerDetailsForm', { appointments });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).send('Error fetching appointments');
    }
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

// Render the appointment form for a specific worker
router.get('/appointment/:workerId', async (req, res) => {
  const { workerId } = req.params; // Get the workerId from the URL parameter

  try {
    // Fetch the worker's details from the database using workerId
    const worker = await WorkerDetails.findById(workerId);
    if (!worker) {
      return res.status(404).send('Worker not found');
    }

    // Render the appointment form and pass the worker details
    res.render('appointmentForm', { worker });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching worker details');
  }
});

// Inside workerAuth.js (or the file where you handle appointment creation)
router.post('/appointment/:workerId', async (req, res) => {
    const { workerId } = req.params;
    const { address, date, appointmentTime, phoneNumber, message, email, name } = req.body;
  
    // Log the appointment data before saving it
    console.log('Saving new appointment:', {
      workerId,
      name,
      address,
      date,
      appointmentTime,
      phoneNumber,
      message,
      email
    });
  
    try {
      const newAppointment = new Appointment({
        workerId: workerId, // Ensure workerId is passed as ObjectId
        name,
        address,
        date,
        appointmentTime,
        phoneNumber,
        message,
        email
      });
  
      await newAppointment.save();
  
      res.redirect('/user/dashboard');  // Redirect after saving
    } catch (error) {
      console.error(error);
      res.status(500).send('Error submitting the appointment');
    }
  });
  

  router.get('/appointments', async (req, res) => {
    console.log('Fetching all appointments'); // Debug log to indicate fetching all appointments
    
    try {
        // Fetch all appointments (without filtering by workerId)
        const appointments = await Appointment.find().exec();
        console.log('Appointments:', appointments); // Debug log to check if appointments are fetched
        
        // Render the appointments page and pass the appointments data
        res.render('workerDetailsForm', { appointments });  // Pass appointments data here
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching appointments');
    }
});


// Render worker dashboard and fetch appointments
router.get('/dashboard', isAuthenticated, async (req, res) => {
  const workerId = req.session.workerId; // Get workerId from session

  try {
    // Fetch appointments for the logged-in worker
    const appointments = await Appointment.find({ workerId }).populate('workerId', 'name'); // Optionally populate worker data like 'name'

    // Render the worker dashboard with appointment data
    res.render('workerDetailsDashboard', { appointments });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching appointments');
  }
});

module.exports = router;
