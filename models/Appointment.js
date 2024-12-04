const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
    workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    date: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String },
  });
  
  module.exports = mongoose.model('Appointment', appointmentSchema);
  