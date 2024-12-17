const express = require("express");
const router = express.Router();

const indexRouter = require("./routes/index");

/* GET home page. */
router.use("/", indexRouter);

module.exports = router;
