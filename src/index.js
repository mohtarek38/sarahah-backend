import "dotenv/config";
import express from "express";
import dbConnection from "./DB/db.connection.js";
import { rateLimit } from "express-rate-limit";
import { authLimiter, sendMessageLimiter, generalLimiter } from "./Utils/utils.barrel.js";
import { authController, userController, messageController } from "./Modules/controllers.barrel.js";
import cors from "cors";
import helmet from "helmet";

const app = express();

// check env variables
if (!process.env.PORT) {
  console.error("PORT is not defined in environment variables");
  process.exit(1);
}

// TRUST PROXY
app.set("trust proxy", 1); // Trust first proxy (Nginx)

dbConnection();
// Security Middleware
app.use(helmet());

// rate limiters
app.use("/", generalLimiter);

app.use("/api/auth", authLimiter);

app.use("/api/messages/send", sendMessageLimiter);

//CORS Middleware
const whitelist = process.env.CORS_WHITELIST;
app.use(
  cors({
    origin: function (origin, callback) {
      if (whitelist.includes(origin) || typeof origin === "undefined") {
        callback(null, true);
      } else {
        console.log(origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    // origin: "*", // Allow all origins for development
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "authorization"],
    exposedHeaders: ["Authorization"],
  })
);

// Middleware to parse JSON requests
app.use(express.json({ limit: "5mb" }));

// Basic route to check if the server is running
app.get("/", (req, res) => {
  res.send("Sarahah API is running");
});

// Import and use routes
app.use("/api/auth", authController);
app.use("/api/users", userController);
app.use("/api/messages", messageController);
// Connect to the database

//Error handling middleware
app.use((err, req, res, next) => {
  // if multer error
  if (err.name === "MulterError") {
    // size error
    if (err.code === "LIMIT_FILE_SIZE") {
      console.log(err);
      return res.status(400).json({ error: "File size is too large, Max file size is 1MB" });
    }
    console.log(err);
    return res.status(400).json({ message: "Parsing error occurred" });
  }
  console.log(err);
  res.status(500).send({ message: "Something broke!" });
});
// 404 handler
app.use((req, res, next) => {
  console.log(req.originalUrl);
  res.status(404).send({ message: "Route Not Found" });
});
app.listen(+process.env.PORT, () => {
  console.log(`Server is running on port: ${process.env.PORT}`);
});
