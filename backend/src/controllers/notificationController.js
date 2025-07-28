const { Notification } = require('../models/index');

exports.getNotifications = async (req, res) => {
  try {
    const { read, page = 1, limit = 20 } = req.query;
    const where = { recipientId: req.user.id };
    
    if (read !== undefined) where.read = read === 'true';
    
    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    const count = await Notification.count({ where });
    const unreadCount = await Notification.count({ 
      where: { 
        recipientId: req.user.id, 
        read: false 
      }
    });
    
    res.json({
      success: true,
      notifications,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        recipientId: req.user.id
      }
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    await notification.update({ read: true });
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      {
        where: {
          recipientId: req.user.id,
          read: false
        }
      }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};