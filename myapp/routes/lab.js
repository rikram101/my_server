var express = require('express');
var router = express.Router();
var Recording = require('../models/recording');

// GET /lab/status?zip=XXXXX
router.get('/status', async function(req, res) {
  var zip = (req.query.zip || '').trim();
  var errormsg = {"error" : "a zip code is required."};

  // validate presence and basic format (5 digits)
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json(errormsg);
  }

  try {
    // Compute average in DB
    var result = await Recording.aggregate([
      { $match: { zip: Number(zip) } },
      { $group: { _id: null, avgAQ: { $avg: '$airQuality' } } }
    ]);

    if (!result || result.length === 0) {
      return res.status(400).json({"error" : "Zip does not exist in the database."});
    }

    var avgTrunc = Number(result[0].avgAQ).toFixed(2);
    return res.status(200).json(avgTrunc); // returned alone, per spec
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

// POST /lab/register
router.post('/register', async function(req, res) {
  var zip = req.body.zip;
  var airQuality = req.body.airQuality;
  var errormsg = {"error" : "zip and airQuality are required."};

  if (zip === undefined || airQuality === undefined) {
    return res.status(400).json(errormsg);
  }

  try {
    // coerce & validate numeric
    var z = Number(zip);
    var aq = Number(airQuality);
    if (!Number.isFinite(z) || !Number.isFinite(aq)) {
      return res.status(400).json(errormsg);
    }

    await Recording.create({ zip: z, airQuality: aq });
    return res.status(201).json({ "response" : "Data recorded." });
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
