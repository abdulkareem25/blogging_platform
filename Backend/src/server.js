import app from "./app.js";
import connectDB from "./config/db.js";
import config from "./config/index.js";

// Connect to MongoDB
await connectDB();

// Start the server
app.listen(config.port, () => {
  console.log(`Server is running on port: ${config.port}`);
});