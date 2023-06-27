import { Schema, model, mongoose } from "mongoose";


export const productSchema = new Schema({
  productName: {
    type: String,
    required: [true, "Please provide product name"],
    unique: false,
  },
  productDescription: {
    type: String,
  },
  price: {
    type: Number,
    required: [true, "Please provide price"],
    unique: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const Product = mongoose.model("Product", productSchema);
export default Product;