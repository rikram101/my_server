var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs').promises;

var DATA_PATH = path.join(__dirname, '..', 'data.json');

async function readData() {
  try {
    var content = await fs.readFile(DATA_PATH, 'utf8');
    if (!content) return [];
    return JSON.parse(content);
  } catch (err) {
    // If file doesn't exist or is invalid, treat as empty array
    return [];
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// GET /lab/status?zip=XXXXX
router.get('/status', async function(req, res, next) {
  var zip = req.query.zip;
  var errormsg = {"error" : "a zip code is required."};

  // validate presence and basic format (5 digits)
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json(errormsg);
  }

  var data = await readData();
  var matches = data.filter(function(entry) {
    return String(entry.zip) === String(zip);
  });

  if (!matches || matches.length === 0) {
    return res.status(400).json({"error" : "Zip does not exist in the database."});
  }

  var sum = 0;
  matches.forEach(function(m) {
    var v = parseFloat(m.airQuality);
    if (!isNaN(v)) sum += v;
  });
  var avg = sum / matches.length;
  // Truncate to two decimals using toFixed()
  var avgTrunc = avg.toFixed(2);

  // send ONLY the average value
  return res.status(200).json(avgTrunc);
});

// POST /lab/register
router.post('/register', async function(req, res, next) {
  var zip = req.body.zip;
  var airQuality = req.body.airQuality;
  var errormsg = {"error" : "zip and airQuality are required."};

  if (zip === undefined || airQuality === undefined) {
    return res.status(400).json(errormsg);
  }

  // read current data, append new entry and write back
  var data = await readData();
  var entry = { zip: zip, airQuality: Number(airQuality) };
  data.push(entry);
  await writeData(data);

  return res.status(201).json({"response" : "Data recorded."});
});

module.exports = router;
