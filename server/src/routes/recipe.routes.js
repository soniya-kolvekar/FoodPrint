const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const recipeController = require("../controllers/recipe.controller");

const router = express.Router();

router.use(protect);
router.get("/", recipeController.getRecipes);
router.get("/:id", recipeController.getRecipeDetails);
router.post("/:id/cook", recipeController.cookRecipe);

module.exports = router;
