const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  setting_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  setting_type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    allowNull: false,
    defaultValue: 'string'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_encrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['setting_key']
    },
    {
      fields: ['category']
    }
  ]
});

// Helper methods for getting/setting values with proper type conversion
SystemSettings.getValue = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({ where: { setting_key: key } });
    if (!setting) return defaultValue;

    switch (setting.setting_type) {
      case 'boolean':
        return setting.setting_value === 'true';
      case 'number':
        return parseFloat(setting.setting_value);
      case 'json':
        return JSON.parse(setting.setting_value);
      default:
        return setting.setting_value;
    }
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

SystemSettings.setValue = async function(key, value, type = 'string', category = 'general', description = null, updatedBy = null) {
  try {
    let stringValue;
    switch (type) {
      case 'boolean':
        stringValue = value ? 'true' : 'false';
        break;
      case 'number':
        stringValue = value.toString();
        break;
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      default:
        stringValue = value;
    }

    const [setting, created] = await this.findOrCreate({
      where: { setting_key: key },
      defaults: {
        setting_key: key,
        setting_value: stringValue,
        setting_type: type,
        category,
        description,
        updated_by: updatedBy
      }
    });

    if (!created) {
      await setting.update({
        setting_value: stringValue,
        setting_type: type,
        category,
        description,
        updated_by: updatedBy
      });
    }

    return setting;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
};

SystemSettings.getByCategory = async function(category) {
  try {
    const settings = await this.findAll({ where: { category } });
    const result = {};
    
    for (const setting of settings) {
      switch (setting.setting_type) {
        case 'boolean':
          result[setting.setting_key] = setting.setting_value === 'true';
          break;
        case 'number':
          result[setting.setting_key] = parseFloat(setting.setting_value);
          break;
        case 'json':
          result[setting.setting_key] = JSON.parse(setting.setting_value);
          break;
        default:
          result[setting.setting_key] = setting.setting_value;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error getting category ${category}:`, error);
    return {};
  }
};

module.exports = SystemSettings;