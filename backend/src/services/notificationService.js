import { Notification } from '../models/Notification.js';

/**
 * Create a notification
 * @param {string} recipientId - The ID of the notification recipient
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type
 * @param {string} relatedId - The ID of the related item (complaint, message, etc.)
 * @param {string} senderId - The ID of the notification sender
 * @returns {Promise<object>} The created notification
 */
export const createNotification = async (recipientId, title, message, type, relatedId, senderId = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      title,
      message,
      type,
      relatedId,
      sender: senderId,
      isRead: false,
      createdAt: new Date()
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple recipients
 * @param {Array} recipientIds - Array of recipient IDs
 * @param {object} notificationData - Notification data (title, message, type, relatedId, sender)
 * @returns {Promise<Array>} Array of created notifications
 */
export const createNotifications = async (recipientIds, notificationData) => {
  try {
    const { title, message, type, relatedId, sender } = notificationData;
    
    // Filter out duplicates and empty recipients
    const uniqueRecipients = [...new Set(recipientIds.filter(id => id))];
    
    // Create notifications for each recipient
    const notifications = uniqueRecipients.map(recipientId => ({
      recipient: recipientId,
      title,
      message,
      type,
      relatedId,
      sender,
      isRead: false,
      createdAt: new Date()
    }));
    
    // Batch insert notifications
    const createdNotifications = await Notification.insertMany(notifications);
    return createdNotifications;
  } catch (error) {
    console.error('Error creating multiple notifications:', error);
    throw error;
  }
};