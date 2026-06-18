import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not Present");
if (!process.env.PORT) throw new Error("Port not Defined");
if (!process.env.JWT_SECRET)
  throw new Error("JWT_SECRET is not defined in the eviroment variables");

const config = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
};

export default config;
