const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scan.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Protect from spam
router.post('/', scanController.upload.single('receipt'), scanController.processScan);

module.exports = router;
