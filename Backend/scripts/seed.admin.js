import mongoose from "mongoose";
import "../src/config/env.js";
import config from "../src/config/index.js";
import User from "../src/models/user.model.js";

const admin = {
  username: config.adminUsername,
  email: config.adminEmail,
  password: config.adminPassword,
  role: "admin",
};

try {
  
  await mongoose.connect(config.mongodbUri);
  const existing = await User.findOne({ email: admin.email });

  if (existing) {
    existing.role = "admin";
    existing.deletedAt = null;
    await existing.save();
    console.log(`Admin role ensured for ${admin.email}.`);
  } else {
    await User.create(admin);
    console.log(`Admin created: ${admin.email}`);
  }
} finally {
  await mongoose.disconnect();
}