import mongoose from 'mongoose'; // Import Mongoose for MongoDB interactions
import bcrypt from "bcrypt"; // Import bcrypt library for password hashing

// Define a schema for the user collection
const userSchema = new mongoose.Schema({
    username: { 
        type: String, // Field type: String for the username
        required: true, // Field is mandatory
        unique: true // Field must be unique across the collection
    },
    password: { 
        type: String, // Field type: String for the hashed password
        required: true // Field is mandatory
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

// //! Define a custom method "comparePassword" that verifies the password
// userSchema.methods.comparePassword = async function (candidatePassword) {
//     return bcrypt.compare(candidatePassword, this.password); 
//     // Compare the provided password with the hashed password in the database
// };

userSchema.methods.comparePassword = async function (candidatePassword) {
    console.log("Entered password:", candidatePassword);
    console.log("Stored hashed password:", this.password);

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("Password match result:", isMatch);

    return isMatch;
};

// Create a Mongoose model for the "User" collection
const User = mongoose.model('User', userSchema);

// Export the User model for use in other files
export default User;