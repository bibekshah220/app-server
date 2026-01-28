const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../modules/auth/user.model");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
      callbackURL: "/api/v1/auth/google/callback",
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          return done(null, user);
        }

        // If not, create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: Math.random().toString(36).slice(-8), // Dummy password
          role: "buyer",
          isVerified: true,
        });

        done(null, user);
      } catch (err) {
        console.error(err);
        done(err, null);
      }
    },
  ),
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID || "dummy",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "dummy",
      callbackURL: "/api/v1/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails"],
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails
          ? profile.emails[0].value
          : `${profile.id}@facebook.com`;
        let user = await User.findOne({ email });

        if (user) {
          return done(null, user);
        }

        user = await User.create({
          name: profile.displayName,
          email: email,
          password: Math.random().toString(36).slice(-8),
          role: "buyer",
          isVerified: true,
        });

        done(null, user);
      } catch (err) {
        console.error(err);
        done(err, null);
      }
    },
  ),
);

module.exports = passport;
