const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const userRoutes = require("./routes/user.routes");
const pantryRoutes = require("./routes/pantry.routes");
const recipeRoutes = require("./routes/recipe.routes");

app.use("/api/users", userRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/recipes", recipeRoutes);

app.get("/", (req, res) => {
  res.json({ message: "FoodPrint API is running" });
});

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
