import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import "./config/env.js";
import errorMiddleware from "./middleware/errorHandler.js";
import notFoundMiddleware from "./middleware/notFound.js";
import apiRoutes from "./routes/index.js";

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Blogging Platform API",
  });
});

app.use("/api/v1", apiRoutes);

// middlewares
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;