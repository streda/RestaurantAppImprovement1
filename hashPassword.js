import bcrypt from "bcrypt";

async function generateHashedPassword() {
  const newPassword = "admin1"; // Choose a new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  console.log("New hashed password:", hashedPassword);
}

generateHashedPassword();