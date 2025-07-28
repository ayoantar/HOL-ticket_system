const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, equipmentController.getEquipment)
  .post(protect, authorize('admin'), equipmentController.createEquipment);

router.route('/:id')
  .put(protect, authorize('admin'), equipmentController.updateEquipment)
  .delete(protect, authorize('admin'), equipmentController.deleteEquipment);

module.exports = router;