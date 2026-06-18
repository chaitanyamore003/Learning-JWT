import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not Present");

const config = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
};

export default config;
