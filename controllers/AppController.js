import User from "../model/User.model.js";
import Product from "../model/Product.model.js";
import bcrypt from "bcryptjs";
import passport from "passport";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Otp from "../model/Otp.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import mailgen from "mailgen";

// function for registration of user
export async function register(req, res) {
  try {
    const { username, password, email, profile } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if the username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(401).json({ message: "Username already taken" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      profile,
    });

    // Save the user to the database
    await newUser.save();

    res.status(200).json({ message: "Registration Successful" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

// function for adding a product
export async function addProduct(req, res) {
  try {
    console.log(req.user.id);
    const userId = req.user.id;
    const { productName, productDescription, price } = req.body;
    const newProduct = new Product({
      productName,
      productDescription,
      price,
      userId,
    });
    await newProduct.save();
    res.status(200).json({ message: "Product Added Successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

// function for login of user
export async function login(req, res, next) {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      if (info && info.message === "Invalid Username") {
        console.log("invalid username");
        return res.status(401).json({ message: "Invalid Username" });
      } else if (info && info.message === "Invalid Password") {
        console.log("invalid password");
        return res.status(402).json({ message: "Invalid Password" });
      }
    }
    req.login(user, { session: false }, (err) => {
      if (err) {
        return next(err);
      }
      const token = generateToken(user);
      return res.json({ token });
    });
  })(req, res, next);
}

// function for generating a token while logging in
function generateToken(user) {
  const payload = {
    username: user.username,
  };
  const secretKey = process.env.JWT_SECRET; // Replace with your own secret key
  const options = {
    expiresIn: "24h", // Set the token expiration time as desired
  };
  return jwt.sign(payload, secretKey, options);
}

// function for getting the products from db
export async function getProducts(req, res) {
  try {
    // Retrieve the products from the database
    console.log(req.user.id);
    const userId = req.user.id;
    const products = await Product.find(
      { userId: userId },
      "productName productDescription price"
    );
    res.json(products);
  } catch (err) {
    console.error("Failed to fetch products", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

// function for generating the resetToken and sending the reset email to user's email
export async function generateOTP(req, res) {
  try {
    const email = req.body.email;
    const validEmail = await User.findOne({ email: email });
    if (validEmail) {
      const existEmail = await Otp.findOne({ email: email });
      if (existEmail) {
        return res.status(402).json({
          message: "Reset Link has been sent, Please Try Again After sometime",
        });
      }
      let currentTime = new Date();
      currentTime.setMinutes(currentTime.getMinutes() + 60);
      const resetToken = crypto.randomBytes(30).toString("hex");
      const expireAt = currentTime.toISOString();
      const result = new Otp({
        email,
        resetToken,
        expireAt,
      });
      const collection = await mongoose.connection.db.collection("otps"); // Replace 'users' with the actual collection name
      await collection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
      // Save the reset token to the database
      const response = await result.save();
      const resetURL = `http://localhost:3000/verify?token=${resetToken}`;
      let mailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "akhnasg@gmail.com",
          pass: "fydclpmhosuifahu",
        },
      });
      const MailGenerator = new mailgen({
        theme: "default",
        product: {
          name: "Team Products",
          link: "https://www.google.com",
        },
      });
      let mailBody = {
        body: {
          intro: "Welcome to the products team",
          action: {
            instructions: "To change the password, please click below",
            button: {
              color: "#3F51B5",
              text: "Change your password",
              link: resetURL,
            },
          },
        },
      };
      let mail = MailGenerator.generate(mailBody);
      let mailOptions = {
        from: "akhnasg@gmail.com",
        to: email,
        subject: "Reset Password Link",
        html: mail,
      };
      mailTransporter
        .sendMail(mailOptions)
        .then(() => {
          return res.status(200).json({
            message: "Email Sent Successfully",
          });
        })
        .catch((error) => {
          return res
            .status(405)
            .json({ message: "Cannot send Email, Please try again" });
        });
    } else {
      return res
        .status(403)
        .json({ message: "Email is not registered, Kindly Register" });
    }
  } catch (error) {
    res.status(401).json("Server Error");
    console.log(error);
  }
}

// function for verifying the resetToken and updating the password provided by user
export async function verifyOTP(req, res) {
  const { password } = req.body;
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  try {
    const userEmail = await Otp.findOne({ resetToken: req.params.token });
    if (userEmail) {
      User.updateOne({ email: userEmail.email }, { password: hashedPassword })
        .then((result) => {
          if (result.modifiedCount === 1) {
            return res
              .status(200)
              .json({ message: "Password Updated Successfully" });
            console.log(`Password updated for user with email '${email}'`);
          } else {
            return res
              .status(401)
              .json({ message: "No email found, please register" });
          }
        })
        .catch((error) => {
          console.log(error);
          return res
            .status(402)
            .json({ message: "Error occurred while updating password" });
        });
    } else {
      return res.status(403).json({
        message: "Forbidden Access",
      });
    }
  } catch (error) {
    return res.status(403).json({
      message: "Error occurred while updating password",
    });
  }
}

//function for logging out user
export async function logout(req, res) {
  req.logout((error) => {
    if (error) {
      // Handle any error that occurred during logout
      return res.status(500).json({ message: "Error occurred during logout" });
    }
    // Additional logout actions or response handling
    res.json({ message: "Logout successful" });
  });
}

// function for deleting a product from db
export async function deleteProduct(req, res) {
  const { id } = req.body;
  console.log("id: " + id);
  try {
    Product.deleteOne({ _id: id })
      .then((result) => {
        if (result.deletedCount === 1) {
          return res.status(200).json({ message: "Deleted Successfully" });
        } else {
          return res
            .status(401)
            .json({ message: "No product found, please try again" });
        }
      })
      .catch((error) => {
        console.log(error);
        return res
          .status(402)
          .json({ message: "Error occurred while deleting product" });
      });
  } catch (error) {
    return res.status(403).json({ message: error });
  }
}

export async function updateProduct(req, res) {
  const { id, productName, productDescription, price } = req.body;
  try {
    User.updateOne(
      { _id: id },
      {
        productName: productName,
        productDescription: productDescription,
        price: price,
      }
    )
      .then((result) => {
        if (result.modifiedCount === 1) {
          return res
            .status(200)
            .json({ message: "Product Updated Successfully" });
        } else {
          return res.status(401).json({ message: "No Products Found" });
        }
      })
      .catch((error) => {
        console.log(error);
        return res
          .status(402)
          .json({ message: "Error occurred while updating product" });
      });
  } catch (error) {
    return res
      .status(402)
      .json({ message: "Error occurred while updating product" });
  }
}
