const express = require("express");
const { accessChat, fetchChats, getMessages } = require("./chat.controller");
const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, accessChat);
router.get("/", protect, fetchChats);
router.get("/:chatId/messages", protect, getMessages);

module.exports = router;
