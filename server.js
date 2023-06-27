import express from "express";
import cors from "cors";
import morgan from "morgan";
import connect from "./database/conn.js";
import session from "express-session";
import router from "./router/route.js";
import passport from "./config/passport.js";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 8080;
const secretKey = crypto.randomBytes(32).toString("hex");

/** middle wares */
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("tiny"));
app.disable("x-powered-by");
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
      secret: secretKey,
      resave: false,
      saveUninitialized: false
    })
  );

app.use(cookieParser());

/** Configure Passport */
app.use(passport.initialize());
app.use(passport.session());
// app.use(passport.authenticate('jwt', { session: false }));

/** HTTP GET Request */
app.get("/", (req, res) => {
  res.status(201).json("Home GET Request");
});

/** api routes */
app.use("/api", router);

/** start server only when we have valid connection  */
connect()
  .then(() => {
    try {
      app.listen(port, () => {
        console.log(`Server connected to http://localhost:${port}`);
      });
    } catch (error) {
      console.log("Cannot connect to the server");
    }
  })
  .catch((error) => {
    console.log("Invalid database connection");
  });

