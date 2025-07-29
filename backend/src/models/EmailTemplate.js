const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  templateKey: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'template_key'
  },
  templateName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'template_name'
  },
  subjectTemplate: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'subject_template'
  },
  htmlTemplate: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'html_template'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by'
  }
}, {
  tableName: 'email_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['template_key']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Helper method to render template with variables
EmailTemplate.prototype.render = function(variables = {}) {
  let subject = this.subjectTemplate;
  let html = this.htmlTemplate;
  
  // Replace template variables like {{variable}} with actual values
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, variables[key] || '');
    html = html.replace(regex, variables[key] || '');
  });
  
  return { subject, html };
};

// Static method to get and render template
EmailTemplate.getRenderedTemplate = async function(templateKey, variables = {}) {
  const template = await EmailTemplate.findOne({
    where: {
      templateKey,
      isActive: true
    }
  });
  
  if (!template) {
    throw new Error(`Email template '${templateKey}' not found or inactive`);
  }
  
  return template.render(variables);
};

module.exports = EmailTemplate;