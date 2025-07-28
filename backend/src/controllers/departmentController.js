const { Department, User } = require('../models/index');
const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');

// Get all departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: 'lead',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'employees',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get department by ID
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'lead',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'employees',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create department (admin only)
exports.createDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, leadId } = req.body;

    const department = await Department.create({
      name,
      description,
      leadId
    });

    // Update lead user if provided
    if (leadId) {
      await User.update(
        { 
          department: name,
          isLead: true,
          role: 'dept_lead'
        },
        { where: { id: leadId } }
      );
    }

    const departmentWithLead = await Department.findByPk(department.id, {
      include: [
        {
          model: User,
          as: 'lead',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      department: departmentWithLead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update department (admin only)
exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const { name, description, leadId } = req.body;
    const oldLeadId = department.leadId;

    // Update department
    await department.update({
      name,
      description,
      leadId
    });

    // Update old lead if exists
    if (oldLeadId && oldLeadId !== leadId) {
      await User.update(
        { 
          isLead: false,
          role: 'employee'
        },
        { where: { id: oldLeadId } }
      );
    }

    // Update new lead if provided
    if (leadId) {
      await User.update(
        { 
          department: name,
          isLead: true,
          role: 'dept_lead'
        },
        { where: { id: leadId } }
      );
    }

    const updatedDepartment = await Department.findByPk(department.id, {
      include: [
        {
          model: User,
          as: 'lead',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      department: updatedDepartment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete department (admin only)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Remove lead status from current lead
    if (department.leadId) {
      await User.update(
        { 
          isLead: false,
          role: 'employee'
        },
        { where: { id: department.leadId } }
      );
    }

    // Remove department from all users
    await User.update(
      { department: null },
      { where: { department: department.name } }
    );

    await department.destroy();

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Assign user to department (admin only)
exports.assignUserToDepartment = async (req, res) => {
  try {
    const { userId, departmentId, role } = req.body;

    const user = await User.findByPk(userId);
    const department = await Department.findByPk(departmentId);

    if (!user || !department) {
      return res.status(404).json({
        success: false,
        message: 'User or department not found'
      });
    }

    await user.update({
      department: department.name,
      role: role || 'employee'
    });

    res.json({
      success: true,
      message: 'User assigned to department successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get department employees
exports.getDepartmentEmployees = async (req, res) => {
  try {
    const { departmentName } = req.params;
    
    const employees = await User.findAll({
      where: { department: departmentName },
      attributes: ['id', 'name', 'email', 'role', 'isLead'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Get request routing configuration (admin only)
exports.getRequestRouting = async (req, res) => {
  try {
    const routing = await sequelize.query(
      "SELECT * FROM request_routing ORDER BY request_type",
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      routing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update request routing configuration (admin only)
exports.updateRequestRouting = async (req, res) => {
  try {
    const { requestType, departmentName, isActive = true } = req.body;
    
    // Validate that department exists
    const department = await Department.findOne({ where: { name: departmentName } });
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department not found"
      });
    }

    await sequelize.query(
      `INSERT INTO request_routing (request_type, department_name, is_active) 
       VALUES (:requestType, :departmentName, :isActive)
       ON CONFLICT (request_type) 
       DO UPDATE SET department_name = :departmentName, is_active = :isActive, updated_at = CURRENT_TIMESTAMP`,
      { 
        replacements: { requestType, departmentName, isActive },
        type: sequelize.QueryTypes.INSERT 
      }
    );

    res.json({
      success: true,
      message: "Request routing updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
