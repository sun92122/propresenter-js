import { generateUUID } from "../src/type.js";

const parm1 = process.argv.slice(2)[0];
try {
  // parm: [<num>] number of UUIDs to generate
  const num = parseInt(parm1 || "1", 10);
  if (isNaN(num) || num <= 0) {
    throw new Error("Invalid number of UUIDs to generate");
  }
  for (let i = 0; i < num; i++) {
    console.log(generateUUID());
  }
} catch (error: any) {
  console.log(generateUUID());
  console.error("Error:", error.message);
  process.exit(1);
}
