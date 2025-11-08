import mongoose from "mongoose";
const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.DB_URL_LOCAL);
    console.log("Database connected successfully!");
  } catch (error) {
    console.log("Database connection failed!!", error);
    throw error;
  }
};

export default dbConnection;
