const { Equipment } = require('../models/index');

exports.getEquipment = async (req, res) => {
  try {
    const { category, available } = req.query;
    const where = {};
    
    if (category) where.category = category;
    if (available !== undefined) where.isAvailable = available === 'true';
    
    const equipment = await Equipment.findAll({
      where,
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    
    res.status(201).json({
      success: true,
      equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    await equipment.update(req.body);
    
    res.json({
      success: true,
      equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    await equipment.destroy();
    
    res.json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};