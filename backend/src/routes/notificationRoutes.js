const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(notificationController.getNotifications);

router.route('/read-all')
  .put(notificationController.markAllAsRead);

router.route('/:id/read')
  .put(notificationController.markAsRead);

module.exports = router;