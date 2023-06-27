import { Router } from "express";
import passport from "passport";
const router = Router();

import * as controller from "../controllers/AppController.js";

/** POST Methods */
router.route("/register").post(controller.register); // register user
router.route("/login").post(controller.login); // login the user
router.route("/logout").post(controller.logout); // logout the use
router.route("/generateOTP").post(controller.generateOTP); // generate the reset link
router.route("/verifyOTP/:token").post(controller.verifyOTP); // verify generated link and change password
router.route("/addProduct").post(
  passport.authenticate("jwt", {
    session: false,
  }),
  controller.addProduct
); // adding the product to db
router
  .route("/getProducts")
  .get(
    passport.authenticate("jwt", { session: false }),
    controller.getProducts
  ); // getting the products from the db

router
  .route("/deleteProduct")
  .post(
    passport.authenticate("jwt", { session: false }),
    controller.deleteProduct
  ); // deleting the products from the db

export default router;
