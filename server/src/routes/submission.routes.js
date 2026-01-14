const express = require("express");
const { submitTask } = require("../controllers/submission.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", auth, submitTask);

module.exports = router;
