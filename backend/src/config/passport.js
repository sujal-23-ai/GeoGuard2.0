const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const { sendWelcomeEmail, sendLoginEmail } = require('../services/email.service');

const configurePassport = () => {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await User.findById(payload.sub).where({ isActive: true })
            .select('id email name role trustScore points avatarUrl');
          return done(null, user || false);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails[0].value;
            let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

            if (user) {
              user.googleId = profile.id;
              user.avatarUrl = user.avatarUrl || profile.photos[0]?.value;
              await user.save();

              // Send welcome-back email for returning Google users
              sendLoginEmail(user.email, user.name).catch(console.error);

              return done(null, user);
            }

            user = await User.create({
              email,
              name: profile.displayName,
              googleId: profile.id,
              avatarUrl: profile.photos[0]?.value,
            });
            
            // Send welcome email asynchronously
            sendWelcomeEmail(user.email, user.name).catch(console.error);

            return done(null, user);
          } catch (err) {
            return done(err, false);
          }
        }
      )
    );
  }
};

module.exports = { configurePassport };
