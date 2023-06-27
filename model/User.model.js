import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
    username:{
        type : String,
        required : [true, "Please provide unique username"],
        unique: [true, "Username Exist"]
    },
    password: {
        type : String,
        required : [true, "Please provide password"],
        unique: false
    },
    email: {
        type: String,
        required : [true, "Please provide unique email"],
        unique: true
    },
    firstName: {type: String},
    lastName: {type: String},
    mobile: {type: Number},
    address: {type: String},
    profile: {type: String},
});

const User = mongoose.model('User', userSchema);
export default User;