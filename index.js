#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require("./src/app");
const debug = require("debug")("express_startkit:server");
const http = require("http");
const mkcertManager = require("./src/utils/mkcert");

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const host = process.env.HOST || "localhost";
app.set("host", host);

/**
 * Create HTTP server.
 */
async function startServer() {
  const hasMkcert = await mkcertManager.checkMkcertExists();
  if (!hasMkcert) {
      console.error("Error: mkcert is required but not installed.");
      console.error("Please install mkcert first: https://github.com/FiloSottile/mkcert#installation");
      process.exit(1);
  }

  const server = http.createServer(app);
  server.listen(port, host);
  server.on("error", onError);
  server.on("listening", onListening);
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const bind = `http://${host}:${port}`;
  debug("Listening on " + bind);
}

startServer();