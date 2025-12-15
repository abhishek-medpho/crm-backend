import express from "express";
import cors from "cors";
// import cookieParser from "cookie-parser";

const app = express();


// const whitelist = [
//   "http://localhost:5173", // Local dev
//   "http://localhost",      // Docker production (Nginx)
//   "http://YOUR_AWS_PUBLIC_IP", // Your AWS IP or Domain
//   "http://YOUR_DOMAIN.com"
// ];

const corsOptions = {
  origin: function (origin, callback) {
    // !origin allows requests from tools like Postman or server-to-server calls
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public")); // for future use if needed

// app.use(cookieParser());

export default app;
