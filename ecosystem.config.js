module.exports = {
    apps : [{
      name   : "mkcert",
      script : "node index.js",
      env: {
          "NODE_ENV": "production",
          "HOST": "0.0.0.0",
          "PORT": 80
      }
    }]
  }