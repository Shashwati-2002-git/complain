import { createContext } from 'react';
import { Socket } from 'socket.io-client';

export interface NotificationType {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface OnlineUser {
  userId: string;
  name: string;
  role: string;
  connectedAt: string;
}

export interface ComplaintUpdate {
  status?: string;
  priority?: string;
  assignedTo?: string;
  category?: string;
}

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationType[];
  onlineUsers: OnlineUser[];
  sendMessage: (complaintId: string, message: string, isInternal?: boolean) => void;
  updateComplaint: (complaintId: string, updates: ComplaintUpdate, note?: string) => void;
  markNotificationsRead: (notificationIds: string[]) => void;
  joinComplaintRoom: (complaintId: string) => void;
  leaveComplaintRoom: (complaintId: string) => void;
  notifyNewComplaint: (complaintId: string) => void;
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined);