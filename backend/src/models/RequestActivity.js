const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RequestActivity = sequelize.define('RequestActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'request_id'
  },
  techId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tech_id'
  },
  activityType: {
    type: DataTypes.ENUM('status_change', 'internal_note', 'client_message', 'work_started', 'work_completed', 'info_requested', 'escalated'),
    allowNull: false,
    field: 'activity_type'
  },
  oldStatus: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold'),
    allowNull: true,
    field: 'old_status'
  },
  newStatus: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold'),
    allowNull: true,
    field: 'new_status'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_internal'
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'time_spent',
    comment: 'Time spent in minutes'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'request_activities',
  timestamps: false
});

module.exports = RequestActivity;