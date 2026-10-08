import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDb() {
  // fail fast (3s) instead of hanging if MongoDB is not running
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
}

export const dbConnected = () => mongoose.connection.readyState === 1;
