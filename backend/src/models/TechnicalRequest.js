const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TechnicalRequest = sequelize.define('TechnicalRequest', {
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
  issueType: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'issue_type'
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: true,
    defaultValue: 'medium'
  },
  issueDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'issue_description'
  },
  stepsToReproduce: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'steps_to_reproduce'
  },
  deviceInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'device_info'
  },
  errorMessages: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_messages'
  },
  attemptedSolutions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'attempted_solutions'
  },
  attachmentsPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'attachments_path'
  },
  issueStarted: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'issue_started'
  }
}, {
  tableName: 'technical_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TechnicalRequest;