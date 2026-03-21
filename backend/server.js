const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const postRoutes = require("./routes/posts");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (request, response) => {
  response.json({
    message: "CampusConnect backend is running",
    status: "ok"
  });
});

app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/posts", postRoutes);

app.use((request, response) => {
  response.status(404).json({
    message: `Route not found: ${request.method} ${request.originalUrl}`
  });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    process.exit(1);
  }
}

startServer();
