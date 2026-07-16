import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri)
    throw new Error("Sorry, MONGO_URI is not defined in environment variables");
  const conn = await mongoose.connect(uri);
  console.log(
    `Hey! This MongoDB Database is connected and running smoothly: ${conn.connection.host}`,
  );
};

export default connectDB;
