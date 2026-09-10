import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import "./config/env.js";


const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());


// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Blogging Platform API");
});


export default app;