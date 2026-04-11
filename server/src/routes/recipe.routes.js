const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const recipeController = require("../controllers/recipe.controller");

const router = express.Router();

router.get("/substitutes", recipeController.getSubstitutes); // Public route

router.use(protect); // All routes below require auth
router.get("/", recipeController.getRecipes);
router.get("/:id", recipeController.getRecipeDetails);
router.post("/:id/cook", recipeController.cookRecipe);

module.exports = router;
