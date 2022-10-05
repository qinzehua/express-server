let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

let static = require('./static');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let uploadRouter = require('./routes/upload');

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(urlencodedParser);
app.use(jsonParser);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(static(path.join(__dirname, 'public')));

app.use('*', indexRouter);
app.use('/users', usersRouter);
app.use('/gists', uploadRouter);

module.exports = app;
