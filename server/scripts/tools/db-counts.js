// READ-ONLY: counts documents per collection in the database named by MONGO_URI. Never writes.
import mongoose from "mongoose";
await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
const db = mongoose.connection.db;
const out = {};
for (const c of (await db.listCollections().toArray()).map((x) => x.name).sort()) out[c] = await db.collection(c).countDocuments();
console.log(mongoose.connection.name, JSON.stringify(out));
await mongoose.disconnect();
