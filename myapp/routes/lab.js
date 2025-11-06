var express = require('express');
var router = express.Router();
var Recording = require('../models/recording');

// GET /lab/status?zip=XXXXX
router.get('/status', async function(req, res, next) {
  var zip = req.query.zip;
  var errormsg = {"error" : "a zip code is required."};

  // validate presence and basic format (5 digits)
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json(errormsg);
  }

  try {
    // Use aggregation to compute average in the database
    var result = await Recording.aggregate([
      { $match: { zip: Number(zip) } },
      { $group: { _id: null, avgAQ: { $avg: '$airQuality' } } }
    ]);

    if (!result || result.length === 0) {
      return res.status(400).json({"error" : "Zip does not exist in the database."});
    }

    var avg = result[0].avgAQ;
    var avgTrunc = avg.toFixed(2);
    return res.status(200).json(avgTrunc);
  } catch (err) {
    return next(err);
  }
});

// POST /lab/register
router.post('/register', async function(req, res, next) {
  var zip = req.body.zip;
  var airQuality = req.body.airQuality;
  var errormsg = {"error" : "zip and airQuality are required."};

  if (zip === undefined || airQuality === undefined) {
    return res.status(400).json(errormsg);
  }

  try {
    // coerce numeric values
    var entry = { zip: Number(zip), airQuality: Number(airQuality) };
    await Recording.create(entry);
    return res.status(201).json({"response" : "Data recorded."});
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
