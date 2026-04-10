const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const recipeController = require("../controllers/recipe.controller");
const userRecipeController = require("../controllers/userRecipe.controller");

const router = express.Router();

router.use(protect);

router.get("/", recipeController.getRecipes);
router.get("/saved", userRecipeController.getSavedRecipes);
router.get("/:id", recipeController.getRecipeDetails);
router.post("/save", userRecipeController.saveRecipe);
router.delete("/saved/:id", userRecipeController.removeRecipe);
router.post("/:id/cook", recipeController.cookRecipe);

module.exports = router;
