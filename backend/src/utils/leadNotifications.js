/**
 * Lead Notification Utilities
 *
 * Handles real-time notifications for lead assignment and pipeline events
 * using Socket.IO for immediate delivery to connected clients.
 *
 * @version 1.0.0
 * @since 2026-01-22
 */

/**
 * Send lead assignment notification to employee
 * Notifies the assigned employee about the new lead via Socket.IO
 *
 * @param {string|ObjectId} userId - User ID to notify
 * @param {Object} data - Notification data
 * @param {string} data.leadId - ID of the assigned lead
 * @param {string} data.leadEmail - Email of the lead
 * @param {string} [data.leadName] - Name of the lead
 * @param {string} data.assignedBy - Name of the person who assigned the lead
 * @param {boolean} [data.wasReassigned] - Whether this was a reassignment
 * @param {string} [data.notes] - Notes about the assignment
 * @returns {Promise<void>}
 *
 * @example
 * await sendLeadAssigned(employeeId, {
 *   leadId: lead._id,
 *   leadEmail: lead.email,
 *   leadName: lead.name,
 *   assignedBy: 'John Doe',
 *   notes: 'Hot lead from trade show'
 * });
 */
export const sendLeadAssigned = async (userId, data) => {
  const io = global.io;
  if (!io) {
    console.warn('Socket.IO not initialized, skipping lead assignment notification');
    return;
  }

  try {
    const notification = {
      type: 'lead_assigned',
      timestamp: new Date().toISOString(),
      data: {
        leadId: data.leadId?.toString(),
        leadEmail: data.leadEmail,
        leadName: data.leadName || data.leadEmail,
        assignedBy: data.assignedBy,
        wasReassigned: data.wasReassigned || false,
        notes: data.notes,
        message: data.wasReassigned
          ? `Lead "${data.leadName || data.leadEmail}" was reassigned to you`
          : `New lead "${data.leadName || data.leadEmail}" assigned to you`
      }
    };

    io.to(`user:${userId}`).emit('lead_assigned', notification);

    // Also emit to general leads room for dashboard updates
    io.to('leads').emit('lead_updated', {
      leadId: data.leadId?.toString(),
      type: 'assignment',
      timestamp: notification.timestamp
    });

  } catch (error) {
    console.error('Error sending lead assignment notification:', error);
  }
};

/**
 * Send pipeline stage update notification
 * Notifies the assigned employee about pipeline stage changes
 *
 * @param {string|ObjectId} userId - User ID to notify
 * @param {Object} data - Notification data
 * @param {string} data.leadId - ID of the lead
 * @param {string} data.leadEmail - Email of the lead
 * @param {string} [data.leadName] - Name of the lead
 * @param {string} data.previousStage - Previous pipeline stage
 * @param {string} data.newStage - New pipeline stage
 * @param {string} [data.notes] - Notes about the stage change
 * @returns {Promise<void>}
 *
 * @example
 * await sendPipelineUpdated(employeeId, {
 *   leadId: lead._id,
 *   leadEmail: lead.email,
 *   leadName: lead.name,
 *   previousStage: 'contacted',
 *   newStage: 'meeting_scheduled',
 *   notes: 'Demo set for Tuesday'
 * });
 */
export const sendPipelineUpdated = async (userId, data) => {
  const io = global.io;
  if (!io) {
    console.warn('Socket.IO not initialized, skipping pipeline update notification');
    return;
  }

  try {
    const notification = {
      type: 'pipeline_updated',
      timestamp: new Date().toISOString(),
      data: {
        leadId: data.leadId?.toString(),
        leadEmail: data.leadEmail,
        leadName: data.leadName || data.leadEmail,
        previousStage: data.previousStage,
        newStage: data.newStage,
        notes: data.notes,
        message: `Lead "${data.leadName || data.leadEmail}" moved from ${data.previousStage} to ${data.newStage}`
      }
    };

    io.to(`user:${userId}`).emit('pipeline_updated', notification);

    // Emit to general leads room for dashboard updates
    io.to('leads').emit('lead_updated', {
      leadId: data.leadId?.toString(),
      type: 'pipeline',
      stage: data.newStage,
      timestamp: notification.timestamp
    });

  } catch (error) {
    console.error('Error sending pipeline update notification:', error);
  }
};

/**
 * Send lead value update notification
 * Notifies about changes to estimated value
 *
 * @param {string|ObjectId} userId - User ID to notify
 * @param {Object} data - Notification data
 * @param {string} data.leadId - ID of the lead
 * @param {number} data.oldValue - Previous estimated value
 * @param {number} data.newValue - New estimated value
 * @returns {Promise<void>}
 */
export const sendValueUpdated = async (userId, data) => {
  const io = global.io;
  if (!io) {
    return;
  }

  try {
    const notification = {
      type: 'value_updated',
      timestamp: new Date().toISOString(),
      data: {
        leadId: data.leadId?.toString(),
        oldValue: data.oldValue,
        newValue: data.newValue,
        difference: data.newValue - data.oldValue,
        message: `Lead estimated value updated from ${data.oldValue} to ${data.newValue}`
      }
    };

    io.to(`user:${userId}`).emit('value_updated', notification);
  } catch (error) {
    console.error('Error sending value update notification:', error);
  }
};

/**
 * Send bulk assignment notification
 * Notifies about completion of bulk lead assignment
 *
 * @param {string|ObjectId} userId - User ID to notify (typically admin/manager)
 * @param {Object} data - Notification data
 * @param {number} data.totalLeads - Total leads in batch
 * @param {number} data.assignedCount - Number successfully assigned
 * @param {Object[]} data.details - Array of assignment details
 * @returns {Promise<void>}
 */
export const sendBulkAssignmentComplete = async (userId, data) => {
  const io = global.io;
  if (!io) {
    return;
  }

  try {
    const notification = {
      type: 'bulk_assignment_complete',
      timestamp: new Date().toISOString(),
      data: {
        totalLeads: data.totalLeads,
        assignedCount: data.assignedCount,
        failedCount: data.totalLeads - data.assignedCount,
        message: `Bulk assignment complete: ${data.assignedCount} of ${data.totalLeads} leads assigned`
      }
    };

    io.to(`user:${userId}`).emit('bulk_assignment_complete', notification);
  } catch (error) {
    console.error('Error sending bulk assignment notification:', error);
  }
};

/**
 * Send upcoming birthday/anniversary notification
 * Notifies about leads with upcoming personalization events
 *
 * @param {string|ObjectId} userId - User ID to notify
 * @param {Object} data - Notification data
 * @param {string} data.eventType - 'birthday' or 'anniversary'
 * @param {number} data.count - Number of upcoming events
 * @param {Object[]} data.leads - Array of leads with upcoming events
 * @returns {Promise<void>}
 */
export const sendUpcomingPersonalizationEvents = async (userId, data) => {
  const io = global.io;
  if (!io) {
    return;
  }

  try {
    const notification = {
      type: 'upcoming_events',
      timestamp: new Date().toISOString(),
      data: {
        eventType: data.eventType,
        count: data.count,
        leads: data.leads.map(lead => ({
          id: lead._id?.toString(),
          name: lead.name,
          email: lead.email,
          eventDate: data.eventType === 'birthday' ? lead.getUpcomingBirthday() : lead.getUpcomingAnniversary()
        })),
        message: `${data.count} leads have upcoming ${data.eventType}s`
      }
    };

    io.to(`user:${userId}`).emit('upcoming_events', notification);
  } catch (error) {
    console.error('Error sending personalization events notification:', error);
  }
};

/**
 * Broadcast lead update to all connected dashboard users
 * Used for real-time dashboard synchronization
 *
 * @param {Object} data - Update data
 * @param {string} data.leadId - ID of the updated lead
 * @param {string} [data.type] - Type of update
 * @returns {void}
 */
export const broadcastLeadUpdate = (data) => {
  const io = global.io;
  if (!io) {
    return;
  }

  try {
    io.to('leads').emit('lead_updated', {
      leadId: data.leadId?.toString(),
      type: data.type || 'update',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error broadcasting lead update:', error);
  }
};

/**
 * Send notification to multiple users (e.g., all employees in a department)
 *
 * @param {string[]} userIds - Array of user IDs to notify
 * @param {string} eventType - Type of event
 * @param {Object} data - Notification data
 * @returns {Promise<void>}
 */
export const sendMultipleUsers = async (userIds, eventType, data) => {
  const io = global.io;
  if (!io) {
    return;
  }

  try {
    const notification = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    };

    userIds.forEach(userId => {
      io.to(`user:${userId}`).emit(eventType, notification);
    });
  } catch (error) {
    console.error(`Error sending ${eventType} notification:`, error);
  }
};

export default {
  sendLeadAssigned,
  sendPipelineUpdated,
  sendValueUpdated,
  sendBulkAssignmentComplete,
  sendUpcomingPersonalizationEvents,
  broadcastLeadUpdate,
  sendMultipleUsers
};
