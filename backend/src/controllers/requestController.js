const { Request, EventRequest, WebRequest, TechnicalRequest, GraphicRequest, RequestActivity, User, Notification } = require('../models/index');
const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { createErrorResponse } = require('../utils/errorUtils');
const { sendRequestNotification } = require('../services/emailService');
const path = require('path');
const fs = require('fs');

// Create a new request (universal handler for all form types)
exports.createRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      
      // Create user-friendly validation error messages
      const validationErrors = errors.array();
      const userFriendlyErrors = validationErrors.map(err => {
        const fieldName = err.path || err.param || 'field';
        return `${fieldName}: ${err.msg}`;
      });
      
      const errorResponse = createErrorResponse(
        'Please fix the following errors:\n' + userFriendlyErrors.join('\n'),
        null,
        {
          validationErrors: errors.array(),
          requestType: req.body.requestType,
          userId: req.user?.id
        }
      );
      
      // Add validation errors to response for frontend handling
      errorResponse.validationErrors = validationErrors;
      return res.status(400).json(errorResponse);
    }
    
    const { requestType, name, email, phone, urgency = 'normal', dueDate, ...formData } = req.body;
    
    // Debug logging to help with error ID ERR-20250728-220153-FA93
    console.log('🔍 Request submission debug info:', {
      requestType,
      name,
      email,
      phone,
      urgency,
      dueDate,
      formDataKeys: Object.keys(formData),
      formData: formData
    });
    
    // Parse JSON fields if they exist
    if (formData.equipmentNeeded && typeof formData.equipmentNeeded === 'string') {
      try {
        formData.equipmentNeeded = JSON.parse(formData.equipmentNeeded);
      } catch (e) {
        formData.equipmentNeeded = [];
      }
    }
    
    // Automatic department routing based on request type (dynamic from database)
    let assignedDepartment = null;
    
    try {
      const routingResult = await sequelize.query(
        'SELECT department_name FROM request_routing WHERE request_type = :requestType AND is_active = true',
        {
          replacements: { requestType },
          type: sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (routingResult.length > 0) {
        assignedDepartment = routingResult[0].department_name;
      }
    } catch (error) {
      console.warn('Failed to get department routing, using fallback:', error.message);
      // Fallback to hardcoded mapping if database lookup fails
      const fallbackMapping = {
        'graphic': 'Graphic Design',
        'web': 'Web Support', 
        'technical': 'IT Support',
        'event': 'Event Management'
      };
      assignedDepartment = fallbackMapping[requestType] || null;
    }
    
    // Create main request record
    const requestData = {
      clientId: req.user.id,
      requestType,
      name,
      email,
      phone,
      urgency,
      dueDate: dueDate ? new Date(dueDate) : null,
      department: assignedDepartment,
      requestNumber: null // Will be set by the hook
    };
    
    const request = await Request.create(requestData, { transaction });
    
    // Create specific request type record
    let specificRequest;
    switch (requestType) {
      case 'event':
        // Validate required fields
        if (!formData.eventName || !formData.ministryInCharge || !formData.startingDate || !formData.endingDate) {
          throw new Error('Missing required event fields: eventName, ministryInCharge, startingDate, or endingDate');
        }
        
        // Validate and parse dates
        let startDate, endDate;
        
        if (!formData.startingDate || formData.startingDate === 'Invalid date') {
          throw new Error('Starting date is required for event requests');
        }
        if (!formData.endingDate || formData.endingDate === 'Invalid date') {
          throw new Error('Ending date is required for event requests');
        }
        
        startDate = new Date(formData.startingDate);
        endDate = new Date(formData.endingDate);
        
        if (isNaN(startDate.getTime())) {
          throw new Error(`Invalid starting date format: ${formData.startingDate}`);
        }
        if (isNaN(endDate.getTime())) {
          throw new Error(`Invalid ending date format: ${formData.endingDate}`);
        }
        
        specificRequest = await EventRequest.create({
          requestId: request.id,
          eventName: formData.eventName,
          ministryInCharge: formData.ministryInCharge,
          startingDate: startDate,
          endingDate: endDate,
          graphicRequired: formData.graphicRequired || false,
          graphicConcept: formData.graphicConcept || null,
          graphicFilePath: req.files?.graphicFile ? req.files.graphicFile[0].path : null,
          cost: formData.cost || null,
          ticketsOnline: formData.ticketsOnline || false,
          ticketsInPerson: formData.ticketsInPerson || false,
          registrationLinks: formData.registrationLinks || null,
          registrationFilesPath: req.files?.registrationFiles ? req.files.registrationFiles[0].path : null,
          equipmentNeeded: formData.equipmentNeeded || []
        }, { transaction });
        break;
        
      case 'web':
        // Validate required fields
        if (!formData.domain || !formData.description) {
          throw new Error('Missing required web request fields: domain or description');
        }
        
        specificRequest = await WebRequest.create({
          requestId: request.id,
          domain: formData.domain,
          description: formData.description
        }, { transaction });
        break;
        
      case 'technical':
        specificRequest = await TechnicalRequest.create({
          requestId: request.id,
          issueType: formData.issueType || null,
          severity: formData.severity || 'medium',
          issueDescription: formData.issueDescription,
          stepsToReproduce: formData.stepsToReproduce || null,
          deviceInfo: formData.deviceInfo || null,
          errorMessages: formData.errorMessages || null,
          attemptedSolutions: formData.attemptedSolutions || null,
          attachmentsPath: req.files?.attachments ? req.files.attachments[0].path : null,
          issueStarted: formData.issueStarted ? new Date(formData.issueStarted) : null
        }, { transaction });
        break;
        
      case 'graphic':
        specificRequest = await GraphicRequest.create({
          requestId: request.id,
          eventName: formData.eventName,
          eventDate: formData.eventDate ? new Date(formData.eventDate) : null,
          specificFont: formData.specificFont || null,
          colorPreference: formData.colorPreference || null,
          isPreviousEvent: formData.isPreviousEvent || false,
          reusableItems: formData.reusableItems || null
        }, { transaction });
        break;
        
      default:
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid request type'
        });
    }
    
    // Create notification for client
    await Notification.create({
      recipientId: req.user.id,
      type: 'status_change',
      title: 'Request Submitted',
      message: `Your ${requestType} request ${request.requestNumber} has been submitted successfully.`
    }, { transaction });
    
    await transaction.commit();
    
    // Send email notification to the email address provided in the form
    try {
      // Create a user object with the form email for notification
      const notificationRecipient = {
        name: name,
        email: email, // Use the email from the form, not the logged-in user's email
        id: req.user.id
      };
      
      await sendRequestNotification(notificationRecipient, request, 'created');
      console.log(`📧 Email notification sent to ${email} for request ${request.requestNumber}`);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request creation if email fails
    }
    
    res.status(201).json({
      success: true,
      request: {
        ...request.toJSON(),
        specificData: specificRequest.toJSON()
      }
    });
  } catch (error) {
    await transaction.rollback();
    const errorResponse = createErrorResponse(
      'Failed to create request. Please try again.',
      error,
      {
        requestType: req.body.requestType,
        userId: req.user?.id,
        userEmail: req.user?.email
      }
    );
    res.status(500).json(errorResponse);
  }
};

// Get all requests (with filtering)
exports.getRequests = async (req, res) => {
  try {
    const { requestType, status, urgency, page = 1, limit = 10 } = req.query;
    const where = {};
    
    // Role-based filtering
    if (req.user.role === 'user') {
      where.clientId = req.user.id;
    }
    
    if (requestType) where.requestType = requestType;
    if (status) where.status = status;
    if (urgency) where.urgency = urgency;
    
    const includeArray = [
      {
        model: User,
        as: 'client',
        attributes: ['name', 'email', 'company']
      },
      {
        model: User,
        as: 'assignedUser',
        attributes: ['name', 'email'],
        required: false
      },
      {
        model: RequestActivity,
        as: 'activities',
        attributes: ['activityType', 'timeSpent', 'createdAt', 'isInternal', 'techId'],
        order: [['created_at', 'DESC']],
        limit: 10
      }
    ];
    
    // Always include all specific request types (they will be null if not applicable)
    includeArray.push(
      {
        model: EventRequest,
        as: 'eventRequest',
        required: false
      },
      {
        model: WebRequest,
        as: 'webRequest',
        required: false
      },
      {
        model: TechnicalRequest,
        as: 'technicalRequest',
        required: false
      },
      {
        model: GraphicRequest,
        as: 'graphicRequest',
        required: false
      }
    );
    
    const requests = await Request.findAll({
      where,
      include: includeArray,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    // Calculate unread message count and recent activity for each request
    const requestsWithUnreadCount = await Promise.all(
      requests.map(async (request) => {
        const requestObj = request.toJSON();
        
        // Get unread messages count based on user role
        let unreadCount = 0;
        
        if (req.user.role === 'user') {
          // For users, count non-internal messages from techs
          unreadCount = await RequestActivity.count({
            where: {
              requestId: request.id,
              activityType: {
                [require('sequelize').Op.in]: ['client_message', 'internal_note']
              },
              isInternal: false,
              techId: {
                [require('sequelize').Op.ne]: req.user.id
              }
            }
          });
        } else {
          // For techs, count all messages from clients and other techs
          unreadCount = await RequestActivity.count({
            where: {
              requestId: request.id,
              activityType: {
                [require('sequelize').Op.in]: ['client_message', 'internal_note']
              },
              techId: {
                [require('sequelize').Op.ne]: req.user.id
              }
            }
          });
        }
        
        // Get the most recent activity timestamp for highlighting new updates
        const recentActivity = await RequestActivity.findOne({
          where: {
            requestId: request.id
          },
          order: [['createdAt', 'DESC']],
          attributes: ['createdAt', 'activityType', 'techId']
        });
        
        // Count total activities since user's last view (activities not by current user)
        const totalNewActivities = await RequestActivity.count({
          where: {
            requestId: request.id,
            techId: {
              [require('sequelize').Op.ne]: req.user.id
            },
            createdAt: {
              [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        });
        
        return {
          ...requestObj,
          unreadCount,
          lastActivityAt: recentActivity?.createdAt || request.updatedAt,
          hasRecentActivity: totalNewActivities > 0
        };
      })
    );
    
    const count = await Request.count({ where });
    
    res.json({
      success: true,
      requests: requestsWithUnreadCount,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single request with full details
exports.getRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await Request.findByPk(id, {
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['name', 'email', 'company', 'phone']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['name', 'email'],
          required: false
        },
        {
          model: EventRequest,
          as: 'eventRequest',
          required: false
        },
        {
          model: WebRequest,
          as: 'webRequest',
          required: false
        },
        {
          model: TechnicalRequest,
          as: 'technicalRequest',
          required: false
        },
        {
          model: GraphicRequest,
          as: 'graphicRequest',
          required: false
        },
        {
          model: RequestActivity,
          as: 'activities',
          include: [
            {
              model: User,
              as: 'tech',
              attributes: ['name', 'role', 'department']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'user' && request.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }
    
    // Calculate unread message count
    let unreadCount = 0;
    
    if (req.user.role === 'user') {
      // For users, count non-internal messages from techs
      unreadCount = await RequestActivity.count({
        where: {
          requestId: request.id,
          activityType: {
            [require('sequelize').Op.in]: ['client_message', 'internal_note']
          },
          isInternal: false,
          techId: {
            [require('sequelize').Op.ne]: req.user.id
          }
        }
      });
    } else {
      // For techs, count all messages from clients and other techs
      unreadCount = await RequestActivity.count({
        where: {
          requestId: request.id,
          activityType: {
            [require('sequelize').Op.in]: ['client_message', 'internal_note']
          },
          techId: {
            [require('sequelize').Op.ne]: req.user.id
          }
        }
      });
    }
    
    const requestWithUnread = {
      ...request.toJSON(),
      unreadCount
    };
    
    res.json({
      success: true,
      request: requestWithUnread
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update request status (admin/lead/employee only)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, timeSpent } = req.body;
    
    // Validate that user is employee/dept_lead/admin
    if (!['employee', 'dept_lead', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only employees, department leads, and admins can update request status'
      });
    }
    
    const request = await Request.findByPk(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Check permissions for employees and department leads
    if (req.user.role === 'employee' && request.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update status of requests assigned to you'
      });
    }
    
    if (req.user.role === 'dept_lead' && request.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only update requests in your department'
      });
    }
    
    const oldStatus = request.status;
    
    // Update request status
    await request.update({ 
      status,
      completedAt: status === 'completed' ? new Date() : null
    });
    
    // Create request activity log
    await RequestActivity.create({
      requestId: request.id,
      techId: req.user.id,
      activityType: 'status_change',
      oldStatus,
      newStatus: status,
      notes,
      timeSpent: timeSpent || null,
      isInternal: false
    });
    
    // Notify client about status change
    await Notification.create({
      recipientId: request.clientId,
      type: 'status_change',
      title: 'Request Status Updated',
      message: `Your request ${request.requestNumber} status has been changed to ${status}.`
    });
    
    res.json({
      success: true,
      message: 'Request status updated successfully',
      request: {
        id: request.id,
        requestNumber: request.requestNumber,
        status: request.status,
        oldStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Assign request to technician
exports.assignRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, department } = req.body;
    
    const request = await Request.findByPk(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Check if user is admin or department lead
    if (req.user.role !== 'admin' && req.user.role !== 'dept_lead') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to assign requests'
      });
    }
    
    // If user is department lead, check if they lead the department
    if (req.user.role === 'dept_lead' && req.user.department !== department) {
      return res.status(403).json({
        success: false,
        message: 'You can only assign requests within your department'
      });
    }
    
    // Verify assigned user exists and is in the department
    const assignedUser = await User.findOne({
      where: { 
        id: assignedTo,
        department: department 
      }
    });
    
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found or not in the specified department'
      });
    }
    
    await request.update({
      assignedTo,
      assignedBy: req.user.id,
      department,
      status: 'in_progress'
    });
    
    // Notify assigned user
    await Notification.create({
      recipientId: assignedTo,
      type: 'request_assigned',
      title: 'Request Assigned',
      message: `You have been assigned to request ${request.requestNumber}.`
    });
    
    // Notify client
    await Notification.create({
      recipientId: request.clientId,
      type: 'request_assigned',
      title: 'Request Assigned',
      message: `Your request ${request.requestNumber} has been assigned to our ${department} team.`
    });
    
    const updatedRequest = await Request.findByPk(request.id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    res.json({
      success: true,
      request: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add comment to request
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal = true } = req.body;
    
    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }
    
    // Check if request exists
    const request = await Request.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Check permissions
    const canComment = req.user.role === 'admin' || 
                      req.user.role === 'dept_lead' || 
                      req.user.role === 'employee' ||
                      req.user.id === request.clientId;
    
    if (!canComment) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this request'
      });
    }
    
    // Create comment as activity
    const comment = await RequestActivity.create({
      requestId: id,
      techId: req.user.id,
      activityType: isInternal ? 'internal_note' : 'client_message',
      notes: content.trim(),
      isInternal,
      timeSpent: null
    });
    
    // Get comment with user details
    const commentWithUser = await RequestActivity.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'tech',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    
    res.json({
      success: true,
      comment: commentWithUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get comments for a request
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if request exists
    const request = await Request.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Check permissions
    const canView = req.user.role === 'admin' || 
                   req.user.role === 'dept_lead' || 
                   req.user.role === 'employee' ||
                   req.user.id === request.clientId;
    
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view comments on this request'
      });
    }
    
    // Get comments based on user role
    const whereClause = {
      requestId: id,
      activityType: {
        [require('sequelize').Op.in]: ['internal_note', 'client_message']
      }
    };
    
    // If user is a user/client, only show client messages and non-internal messages
    if (req.user.role === 'user') {
      whereClause.isInternal = false;
    }
    
    const comments = await RequestActivity.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'tech',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    res.json({
      success: true,
      comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get requests assigned to current user
exports.getMyRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const where = { 
      assignedTo: req.user.id 
    };
    
    if (status) where.status = status;
    
    const requests = await Request.findAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['name', 'email'],
          required: false
        },
        {
          model: EventRequest,
          as: 'eventRequest',
          required: false
        },
        {
          model: WebRequest,
          as: 'webRequest',
          required: false
        },
        {
          model: TechnicalRequest,
          as: 'technicalRequest',
          required: false
        },
        {
          model: GraphicRequest,
          as: 'graphicRequest',
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    // Add activity tracking to My Requests
    const requestsWithActivity = await Promise.all(
      requests.map(async (request) => {
        const requestObj = request.toJSON();
        
        // Get the most recent activity timestamp
        const recentActivity = await RequestActivity.findOne({
          where: {
            requestId: request.id
          },
          order: [['createdAt', 'DESC']],
          attributes: ['createdAt', 'activityType', 'techId']
        });
        
        // Count total activities since user's last view (activities not by current user)
        const totalNewActivities = await RequestActivity.count({
          where: {
            requestId: request.id,
            techId: {
              [require('sequelize').Op.ne]: req.user.id
            },
            createdAt: {
              [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        });
        
        return {
          ...requestObj,
          lastActivityAt: recentActivity?.createdAt || request.updatedAt,
          hasRecentActivity: totalNewActivities > 0
        };
      })
    );
    
    const count = await Request.count({ where });
    
    res.json({
      success: true,
      requests: requestsWithActivity,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete request (admin and dept_lead only)
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin or department lead
    if (req.user.role !== 'admin' && req.user.role !== 'dept_lead') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete requests'
      });
    }
    
    const request = await Request.findByPk(id, {
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['name', 'email']
        }
      ]
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // If user is department lead, check if request is in their department
    if (req.user.role === 'dept_lead' && request.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete requests in your department'
      });
    }
    
    // Store request details for notification
    const requestDetails = {
      requestNumber: request.requestNumber,
      requestType: request.requestType,
      clientName: request.client?.name,
      deletedBy: req.user.name,
      deletedByRole: req.user.role
    };
    
    // Delete the request
    await request.destroy();
    
    // Notify all admins about the deletion (only if deleted by dept_lead)
    if (req.user.role === 'dept_lead') {
      const admins = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id']
      });
      
      for (const admin of admins) {
        await Notification.create({
          recipientId: admin.id,
          type: 'request_deleted',
          title: 'Request Deleted',
          message: `Request ${requestDetails.requestNumber} (${requestDetails.requestType}) was deleted by ${requestDetails.deletedBy} (Department Lead).`
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Request deleted successfully',
      requestNumber: requestDetails.requestNumber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get requests for current user's department (leads only)
exports.getDepartmentRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Only department leads and admins can access department requests
    if (!['dept_lead', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only department leads and admins can view department requests.'
      });
    }
    
    const where = {};
    
    // For department leads, show only requests assigned to their department
    if (req.user.role === 'dept_lead') {
      where.department = req.user.department;
    }
    // Admins can see all departments (no additional filter)
    
    if (status) where.status = status;
    
    const requests = await Request.findAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['name', 'email'],
          required: false
        },
        {
          model: EventRequest,
          as: 'eventRequest',
          required: false
        },
        {
          model: WebRequest,
          as: 'webRequest',
          required: false
        },
        {
          model: TechnicalRequest,
          as: 'technicalRequest',
          required: false
        },
        {
          model: GraphicRequest,
          as: 'graphicRequest',
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    // Add activity tracking to Department Requests
    const requestsWithActivity = await Promise.all(
      requests.map(async (request) => {
        const requestObj = request.toJSON();
        
        // Get the most recent activity timestamp
        const recentActivity = await RequestActivity.findOne({
          where: {
            requestId: request.id
          },
          order: [['createdAt', 'DESC']],
          attributes: ['createdAt', 'activityType', 'techId']
        });
        
        // Count total activities since user's last view (activities not by current user)
        const totalNewActivities = await RequestActivity.count({
          where: {
            requestId: request.id,
            techId: {
              [require('sequelize').Op.ne]: req.user.id
            },
            createdAt: {
              [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        });
        
        return {
          ...requestObj,
          lastActivityAt: recentActivity?.createdAt || request.updatedAt,
          hasRecentActivity: totalNewActivities > 0
        };
      })
    );
    
    const count = await Request.count({ where });
    
    res.json({
      success: true,
      requests: requestsWithActivity,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createRequest: exports.createRequest,
  getRequests: exports.getRequests,
  getRequest: exports.getRequest,
  updateRequestStatus: exports.updateRequestStatus,
  assignRequest: exports.assignRequest,
  addComment: exports.addComment,
  getComments: exports.getComments,
  getMyRequests: exports.getMyRequests,
  getDepartmentRequests: exports.getDepartmentRequests,
  deleteRequest: exports.deleteRequest
};
