const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EventRequest = sequelize.define('EventRequest', {
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
  ministryInCharge: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'ministry_in_charge'
  },
  startingDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'starting_date'
  },
  endingDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'ending_date'
  },
  // Graphics
  graphicRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'graphic_required'
  },
  graphicConcept: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'graphic_concept'
  },
  graphicFilePath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'graphic_file_path'
  },
  // Online registration
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  ticketsOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'tickets_online'
  },
  ticketsInPerson: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'tickets_in_person'
  },
  registrationLinks: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'registration_links'
  },
  registrationFilesPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'registration_files_path'
  },
  // Equipment needed (stored as JSON array)
  equipmentNeeded: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'equipment_needed'
  }
}, {
  tableName: 'event_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = EventRequest;