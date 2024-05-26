// models/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },

    // using bcrypt to hash passwords is better
    password: { 
        type: String, 
        required: true 
    }, 

});

const User = mongoose.model('User', userSchema);

export default User;
