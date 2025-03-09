import bcrypt from "bcrypt";

async function hashPassword() {
  const newPassword = "newPassword123"; // Change this to the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  console.log("New Hashed Password:", hashedPassword);
}

hashPassword();

//* Run this script using:  node hashPassword.js   in this directory terminal