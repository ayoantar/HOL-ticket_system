const User = require('./User');
const Equipment = require('./Equipment');
const Notification = require('./Notification');
const Department = require('./Department');
// Request system models
const Request = require('./Request');
const EventRequest = require('./EventRequest');
const WebRequest = require('./WebRequest');
const TechnicalRequest = require('./TechnicalRequest');
const GraphicRequest = require('./GraphicRequest');
const RequestActivity = require('./RequestActivity');

// Define associations

// User associations
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });
User.hasOne(Department, { foreignKey: 'leadId', as: 'ledDepartment' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// Department associations
Department.belongsTo(User, { foreignKey: 'leadId', as: 'lead' });
Department.hasMany(User, { foreignKey: 'department', sourceKey: 'name', as: 'employees' });

// Request associations
Request.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
Request.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
Request.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });
Request.hasMany(RequestActivity, { foreignKey: 'requestId', as: 'activities' });

// User request associations
User.hasMany(Request, { foreignKey: 'clientId', as: 'requests' });
User.hasMany(Request, { foreignKey: 'assignedTo', as: 'assignedRequests' });
User.hasMany(Request, { foreignKey: 'assignedBy', as: 'assignedByRequests' });
User.hasMany(RequestActivity, { foreignKey: 'techId', as: 'requestActivities' });

// Specific request type associations
EventRequest.belongsTo(Request, { foreignKey: 'requestId', as: 'request' });
WebRequest.belongsTo(Request, { foreignKey: 'requestId', as: 'request' });
TechnicalRequest.belongsTo(Request, { foreignKey: 'requestId', as: 'request' });
GraphicRequest.belongsTo(Request, { foreignKey: 'requestId', as: 'request' });

Request.hasOne(EventRequest, { foreignKey: 'requestId', as: 'eventRequest' });
Request.hasOne(WebRequest, { foreignKey: 'requestId', as: 'webRequest' });
Request.hasOne(TechnicalRequest, { foreignKey: 'requestId', as: 'technicalRequest' });
Request.hasOne(GraphicRequest, { foreignKey: 'requestId', as: 'graphicRequest' });

// RequestActivity associations
RequestActivity.belongsTo(Request, { foreignKey: 'requestId', as: 'request' });
RequestActivity.belongsTo(User, { foreignKey: 'techId', as: 'tech' });

module.exports = {
  User,
  Equipment,
  Notification,
  Department,
  Request,
  EventRequest,
  WebRequest,
  TechnicalRequest,
  GraphicRequest,
  RequestActivity
};