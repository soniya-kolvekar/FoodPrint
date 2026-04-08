const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const pantryController = require("../controllers/pantry.controller");

const router = express.Router();

router.use(protect);

router.get("/", pantryController.getItems);
router.post("/", pantryController.addItem);
router.post("/bulk-add", pantryController.bulkAddItems);
router.post("/:id/use", pantryController.useItem);
router.post("/:id/half", pantryController.halfItem);
router.post("/:id/finish", pantryController.finishItem);

module.exports = router;
