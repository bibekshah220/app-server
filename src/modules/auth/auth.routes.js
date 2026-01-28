const express = require("express");
const passport = require("passport");
const { register, login, getMe, logout } = require("./auth.controller");
const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", protect, getMe);

// Social Auth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = req.user.getSignedJwtToken();
    res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:5173"}/login?token=${token}`,
    );
  },
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] }),
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = req.user.getSignedJwtToken();
    res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:5173"}/login?token=${token}`,
    );
  },
);

module.exports = router;
