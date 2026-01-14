require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");

require("./config/db");

const authRoutes = require("./routes/auth.routes");
const skillRoutes = require("./routes/skill.routes");
const taskRoutes = require("./routes/task.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/tasks", taskRoutes);

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
