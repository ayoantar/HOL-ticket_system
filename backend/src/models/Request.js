const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Request = sequelize.define('Request', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requestNumber: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true, // Allow null temporarily until hook sets it
    field: 'request_number'
  },
  requestType: {
    type: DataTypes.ENUM('event', 'web', 'technical', 'graphic'),
    allowNull: false,
    field: 'request_type'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold'),
    defaultValue: 'pending'
  },
  urgency: {
    type: DataTypes.ENUM('normal', 'urgent'),
    defaultValue: 'normal'
  },
  // Shared user information
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'client_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  // Assignment and tracking
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  // Timestamps
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'due_date'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  }
}, {
  tableName: 'requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    afterCreate: async (request, options) => {
      // Generate request number after the record is created and ID is available
      const requestNumber = `REQ-${String(request.id).padStart(6, '0')}`;
      await request.update({ requestNumber }, { transaction: options.transaction });
    }
  }
});

module.exports = Request;