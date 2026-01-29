const express = require("express");
const { getNearbyItems } = require("./discovery.controller");

const router = express.Router();

router.get("/nearby", getNearbyItems);

module.exports = router;
