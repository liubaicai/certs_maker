const createError = require("http-errors");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const cookieParser = require("cookie-parser");
const lessMiddleware = require("less-middleware");
const logger = require("morgan");
const fileUpload = require('express-fileupload');

const router = require("./router/index");

const publicPath = path.join(__dirname, "../public");

const environment = process.env.NODE_ENV || "development";
const isDevelopment = environment === "development";

const app = express();

if (isDevelopment) {
  const livereload = require("livereload");
  const connectLivereload = require("connect-livereload");
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(publicPath);
  liveReloadServer.server.once("connection", (e) => {
    setTimeout(() => {
      liveReloadServer.refresh("*");
    }, 10);
  });
  app.use(connectLivereload());
}

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(publicPath));
app.use(express.static(publicPath));
app.use(fileUpload({
  createParentPath: true,
  useTempFiles: true
}));

app.use(router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("pages/error");
});

module.exports = app;
