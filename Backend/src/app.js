import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/index.js";
import errorMiddleware from "./middleware/errorHandler.js";
import notFoundMiddleware from "./middleware/notFound.js";
import apiRoutes from "./routes/index.js";

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use((req, res, next) => {
  [req.body, req.params, req.headers, req.query]
    .filter(Boolean)
    .forEach((value) => mongoSanitize.sanitize(value));
  next();
});
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