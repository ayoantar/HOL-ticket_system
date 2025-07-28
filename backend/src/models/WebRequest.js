const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WebRequest = sequelize.define('WebRequest', {
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
  domain: {
    type: DataTypes.ENUM(
      'housesoflight.org',
      'housesoflight.church',
      'hbrp.la',
      'housesoflight.network',
      'netzgomez.com',
      'turningheartsacademy.com',
      'pasionporjesus.la',
      'blumacademy.com',
      'centrodeasesoriafamiliar.org',
      'casaderestauracion.la',
      'raicesprofundas.la'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'web_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = WebRequest;