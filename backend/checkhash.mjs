import mongoose from "mongoose";

const conn = await mongoose.createConnection("mongodb://127.0.0.1:27017/pte_master");
const u = await conn.collection("users").findOne({ email: "admin@ptemaster.com" });
const pw = String(u.password);
console.log("hashed (bcrypt):", pw.startsWith("$2"));
console.log("hash prefix:", pw.slice(0, 7));
console.log("plaintext present:", pw.includes("lE(zcEzC8+nR6(9Z"));
await conn.close();
process.exit(0);