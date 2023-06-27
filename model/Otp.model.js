import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required : true,
        unique: false
    },
    resetToken: {type: String},
    expireAt: {type: Date}
});

const Otp = mongoose.model('Otp', userSchema);
export default Otp;