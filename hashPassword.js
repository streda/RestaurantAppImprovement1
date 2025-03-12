import bcrypt from "bcrypt";

async function hashPassword() {
  const newPassword = "newPassword123"; 
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
}

hashPassword();