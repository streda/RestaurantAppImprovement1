import bcrypt from "bcrypt";

const enteredPassword = "admin1"; // Replace this with what you're entering on the login form
const storedHashedPassword = "$2b$10$yrzisFubkGalsJTN9HEKge3pHs..Vn6hPz2CSjbFR/cO8u4d/.nfi"; // From MongoDB logs

bcrypt.compare(enteredPassword, storedHashedPassword, (err, result) => {
  if (result) {
    console.log("✅ Password matches!");
  } else {
    console.log("❌ Password does NOT match.");
  }
});