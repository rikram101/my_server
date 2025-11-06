var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var fs = require('fs').promises;
const cors = require("cors");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
// labRouter will be mounted after DB connection/migration finishes
var labRouter = require('./routes/lab');
var labRouter = require('./routes/lab');

var app = express();

// --- MongoDB / Mongoose setup & migration ---
// Use MONGO_URL env var if provided, otherwise default local DB
var mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/myappdb';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async function() {
    console.log('MongoDB connected');
    // Try to migrate any existing data.json entries into MongoDB
    try {
      var Recording = require('./models/recording');
      var dataPath = path.join(__dirname, 'data.json');
      var content = '[]';
      try { content = await fs.readFile(dataPath, 'utf8'); } catch (e) { /* file might not exist */ }
      var arr = [];
      try { arr = content ? JSON.parse(content) : []; } catch(e) { arr = []; }
      if (Array.isArray(arr) && arr.length > 0) {
        var count = await Recording.countDocuments();
        if (count === 0) {
          var toInsert = arr.map(function(e) { return { zip: Number(e.zip), airQuality: Number(e.airQuality) }; });
          await Recording.insertMany(toInsert);
          // clear data.json after successful migration
          await fs.writeFile(dataPath, JSON.stringify([], null, 2), 'utf8');
          console.log('Migrated data.json to MongoDB and cleared file.');
        } else {
          console.log('Recording collection not empty — skipping migration.');
        }
      }
    } catch (err) {
      console.error('Migration error:', err && err.message ? err.message : err);
    }
  })
  .catch(function(err) {
    console.error('MongoDB connection error:', err && err.message ? err.message : err);
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// This is to enable cross-origin access
app.use(function (req, res, next) {
   // Website you wish to allow to connect
   res.setHeader('Access-Control-Allow-Origin', '*');
   // Request methods you wish to allow
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
   // Request headers you wish to allow
   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
   // Set to true if you need the website to include cookies in the requests sent
   // to the API (e.g. in case you use sessions)
   res.setHeader('Access-Control-Allow-Credentials', true);
   // Pass to next layer of middleware
   next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/lab', labRouter);
app.use(cors());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
