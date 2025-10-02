// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import contactRouter from "./routes/contact.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------
// Trust Proxy (for Render / rate-limit)
// ---------------------------
app.set("trust proxy", 1);

// ---------------------------
// Middleware
// ---------------------------
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// CORS Configuration
// ---------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://127.0.0.1:5500",
  "http://localhost:5500",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser tools like Postman
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight requests

// ---------------------------
// Rate Limiter
// ---------------------------
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/contact", limiter);

// ---------------------------
// Routes
// ---------------------------
app.use("/api", contactRouter);

// ---------------------------
// Health Check
// ---------------------------
app.get("/", (req, res) => {
  res.send("EME Backend is running!");
});

// ---------------------------
// Start Server
// ---------------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
