const mongoose = require("mongoose");
require("dotenv").config();  // MUST be at top

const MONGO_URI = "mongodb+srv://2k24it092_db_user:Sandy2006@sandy.j1lobeb.mongodb.net/SkillMirror";

if (!process.env.MONGODB_URI) {
  console.error("MongoDB URI not set in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
