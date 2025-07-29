const { User, Request, RequestActivity, Department, EventRequest, WebRequest, TechnicalRequest, GraphicRequest, EmailTemplate } = require('../models/index');
// SystemSettings will be imported dynamically to handle missing table
let SystemSettings;
try {
  SystemSettings = require('../models/SystemSettings');
} catch (err) {
  console.log('SystemSettings model not available:', err.message);
}
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { Op, fn, col, literal } = require('sequelize');
const csv = require('fast-csv');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const where = {};
    
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    
    if (role) {
      where.role = role;
    }
    
    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({
      success: true,
      users: users.rows,
      totalUsers: users.count,
      totalPages: Math.ceil(users.count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, password, role = 'user', company, phone, department } = req.body;
    
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role,
      company,
      phone,
      department
    });
    
    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, company, phone, isActive, department } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      company: company || user.company,
      phone: phone || user.phone,
      isActive: isActive !== undefined ? isActive : user.isActive,
      department: department !== undefined ? department : user.department
    });
    
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update({ password: newPassword });
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow deletion of admin user
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }
    
    await user.destroy();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const adminUsers = await User.count({ where: { role: 'admin' } });
    const userUsers = await User.count({ where: { role: 'user' } });
    const employeeUsers = await User.count({ where: { role: 'employee' } });
    const deptLeadUsers = await User.count({ where: { role: 'dept_lead' } });
    
    res.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: adminUsers,
        users: userUsers,
        employees: employeeUsers,
        dept_leads: deptLeadUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Analytics and Reports
const getRequestAnalytics = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // days
    const daysAgo = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Basic request statistics
    const totalRequests = await Request.count();
    const recentRequests = await Request.count({
      where: {
        created_at: { [Op.gte]: startDate }
      }
    });

    // Request status breakdown
    const statusStats = await Request.findAll({
      attributes: ['status', [fn('COUNT', col('Request.id')), 'count']],
      group: ['status'],
      raw: true
    });

    // Request type breakdown
    const typeStats = await Request.findAll({
      attributes: ['request_type', [fn('COUNT', col('Request.id')), 'count']],
      group: ['request_type'],
      raw: true
    });

    // Department breakdown
    const departmentStats = await Request.findAll({
      attributes: ['department', [fn('COUNT', col('Request.id')), 'count']],
      where: { department: { [Op.not]: null } },
      group: ['department'],
      raw: true
    });

    // Daily request creation trend (last 30 days)
    const dailyStats = await Request.findAll({
      attributes: [
        [fn('DATE', col('Request.created_at')), 'date'],
        [fn('COUNT', col('Request.id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: startDate }
      },
      group: [fn('DATE', col('Request.created_at'))],
      order: [[fn('DATE', col('Request.created_at')), 'ASC']],
      raw: true
    });

    // Average completion time (for completed requests)
    const completionTimes = await Request.findAll({
      attributes: [
        [literal('EXTRACT(EPOCH FROM (completed_at - created_at))/86400'), 'days_to_complete']
      ],
      where: {
        status: 'completed',
        completed_at: { [Op.not]: null }
      },
      raw: true
    });

    const avgCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, item) => sum + parseFloat(item.days_to_complete), 0) / completionTimes.length
      : 0;

    // Top performing users (by completed requests)
    const topPerformers = await Request.findAll({
      attributes: [
        'assigned_to',
        [fn('COUNT', col('Request.id')), 'completed_count']
      ],
      include: [{
        model: User,
        as: 'assignedUser',
        attributes: ['name', 'email', 'department']
      }],
      where: {
        status: 'completed',
        assigned_to: { [Op.not]: null }
      },
      group: ['assigned_to', 'assignedUser.id', 'assignedUser.name', 'assignedUser.email', 'assignedUser.department'],
      order: [[fn('COUNT', col('Request.id')), 'DESC']],
      limit: 5,
      raw: false
    });

    res.json({
      success: true,
      analytics: {
        overview: {
          total_requests: totalRequests,
          recent_requests: recentRequests,
          avg_completion_time: Math.round(avgCompletionTime * 10) / 10
        },
        status_breakdown: statusStats,
        type_breakdown: typeStats,
        department_breakdown: departmentStats,
        daily_trend: dailyStats,
        top_performers: topPerformers
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getDetailedReports = async (req, res) => {
  try {
    const { reportType, startDate, endDate, department } = req.query;
    
    let whereClause = {};
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    if (department) {
      whereClause.department = department;
    }

    let reportData = {};

    switch (reportType) {
      case 'performance':
        // Department performance report
        reportData = await Request.findAll({
          attributes: [
            'department',
            'status',
            [fn('COUNT', col('Request.id')), 'count'],
            [fn('AVG', literal('EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at))/86400')), 'avg_days']
          ],
          where: whereClause,
          group: ['department', 'status'],
          order: [['department', 'ASC'], ['status', 'ASC']],
          raw: true
        });
        break;

      case 'activity':
        // Activity log report
        reportData = await RequestActivity.findAll({
          include: [
            {
              model: Request,
              attributes: ['request_number', 'request_type', 'department']
            },
            {
              model: User,
              as: 'tech',
              attributes: ['name', 'email', 'department']
            }
          ],
          where: startDate && endDate ? {
            created_at: {
              [Op.between]: [new Date(startDate), new Date(endDate)]
            }
          } : {},
          order: [['created_at', 'DESC']],
          limit: 100
        });
        break;

      case 'requests':
        // Detailed requests report
        reportData = await Request.findAll({
          include: [
            {
              model: User,
              as: 'client',
              attributes: ['name', 'email', 'company']
            },
            {
              model: User,
              as: 'assignedUser',
              attributes: ['name', 'email', 'department']
            }
          ],
          where: whereClause,
          order: [['created_at', 'DESC']],
          limit: 500
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.json({
      success: true,
      reportType,
      data: reportData,
      filters: { startDate, endDate, department }
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getSystemMetrics = async (req, res) => {
  try {
    // System health metrics
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Request volume metrics
    const requestsLast24h = await Request.count({
      where: { created_at: { [Op.gte]: last24Hours } }
    });
    const requestsLast7d = await Request.count({
      where: { created_at: { [Op.gte]: last7Days } }
    });
    const requestsLast30d = await Request.count({
      where: { created_at: { [Op.gte]: last30Days } }
    });

    // Active users (users who have created requests recently)
    const activeUsers = await User.count({
      include: [{
        model: Request,
        as: 'requests',
        where: { created_at: { [Op.gte]: last30Days } },
        required: true
      }]
    });

    // Response time metrics (time from creation to first assignment)
    const responseTimeData = await Request.findAll({
      attributes: [
        [literal('EXTRACT(EPOCH FROM (updated_at - created_at))/3600'), 'response_hours']
      ],
      where: {
        assigned_to: { [Op.not]: null },
        created_at: { [Op.gte]: last30Days }
      },
      raw: true
    });

    const avgResponseTime = responseTimeData.length > 0
      ? responseTimeData.reduce((sum, item) => sum + parseFloat(item.response_hours), 0) / responseTimeData.length
      : 0;

    // Workload distribution
    const workloadDistribution = await User.findAll({
      attributes: [
        'id',
        'name',
        'department',
        [fn('COUNT', col('assignedRequests.id')), 'active_requests']
      ],
      include: [{
        model: Request,
        as: 'assignedRequests',
        where: { status: { [Op.in]: ['pending', 'in_progress'] } },
        required: false,
        attributes: []
      }],
      where: { role: { [Op.in]: ['employee', 'dept_lead'] } },
      group: ['User.id', 'User.name', 'User.department'],
      order: [[fn('COUNT', col('assignedRequests.id')), 'DESC']],
      raw: false
    });

    res.json({
      success: true,
      metrics: {
        request_volume: {
          last_24h: requestsLast24h,
          last_7d: requestsLast7d,
          last_30d: requestsLast30d
        },
        user_activity: {
          active_users: activeUsers,
          avg_response_time_hours: Math.round(avgResponseTime * 10) / 10
        },
        workload_distribution: workloadDistribution
      }
    });
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export functionality
const exportAnalyticsCSV = async (req, res) => {
  try {
    const { timeframe = '30', reportType = 'analytics' } = req.query;
    const daysAgo = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    let data = [];
    let filename = '';

    switch (reportType) {
      case 'analytics':
        // Export analytics overview
        const requests = await Request.findAll({
          include: [
            {
              model: User,
              as: 'client',
              attributes: ['name', 'email', 'company']
            },
            {
              model: User,
              as: 'assignedUser',
              attributes: ['name', 'email', 'department']
            }
          ],
          where: {
            created_at: { [Op.gte]: startDate }
          },
          order: [['created_at', 'DESC']],
          raw: false
        });

        data = requests.map(request => ({
          'Request Number': request.request_number,
          'Type': request.request_type,
          'Status': request.status,
          'Department': request.department || 'Unassigned',
          'Client Name': request.client?.name || 'N/A',
          'Client Email': request.client?.email || 'N/A',
          'Client Company': request.client?.company || 'N/A',
          'Assigned To': request.assignedUser?.name || 'Unassigned',
          'Assignee Department': request.assignedUser?.department || 'N/A',
          'Created Date': request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A',
          'Completed Date': request.completed_at ? new Date(request.completed_at).toLocaleDateString() : 'N/A',
          'Urgency': request.urgency || 'normal'
        }));
        filename = `analytics-report-${timeframe}days-${Date.now()}.csv`;
        break;

      case 'performance':
        // Export performance data by user
        const performanceData = await Request.findAll({
          attributes: [
            'assigned_to',
            'status',
            [fn('COUNT', col('Request.id')), 'total_requests'],
            [fn('AVG', literal('EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at))/86400')), 'avg_completion_days']
          ],
          include: [{
            model: User,
            as: 'assignedUser',
            attributes: ['name', 'email', 'department']
          }],
          where: {
            assigned_to: { [Op.not]: null },
            created_at: { [Op.gte]: startDate }
          },
          group: ['assigned_to', 'status', 'assignedUser.id', 'assignedUser.name', 'assignedUser.email', 'assignedUser.department'],
          raw: false
        });

        data = performanceData.map(item => ({
          'Employee Name': item.assignedUser?.name || 'Unknown',
          'Employee Email': item.assignedUser?.email || 'N/A',
          'Department': item.assignedUser?.department || 'N/A',
          'Status': item.status,
          'Total Requests': item.dataValues.total_requests,
          'Avg Completion Days': parseFloat(item.dataValues.avg_completion_days || 0).toFixed(2)
        }));
        filename = `performance-report-${timeframe}days-${Date.now()}.csv`;
        break;

      case 'activity':
        // Export activity log
        const activities = await RequestActivity.findAll({
          include: [
            {
              model: Request,
              attributes: ['request_number', 'request_type', 'department']
            },
            {
              model: User,
              as: 'tech',
              attributes: ['name', 'email', 'department']
            }
          ],
          where: {
            created_at: { [Op.gte]: startDate }
          },
          order: [['created_at', 'DESC']],
          limit: 1000
        });

        data = activities.map(activity => ({
          'Request Number': activity.Request?.request_number || 'N/A',
          'Request Type': activity.Request?.request_type || 'N/A',
          'Request Department': activity.Request?.department || 'N/A',
          'Activity Type': activity.activity_type,
          'Tech Name': activity.tech?.name || 'N/A',
          'Tech Department': activity.tech?.department || 'N/A',
          'Old Status': activity.old_status || 'N/A',
          'New Status': activity.new_status || 'N/A',
          'Notes': activity.notes || 'N/A',
          'Time Spent (minutes)': activity.time_spent || 0,
          'Date': activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'N/A'
        }));
        filename = `activity-report-${timeframe}days-${Date.now()}.csv`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Create CSV stream and pipe to response
    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    // Write data to CSV
    data.forEach(row => csvStream.write(row));
    csvStream.end();

  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const exportAnalyticsPDF = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get analytics data
    const totalRequests = await Request.count();
    const recentRequests = await Request.count({
      where: { created_at: { [Op.gte]: startDate } }
    });

    const statusStats = await Request.findAll({
      attributes: ['status', [fn('COUNT', col('Request.id')), 'count']],
      group: ['status'],
      raw: true
    });

    const typeStats = await Request.findAll({
      attributes: ['request_type', [fn('COUNT', col('Request.id')), 'count']],
      group: ['request_type'],
      raw: true
    });

    const departmentStats = await Request.findAll({
      attributes: ['department', [fn('COUNT', col('Request.id')), 'count']],
      where: { department: { [Op.not]: null } },
      group: ['department'],
      raw: true
    });

    // Create HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Analytics Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
            .header h1 { color: #1976d2; margin: 0; }
            .header p { margin: 5px 0; color: #666; }
            .metrics { display: flex; justify-content: space-around; margin: 30px 0; }
            .metric { text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; flex: 1; margin: 0 10px; }
            .metric-value { font-size: 2em; font-weight: bold; color: #1976d2; }
            .metric-label { font-size: 0.9em; color: #666; margin-top: 5px; }
            .section { margin: 40px 0; }
            .section h2 { color: #1976d2; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; color: #666; font-size: 0.9em; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Houses of Light Analytics Report</h1>
            <p>Request Management System</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Time Period: Last ${timeframe} days</p>
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${totalRequests}</div>
                <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${recentRequests}</div>
                <div class="metric-label">Recent Requests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${statusStats.filter(s => s.status === 'completed').reduce((sum, s) => sum + parseInt(s.count), 0)}</div>
                <div class="metric-label">Completed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${statusStats.filter(s => s.status === 'in_progress').reduce((sum, s) => sum + parseInt(s.count), 0)}</div>
                <div class="metric-label">In Progress</div>
            </div>
        </div>

        <div class="section">
            <h2>Request Status Breakdown</h2>
            <table>
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${statusStats.map(status => `
                        <tr>
                            <td>${status.status.charAt(0).toUpperCase() + status.status.slice(1)}</td>
                            <td>${status.count}</td>
                            <td>${((status.count / totalRequests) * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Request Type Distribution</h2>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${typeStats.map(type => `
                        <tr>
                            <td>${type.request_type.charAt(0).toUpperCase() + type.request_type.slice(1)}</td>
                            <td>${type.count}</td>
                            <td>${((type.count / totalRequests) * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Department Workload</h2>
            <table>
                <thead>
                    <tr>
                        <th>Department</th>
                        <th>Requests</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${departmentStats.map(dept => `
                        <tr>
                            <td>${dept.department || 'Unassigned'}</td>
                            <td>${dept.count}</td>
                            <td>${((dept.count / totalRequests) * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Report generated by Houses of Light Request Management System</p>
            <p>Data is current as of report generation time</p>
        </div>
    </body>
    </html>
    `;

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Set response headers for PDF download
    const filename = `analytics-report-${timeframe}days-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Real-time data refresh endpoint
const refreshAnalyticsData = async (req, res) => {
  try {
    // This endpoint can be used to force refresh cached data
    // For now, we'll just return a success response since our queries are real-time
    res.json({
      success: true,
      message: 'Analytics data refreshed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// System Settings Management
const getSystemSettings = async (req, res) => {
  try {
    // Check if SystemSettings table exists, if not return defaults
    let emailSettings = {};
    let systemDefaults = {};
    let organizationSettings = {};
    let notificationSettings = {};
    let securitySettings = {};
    let maintenanceSettings = {};
    
    if (SystemSettings) {
      try {
        emailSettings = await SystemSettings.getByCategory('email');
        systemDefaults = await SystemSettings.getByCategory('system');
        organizationSettings = await SystemSettings.getByCategory('organization');
        notificationSettings = await SystemSettings.getByCategory('notification');
        securitySettings = await SystemSettings.getByCategory('security');
        maintenanceSettings = await SystemSettings.getByCategory('maintenance');
      } catch (tableError) {
        console.log('SystemSettings table not found, using defaults:', tableError.message);
        // Continue with empty objects - defaults will be used below
      }
    } else {
      console.log('SystemSettings model not available, using defaults');
    }

    // Provide default values if settings don't exist
    const settings = {
      emailSettings: {
        smtpHost: emailSettings.smtpHost || '',
        smtpPort: emailSettings.smtpPort || 587,
        smtpUser: emailSettings.smtpUser || '',
        smtpPassword: '***', // Never send actual password
        fromName: emailSettings.fromName || 'Houses of Light',
        fromEmail: emailSettings.fromEmail || '',
        notificationsEnabled: emailSettings.notificationsEnabled !== undefined ? emailSettings.notificationsEnabled : true,
        testEmailRecipient: emailSettings.testEmailRecipient || ''
      },
      systemDefaults: {
        defaultUrgency: systemDefaults.defaultUrgency || 'normal',
        autoAssignEnabled: systemDefaults.autoAssignEnabled !== undefined ? systemDefaults.autoAssignEnabled : false,
        requestNumberPrefix: systemDefaults.requestNumberPrefix || 'REQ',
        defaultRequestStatus: systemDefaults.defaultRequestStatus || 'pending',
        enableFileUploads: systemDefaults.enableFileUploads !== undefined ? systemDefaults.enableFileUploads : true,
        maxFileSize: systemDefaults.maxFileSize || 50,
        sessionTimeout: systemDefaults.sessionTimeout || 24,
        passwordMinLength: systemDefaults.passwordMinLength || 8
      },
      organizationSettings: {
        organizationName: organizationSettings.organizationName || 'Houses of Light',
        supportEmail: organizationSettings.supportEmail || '',
        websiteUrl: organizationSettings.websiteUrl || '',
        address: organizationSettings.address || '',
        phone: organizationSettings.phone || '',
        timeZone: organizationSettings.timeZone || 'America/New_York',
        logoUrl: organizationSettings.logoUrl || ''
      },
      notificationSettings: {
        emailNotifications: notificationSettings.emailNotifications !== undefined ? notificationSettings.emailNotifications : true,
        smsNotifications: notificationSettings.smsNotifications !== undefined ? notificationSettings.smsNotifications : false,
        pushNotifications: notificationSettings.pushNotifications !== undefined ? notificationSettings.pushNotifications : true,
        notifyOnAssignment: notificationSettings.notifyOnAssignment !== undefined ? notificationSettings.notifyOnAssignment : true,
        notifyOnStatusChange: notificationSettings.notifyOnStatusChange !== undefined ? notificationSettings.notifyOnStatusChange : true,
        notifyOnComment: notificationSettings.notifyOnComment !== undefined ? notificationSettings.notifyOnComment : true,
        dailyDigest: notificationSettings.dailyDigest !== undefined ? notificationSettings.dailyDigest : false,
        weeklyReport: notificationSettings.weeklyReport !== undefined ? notificationSettings.weeklyReport : false
      },
      securitySettings: {
        enableTwoFactor: securitySettings.enableTwoFactor !== undefined ? securitySettings.enableTwoFactor : false,
        loginAttemptLimit: securitySettings.loginAttemptLimit || 5,
        sessionTimeout: securitySettings.sessionTimeout || 24,
        requirePasswordChange: securitySettings.requirePasswordChange !== undefined ? securitySettings.requirePasswordChange : false,
        passwordExpirationDays: securitySettings.passwordExpirationDays || 90,
        enableAuditLog: securitySettings.enableAuditLog !== undefined ? securitySettings.enableAuditLog : true,
        allowMultipleSessions: securitySettings.allowMultipleSessions !== undefined ? securitySettings.allowMultipleSessions : true
      },
      maintenanceSettings: {
        maintenanceMode: maintenanceSettings.maintenanceMode !== undefined ? maintenanceSettings.maintenanceMode : false,
        backupEnabled: maintenanceSettings.backupEnabled !== undefined ? maintenanceSettings.backupEnabled : true,
        backupFrequency: maintenanceSettings.backupFrequency || 'daily',
        autoCleanupDays: maintenanceSettings.autoCleanupDays || 30,
        enableSystemAlerts: maintenanceSettings.enableSystemAlerts !== undefined ? maintenanceSettings.enableSystemAlerts : true,
        debugMode: maintenanceSettings.debugMode !== undefined ? maintenanceSettings.debugMode : false
      }
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Check if SystemSettings is available
    if (!SystemSettings) {
      return res.status(500).json({
        success: false,
        message: 'System settings not available. Please run database migrations.'
      });
    }

    // Check if SystemSettings table exists
    try {
      await SystemSettings.findOne({ limit: 1 });
    } catch (tableError) {
      return res.status(500).json({
        success: false,
        message: 'System settings table not found. Please run database migrations.'
      });
    }

    // Validation functions
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return email === '' || emailRegex.test(email);
    };

    const validateUrl = (url) => {
      if (!url) return true;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const validatePort = (port) => {
      const num = parseInt(port);
      return num >= 1 && num <= 65535;
    };

    const validatePositiveNumber = (num) => {
      const parsed = parseInt(num);
      return parsed > 0;
    };

    const { emailSettings, systemDefaults, organizationSettings, notificationSettings, securitySettings, maintenanceSettings } = req.body;
    const updatedBy = req.user.id;
    const validationErrors = [];

    // Validate email settings
    if (emailSettings) {
      if (emailSettings.smtpPort !== undefined && !validatePort(emailSettings.smtpPort)) {
        validationErrors.push('SMTP port must be between 1 and 65535');
      }
      if (emailSettings.fromEmail !== undefined && !validateEmail(emailSettings.fromEmail)) {
        validationErrors.push('From email must be a valid email address');
      }
      if (emailSettings.testEmailRecipient !== undefined && !validateEmail(emailSettings.testEmailRecipient)) {
        validationErrors.push('Test email recipient must be a valid email address');
      }
    }

    // Validate organization settings
    if (organizationSettings) {
      if (organizationSettings.supportEmail !== undefined && !validateEmail(organizationSettings.supportEmail)) {
        validationErrors.push('Support email must be a valid email address');
      }
      if (organizationSettings.websiteUrl !== undefined && !validateUrl(organizationSettings.websiteUrl)) {
        validationErrors.push('Website URL must be a valid URL');
      }
    }

    // Validate system defaults
    if (systemDefaults) {
      if (systemDefaults.maxFileSize !== undefined && !validatePositiveNumber(systemDefaults.maxFileSize)) {
        validationErrors.push('Max file size must be a positive number');
      }
      if (systemDefaults.sessionTimeout !== undefined && !validatePositiveNumber(systemDefaults.sessionTimeout)) {
        validationErrors.push('Session timeout must be a positive number');
      }
      if (systemDefaults.passwordMinLength !== undefined && (parseInt(systemDefaults.passwordMinLength) < 6 || parseInt(systemDefaults.passwordMinLength) > 50)) {
        validationErrors.push('Password minimum length must be between 6 and 50 characters');
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Update email settings with validation passed
    if (emailSettings) {
      const emailUpdates = [
        { key: 'smtpHost', value: emailSettings.smtpHost, type: 'string', desc: 'SMTP server hostname' },
        { key: 'smtpPort', value: emailSettings.smtpPort, type: 'number', desc: 'SMTP server port' },
        { key: 'smtpUser', value: emailSettings.smtpUser, type: 'string', desc: 'SMTP username' },
        { key: 'fromName', value: emailSettings.fromName, type: 'string', desc: 'Email sender name' },
        { key: 'fromEmail', value: emailSettings.fromEmail, type: 'string', desc: 'Email sender address' },
        { key: 'notificationsEnabled', value: emailSettings.notificationsEnabled, type: 'boolean', desc: 'Enable email notifications' },
        { key: 'testEmailRecipient', value: emailSettings.testEmailRecipient, type: 'string', desc: 'Test email recipient' }
      ];

      for (const update of emailUpdates) {
        if (update.value !== undefined) {
          await SystemSettings.setValue(update.key, update.value, update.type, 'email', update.desc, updatedBy);
        }
      }

      // Handle password separately (don't update if it's the placeholder)
      if (emailSettings.smtpPassword && emailSettings.smtpPassword !== '***') {
        await SystemSettings.setValue('smtpPassword', emailSettings.smtpPassword, 'string', 'email', 'SMTP password', updatedBy);
      }
    }

    // Update system defaults
    if (systemDefaults) {
      if (systemDefaults.defaultUrgency !== undefined) {
        await SystemSettings.setValue('defaultUrgency', systemDefaults.defaultUrgency, 'string', 'system', 'Default request urgency level', updatedBy);
      }
      if (systemDefaults.autoAssignEnabled !== undefined) {
        await SystemSettings.setValue('autoAssignEnabled', systemDefaults.autoAssignEnabled, 'boolean', 'system', 'Enable automatic request assignment', updatedBy);
      }
      if (systemDefaults.requestNumberPrefix !== undefined) {
        await SystemSettings.setValue('requestNumberPrefix', systemDefaults.requestNumberPrefix, 'string', 'system', 'Request number prefix', updatedBy);
      }
      if (systemDefaults.defaultRequestStatus !== undefined) {
        await SystemSettings.setValue('defaultRequestStatus', systemDefaults.defaultRequestStatus, 'string', 'system', 'Default request status', updatedBy);
      }
      if (systemDefaults.enableFileUploads !== undefined) {
        await SystemSettings.setValue('enableFileUploads', systemDefaults.enableFileUploads, 'boolean', 'system', 'Enable file uploads', updatedBy);
      }
      if (systemDefaults.maxFileSize !== undefined) {
        await SystemSettings.setValue('maxFileSize', systemDefaults.maxFileSize, 'number', 'system', 'Maximum file size (MB)', updatedBy);
      }
      if (systemDefaults.sessionTimeout !== undefined) {
        await SystemSettings.setValue('sessionTimeout', systemDefaults.sessionTimeout, 'number', 'system', 'Session timeout (hours)', updatedBy);
      }
      if (systemDefaults.passwordMinLength !== undefined) {
        await SystemSettings.setValue('passwordMinLength', systemDefaults.passwordMinLength, 'number', 'system', 'Minimum password length', updatedBy);
      }
    }

    // Update organization settings
    if (organizationSettings) {
      if (organizationSettings.organizationName !== undefined) {
        await SystemSettings.setValue('organizationName', organizationSettings.organizationName, 'string', 'organization', 'Organization name', updatedBy);
      }
      if (organizationSettings.supportEmail !== undefined) {
        await SystemSettings.setValue('supportEmail', organizationSettings.supportEmail, 'string', 'organization', 'Support email address', updatedBy);
      }
      if (organizationSettings.websiteUrl !== undefined) {
        await SystemSettings.setValue('websiteUrl', organizationSettings.websiteUrl, 'string', 'organization', 'Organization website URL', updatedBy);
      }
      if (organizationSettings.address !== undefined) {
        await SystemSettings.setValue('address', organizationSettings.address, 'string', 'organization', 'Organization address', updatedBy);
      }
      if (organizationSettings.phone !== undefined) {
        await SystemSettings.setValue('phone', organizationSettings.phone, 'string', 'organization', 'Organization phone number', updatedBy);
      }
      if (organizationSettings.timeZone !== undefined) {
        await SystemSettings.setValue('timeZone', organizationSettings.timeZone, 'string', 'organization', 'Organization timezone', updatedBy);
      }
      if (organizationSettings.logoUrl !== undefined) {
        await SystemSettings.setValue('logoUrl', organizationSettings.logoUrl, 'string', 'organization', 'Organization logo URL', updatedBy);
      }
    }

    // Update notification settings
    if (notificationSettings) {
      const notifySettings = [
        'emailNotifications', 'smsNotifications', 'pushNotifications',
        'notifyOnAssignment', 'notifyOnStatusChange', 'notifyOnComment',
        'dailyDigest', 'weeklyReport'
      ];
      
      for (const setting of notifySettings) {
        if (notificationSettings[setting] !== undefined) {
          await SystemSettings.setValue(setting, notificationSettings[setting], 'boolean', 'notification', `${setting} setting`, updatedBy);
        }
      }
    }

    // Update security settings
    if (securitySettings) {
      if (securitySettings.enableTwoFactor !== undefined) {
        await SystemSettings.setValue('enableTwoFactor', securitySettings.enableTwoFactor, 'boolean', 'security', 'Enable two-factor authentication', updatedBy);
      }
      if (securitySettings.loginAttemptLimit !== undefined) {
        await SystemSettings.setValue('loginAttemptLimit', securitySettings.loginAttemptLimit, 'number', 'security', 'Login attempt limit', updatedBy);
      }
      if (securitySettings.sessionTimeout !== undefined) {
        await SystemSettings.setValue('sessionTimeout', securitySettings.sessionTimeout, 'number', 'security', 'Session timeout hours', updatedBy);
      }
      if (securitySettings.requirePasswordChange !== undefined) {
        await SystemSettings.setValue('requirePasswordChange', securitySettings.requirePasswordChange, 'boolean', 'security', 'Require password change', updatedBy);
      }
      if (securitySettings.passwordExpirationDays !== undefined) {
        await SystemSettings.setValue('passwordExpirationDays', securitySettings.passwordExpirationDays, 'number', 'security', 'Password expiration days', updatedBy);
      }
      if (securitySettings.enableAuditLog !== undefined) {
        await SystemSettings.setValue('enableAuditLog', securitySettings.enableAuditLog, 'boolean', 'security', 'Enable audit logging', updatedBy);
      }
      if (securitySettings.allowMultipleSessions !== undefined) {
        await SystemSettings.setValue('allowMultipleSessions', securitySettings.allowMultipleSessions, 'boolean', 'security', 'Allow multiple sessions', updatedBy);
      }
    }

    // Update maintenance settings
    if (maintenanceSettings) {
      if (maintenanceSettings.maintenanceMode !== undefined) {
        await SystemSettings.setValue('maintenanceMode', maintenanceSettings.maintenanceMode, 'boolean', 'maintenance', 'Maintenance mode enabled', updatedBy);
      }
      if (maintenanceSettings.backupEnabled !== undefined) {
        await SystemSettings.setValue('backupEnabled', maintenanceSettings.backupEnabled, 'boolean', 'maintenance', 'Automatic backups enabled', updatedBy);
      }
      if (maintenanceSettings.backupFrequency !== undefined) {
        await SystemSettings.setValue('backupFrequency', maintenanceSettings.backupFrequency, 'string', 'maintenance', 'Backup frequency', updatedBy);
      }
      if (maintenanceSettings.autoCleanupDays !== undefined) {
        await SystemSettings.setValue('autoCleanupDays', maintenanceSettings.autoCleanupDays, 'number', 'maintenance', 'Auto cleanup days', updatedBy);
      }
      if (maintenanceSettings.enableSystemAlerts !== undefined) {
        await SystemSettings.setValue('enableSystemAlerts', maintenanceSettings.enableSystemAlerts, 'boolean', 'maintenance', 'Enable system alerts', updatedBy);
      }
      if (maintenanceSettings.debugMode !== undefined) {
        await SystemSettings.setValue('debugMode', maintenanceSettings.debugMode, 'boolean', 'maintenance', 'Debug mode enabled', updatedBy);
      }
    }

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Test Email Configuration
const testEmailSettings = async (req, res) => {
  try {
    console.log('🧪 Test email request received:', req.body);
    const { recipient } = req.body;
    
    if (!recipient) {
      console.log('❌ No recipient provided');
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      console.log('❌ Invalid email format:', recipient);
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format'
      });
    }

    // Check if SystemSettings is available
    if (!SystemSettings) {
      console.log('❌ SystemSettings model not available');
      return res.status(500).json({
        success: false,
        message: 'System settings not available. Please configure email settings first.'
      });
    }

    console.log('📧 Loading email settings from database...');
    // Get current email settings
    const emailSettings = await SystemSettings.getByCategory('email');
    console.log('📧 Email settings loaded:', JSON.stringify(emailSettings, null, 2));
    
    if (!emailSettings.smtpHost || !emailSettings.smtpPort) {
      return res.status(400).json({
        success: false,
        message: 'SMTP configuration incomplete. Please configure SMTP host and port.'
      });
    }
    
    if (!emailSettings.smtpUser || !emailSettings.smtpPassword) {
      return res.status(400).json({
        success: false,
        message: 'SMTP authentication credentials missing. Please configure SMTP username and password.'
      });
    }
    
    // Check for placeholder values that haven't been configured
    if (emailSettings.smtpUser === 'your-email@gmail.com' || emailSettings.smtpPassword === 'your-app-password') {
      return res.status(400).json({
        success: false,
        message: 'SMTP credentials are still set to default placeholder values. Please configure your actual email credentials.'
      });
    }

    console.log('📦 Importing nodemailer...');
    // Import nodemailer dynamically to avoid issues if not installed
    const nodemailer = require('nodemailer');
    
    console.log('🔧 Creating transporter with settings...');
    // Create transporter with current settings
    const transporterConfig = {
      host: emailSettings.smtpHost,
      port: parseInt(emailSettings.smtpPort),
      secure: parseInt(emailSettings.smtpPort) === 465, // true for 465, false for other ports
      auth: emailSettings.smtpUser && emailSettings.smtpPassword ? {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPassword
      } : null,
      tls: {
        rejectUnauthorized: false // For development/testing
      }
    };
    console.log('🔧 Transporter config:', JSON.stringify({ ...transporterConfig, auth: transporterConfig.auth ? { user: transporterConfig.auth.user, pass: '***' } : null }, null, 2));
    
    const transporter = nodemailer.createTransport(transporterConfig);

    console.log('🔍 Verifying SMTP connection...');
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    console.log('📨 Preparing test email...');
    // Send test email
    const mailOptions = {
      from: `"${emailSettings.fromName || 'Houses of Light'}" <${emailSettings.fromEmail || 'noreply@housesoflight.org'}>`,
      to: recipient,
      subject: 'Houses of Light - Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Email Configuration Test</h2>
          <p>This is a test email from your Houses of Light Request Management System.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>SMTP Host: ${emailSettings.smtpHost}</li>
            <li>SMTP Port: ${emailSettings.smtpPort}</li>
            <li>From Name: ${emailSettings.fromName || 'Houses of Light'}</li>
            <li>From Email: ${emailSettings.fromEmail || 'noreply@housesoflight.org'}</li>
            <li>Test Time: ${new Date().toLocaleString()}</li>
          </ul>
          <p>If you received this email, your email configuration is working correctly!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from Houses of Light Request Management System.
          </p>
        </div>
      `
    };
    console.log('📨 Mail options:', JSON.stringify({ ...mailOptions, html: '[HTML_CONTENT]' }, null, 2));

    console.log('🚀 Sending test email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);

    res.json({
      success: true,
      message: `Test email sent successfully to ${recipient}`,
      details: {
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        fromName: emailSettings.fromName || 'Houses of Light',
        fromEmail: emailSettings.fromEmail || 'noreply@housesoflight.org'
      }
    });

  } catch (error) {
    console.error('Test email error:', error);
    
    let errorMessage = 'Failed to send test email';
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Please check your username and password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to SMTP server. Please check your host and port settings.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Socket error. Please check your network connection and SMTP settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Email Template Management Functions

// Get all email templates
const getEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.findAll({
      order: [['templateName', 'ASC']]
    });

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single email template
const getEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await EmailTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Get email template error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update email template
const updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { templateName, subjectTemplate, htmlTemplate, description, isActive } = req.body;
    const updatedBy = req.user.id;

    const template = await EmailTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Validate required fields
    if (!templateName || !subjectTemplate || !htmlTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Template name, subject, and HTML content are required'
      });
    }

    await template.update({
      templateName,
      subjectTemplate,
      htmlTemplate,
      description,
      isActive: isActive !== undefined ? isActive : template.isActive,
      updatedBy
    });

    res.json({
      success: true,
      message: 'Email template updated successfully',
      template
    });
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Preview email template with sample data
const previewEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { variables = {} } = req.body;

    const template = await EmailTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Default sample variables
    const sampleVariables = {
      userName: 'John Doe',
      requestNumber: 'REQ-001234',
      requestType: 'Event Request',
      status: 'In Progress',
      urgency: 'Normal',
      department: 'Event Management',
      assignedTo: 'Jane Smith',
      commentBy: 'Support Team',
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      fromName: 'Houses of Light',
      fromEmail: 'noreply@housesoflight.org',
      testTime: new Date().toLocaleString(),
      ...variables
    };

    const rendered = template.render(sampleVariables);

    res.json({
      success: true,
      preview: rendered,
      sampleVariables
    });
  } catch (error) {
    console.error('Preview email template error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send test email using template
const sendTestEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient, variables = {} } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format'
      });
    }

    // Get email template
    const template = await EmailTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Check SMTP settings
    if (!SystemSettings) {
      return res.status(500).json({
        success: false,
        message: 'System settings not available. Please configure email settings first.'
      });
    }

    const emailSettings = await SystemSettings.getByCategory('email');
    
    if (!emailSettings.smtpHost || !emailSettings.smtpPort || !emailSettings.smtpUser || !emailSettings.smtpPassword) {
      return res.status(400).json({
        success: false,
        message: 'SMTP configuration incomplete. Please configure email settings first.'
      });
    }

    // Sample variables for test
    const testVariables = {
      userName: 'Test User',
      requestNumber: 'REQ-TEST-001',
      requestType: 'Test Request',
      status: 'Test Status',
      urgency: 'Normal',
      department: 'Test Department',
      assignedTo: 'Test Admin',
      commentBy: 'System Administrator',
      smtpHost: emailSettings.smtpHost,
      smtpPort: emailSettings.smtpPort,
      fromName: emailSettings.fromName || 'Houses of Light',
      fromEmail: emailSettings.fromEmail || 'noreply@housesoflight.org',
      testTime: new Date().toLocaleString(),
      ...variables
    };

    // Render template
    const rendered = template.render(testVariables);

    // Create transporter
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtpHost,
      port: parseInt(emailSettings.smtpPort),
      secure: parseInt(emailSettings.smtpPort) === 465,
      auth: {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Send email
    await transporter.sendMail({
      from: `"${emailSettings.fromName || 'Houses of Light'}" <${emailSettings.fromEmail || 'noreply@housesoflight.org'}>`,
      to: recipient,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html
    });

    res.json({
      success: true,
      message: `Test email sent successfully to ${recipient}`,
      templateUsed: template.templateName
    });

  } catch (error) {
    console.error('Send test email template error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  getUserStats,
  getRequestAnalytics,
  getDetailedReports,
  getSystemMetrics,
  exportAnalyticsCSV,
  exportAnalyticsPDF,
  refreshAnalyticsData,
  getSystemSettings,
  updateSystemSettings,
  testEmailSettings,
  getEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  previewEmailTemplate,
  sendTestEmailTemplate
};