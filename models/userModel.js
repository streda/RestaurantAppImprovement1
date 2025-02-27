import mongoose from 'mongoose'; 
import bcrypt from "bcrypt"; 

// Define a schema for the user collection
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
});

//! Middleware: Pre-save hook to hash the password before saving the user
userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) {
        // If the password has not been modified, skip the hashing process
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
        this.password = await bcrypt.hash(this.password, salt); // Hash the password using the generated salt
        next(); // Proceed to save the document
    } catch (err) {
        next(err); // Pass any errors to the next middleware
    }
});

//! Define a custom method "comparePassword" that verifies the password
userSchema.methods.comparePassword = async function (candidatePassword) {
    // Compare the provided password with the hashed password in the database
    return bcrypt.compare(candidatePassword, this.password); 
};

// Create a Mongoose model for the "User" collection
const User = mongoose.model('User', userSchema);

// Export the User model for use in other files
export default User;