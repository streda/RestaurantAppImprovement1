// models/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },  // Consider using bcrypt to hash passwords
    // Add other fields as needed
});

const User = mongoose.model('User', userSchema);

export default User;
