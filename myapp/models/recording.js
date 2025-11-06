const mongoose = require('mongoose');

const RecordingSchema = new mongoose.Schema({
  zip: { type: Number, required: true },
  airQuality: { type: Number, required: true }
});

module.exports = mongoose.model('Recording', RecordingSchema);
