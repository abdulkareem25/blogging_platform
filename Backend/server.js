import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT;

// Connect to MongoDB
connectDB();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});