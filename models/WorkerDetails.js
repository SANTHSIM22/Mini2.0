// models/WorkerDetails.js
const mongoose = require('mongoose');

const workerDetailsSchema = new mongoose.Schema({
  category: String,
  name: String,
  title: String,
  imageUrl: String,
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }, // Link to worker
  address: String,
});

const WorkerDetails = mongoose.model('WorkerDetails', workerDetailsSchema);

module.exports = WorkerDetails;
