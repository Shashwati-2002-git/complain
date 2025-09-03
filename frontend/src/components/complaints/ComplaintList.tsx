import React from 'react';
import { Complaint } from '../../contexts/ComplaintContext';
import { ComplaintCard } from './ComplaintCard';

interface ComplaintListProps {
  complaints: Complaint[];
  showActions: boolean;
  isAdmin?: boolean;
  isAgent?: boolean;
  onSelectComplaint?: (id: string) => void;
}

export function ComplaintList({ complaints, showActions, isAdmin = false, isAgent = false, onSelectComplaint }: ComplaintListProps) {
  if (complaints.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">No complaints found</h3>
        <p className="text-gray-500">No complaints match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {complaints.map((complaint) => (
        <ComplaintCard
          key={complaint.id}
          complaint={complaint}
          showActions={showActions}
          isAdmin={isAdmin}
          isAgent={isAgent}
          onSelectComplaint={onSelectComplaint}
        />
      ))}
    </div>
  );
}