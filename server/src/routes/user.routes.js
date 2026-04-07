const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.use(protect);
router.get("/me", userController.getMe);

module.exports = router;
