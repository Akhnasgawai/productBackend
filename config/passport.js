import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcryptjs";
import LocalStrategy from "passport-local";
import dotenv from 'dotenv';
import User from "../model/User.model.js"; // Import your User model or user data source

dotenv.config();

// Configure the JWT strategy
const jwtOptions = {
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

// Configure the local strategy
passport.use(
  new LocalStrategy.Strategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        // Find the user in the database based on the username
        const user = await User.findOne({ username: username });
        console.log("local star: " + user);

        if (!user) {
          // If the user is not found, return an error
          return done(null, false, { message: "Invalid Username" });
        }

        // Compare the provided password with the hashed password stored in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("password " + password);

        if (!isPasswordValid) {
          // If the password is incorrect, return an error
          return done(null, false, { message: "Invalid Password" });
        }

        // If the username and password are correct, return the authenticated user
        return done(null, user);
      } catch (error) {
        // If an error occurs, return the error
        return done(error);
      }
    }
  )
);

// Configure passport serialization and deserialization
passport.serializeUser((user, done) => {
  // Serialize the user ID to store in the session
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // Retrieve the user based on the serialized user ID
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

//protecting the routes using passport
passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Find the user in the database based on the payload (usually the user ID)
      const user = await User.findOne({username: payload.username});
      if (!user) {
        // If the user is not found, return an error
        return done(null, false, { message: "Invalid token" });
      }

      // If the user is found, return the authenticated user
      return done(null, user);
    } catch (error) {
      // If an error occurs, return the error
      return done(error);
    }
  })
);

export default passport;
