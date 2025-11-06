// models/recording.js
var mongoose = require('mongoose');
var db = mongoose.connection;

var Recording = db.model("Recording", {
  zip:        { type: Number },
  airQuality: { type: Number }
});

module.exports = Recording;
