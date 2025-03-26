// dedupeMenuData.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "./public/data.js");
const backupPath = path.join(
  __dirname,
  `./public/data.backup.${Date.now()}.js`
);

// Load the data.js file as a string
let fileContents = fs.readFileSync(dataPath, "utf-8");

// Extract the array using a regex (assumes export const menuArray = [ ... ]; format)
const arrayMatch = fileContents.match(/export const menuArray = (\[.*\]);/s);
if (!arrayMatch) {
  console.error("❌ Could not find 'menuArray' in data.js");
  process.exit(1);
}

let menuArray;
try {
  // Convert the array string to real JavaScript object
  menuArray = eval(arrayMatch[1]);
} catch (e) {
  console.error("❌ Failed to parse menuArray from data.js", e);
  process.exit(1);
}

// Deduplicate based on name + ingredients + price + type
const seen = new Set();
const dedupedArray = menuArray.filter((item) => {
  const key = `${item.name}|${item.ingredients.join(",")}|${item.price}|${item.type}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Convert deduped array back to JS export format
const newFileContent = `export const menuArray = ${JSON.stringify(dedupedArray, null, 4)};\n`;

// Backup the original
fs.copyFileSync(dataPath, backupPath);
console.log(`📦 Backup saved to ${backupPath}`);

// Write the cleaned file
fs.writeFileSync(dataPath, newFileContent);
console.log("✅ data.js successfully updated with deduplicated menu items.");


// // dedupeMenuData.js
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// // Define paths
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const dataPath = path.join(__dirname, "./public/data.js"); // Corrected path
// const backupPath = path.join(
//   __dirname,
//   `./public/data.backup.${Date.now()}.js`
// );

// // Load the data.js file as a string
// try {
//     fs.accessSync(dataPath, fs.constants.F_OK);
//     console.log('File exists');
//   } catch (err) {
//     console.error('File does not exist', err);
//     process.exit(1);
//   }

// let fileContents = fs.readFileSync(dataPath, "utf-8");

// // Extract the array using a regex (assumes export const menuArray = [ ... ]; format)
// // Adjusted regex to be more tolerant of whitespace
// const arrayMatch = fileContents.match(/export\s+const\s+menuArray\s*=\s*(\[\s*[\s\S]*?\]);/);

// if (!arrayMatch) {
//   console.error("❌ Could not find 'menuArray' in data.js");
//   console.log("File Contents:", fileContents); // Debug: print the file content
//   process.exit(1);
// }

// let menuArray;
// try {
//   // Convert the array string to real JavaScript object
//   menuArray = eval(arrayMatch[1]);
// } catch (e) {
//   console.error("❌ Failed to parse menuArray from data.js", e);
//   console.error("Error details:", e); // More detailed error info
//   process.exit(1);
// }

// // Deduplicate based on name + ingredients + price + type
// const seen = new Set();
// const dedupedArray = menuArray.filter((item) => {
//   const key = `${item.name}|${item.ingredients.join(",")}|${item.price}|${item.type}`;
//   if (seen.has(key)) return false;
//   seen.add(key);
//   return true;
// });

// // Convert deduped array back to JS export format
// const newFileContent = `export const menuArray = ${JSON.stringify(dedupedArray, null, 4)};\n`;

// // Backup the original
// fs.copyFileSync(dataPath, backupPath);
// console.log(`📦 Backup saved to ${backupPath}`);

// // Write the cleaned file
// fs.writeFileSync(dataPath, newFileContent);
// console.log("✅ data.js successfully updated with deduplicated menu items.");

// // dedupeMenuData.js
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// // Define paths
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const dataPath = path.join(__dirname, "./public/data.js");
// const backupPath = path.join(
//   __dirname,
//   `./public/data.backup.${Date.now()}.js`
// );

// // Load the data.js file as a string
// try {
//     fs.accessSync(dataPath, fs.constants.F_OK);
//     console.log('File exists');
//   } catch (err) {
//     console.error('File does not exist', err);
//     process.exit(1);
//   }

// let fileContents = fs.readFileSync(dataPath, "utf-8");

// // Extract the array using a regex (assumes export const menuArray = [ ... ]; format)
// // Adjusted regex to be even more flexible
// const arrayMatch = fileContents.match(/export\s+const\s+menuArray\s*=\s*([^\n]*)\s*(\[\s*[\s\S]*?\]);/);


// if (!arrayMatch) {
//   console.error("❌ Could not find 'menuArray' in data.js");
//   console.log("File Contents:", fileContents); // Debug: print the file content
//   process.exit(1);
// }

// let menuArray;
// try {
//   // Convert the array string to real JavaScript object
//   menuArray = eval(arrayMatch[2]); // Important: Use arrayMatch[2] now
// } catch (e) {
//   console.error("❌ Failed to parse menuArray from data.js", e);
//   console.error("Error details:", e); // More detailed error info
//   process.exit(1);
// }

// // Deduplicate based on name + ingredients + price + type
// const seen = new Set();
// const dedupedArray = menuArray.filter((item) => {
//   const key = `${item.name}|${item.ingredients.join(",")}|${item.price}|${item.type}`;
//   if (seen.has(key)) return false;
//   seen.add(key);
//   return true;
// });

// // Convert deduped array back to JS export format
// const newFileContent = `export const menuArray = ${JSON.stringify(dedupedArray, null, 4)};\n`;

// // Backup the original
// fs.copyFileSync(dataPath, backupPath);
// console.log(`📦 Backup saved to ${backupPath}`);

// // Write the cleaned file
// fs.writeFileSync(dataPath, newFileContent);
// console.log("✅ data.js successfully updated with deduplicated menu items.");

// // dedupeMenuData.js
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// // Define paths
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const dataPath = path.join(__dirname, "./public/data.js");
// const backupPath = path.join(
//   __dirname,
//   `./public/data.backup.${Date.now()}.js`
// );

// // Load the data.js file as a string
// let fileContents = fs.readFileSync(dataPath, "utf-8");

// // Extract the array using a regex (assumes export const menuArray = [ ... ]; format)
// const arrayMatch = fileContents.match(/export const menuArray\s*=\s*(\[\s*[\s\S]*?\]);/);
// if (!arrayMatch) {
//   console.error("❌ Could not find 'menuArray' in data.js");
//   process.exit(1);
// }

// let menuArray;
// try {
//   // Convert the array string to real JavaScript object
//   menuArray = eval(arrayMatch[1]);
// } catch (e) {
//   console.error("❌ Failed to parse menuArray from data.js", e);
//   process.exit(1);
// }

// // Deduplicate based on name + ingredients + price + type
// const seen = new Set();
// const dedupedArray = menuArray.filter((item) => {
//   const key = `${item.name}|${item.ingredients.join(",")}|${item.price}|${item.type}`;
//   if (seen.has(key)) return false;
//   seen.add(key);
//   return true;
// });

// // Convert deduped array back to JS export format
// const newFileContent = `export const menuArray = ${JSON.stringify(dedupedArray, null, 4)};\n`;

// // Backup the original
// fs.copyFileSync(dataPath, backupPath);
// console.log(`📦 Backup saved to ${backupPath}`);

// // Write the cleaned file
// fs.writeFileSync(dataPath, newFileContent);
// console.log("✅ data.js successfully updated with deduplicated menu items.");
