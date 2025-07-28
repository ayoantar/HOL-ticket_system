const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GraphicRequest = sequelize.define('GraphicRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requestId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    field: 'request_id',
    references: {
      model: 'requests',
      key: 'id'
    }
  },
  eventName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'event_name'
  },
  eventDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'event_date'
  },
  specificFont: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'specific_font'
  },
  colorPreference: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'color_preference'
  },
  isPreviousEvent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_previous_event'
  },
  reusableItems: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'reusable_items'
  }
}, {
  tableName: 'graphic_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = GraphicRequest;