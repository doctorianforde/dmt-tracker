import React from 'react';
import { statusColors } from '@/lib/themes';

// Define the structure of a checklist item
interface ChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  description?: string;
}

interface ProgressChecklistProps {
  items: ChecklistItem[];
  onStatusChange?: (id: string, newStatus: ChecklistItem['status']) => void;
}

const ProgressChecklist: React.FC<ProgressChecklistProps> = ({ items, onStatusChange }) => {
  // Helper to normalize status keys if they vary slightly in data source
  const getStatusKey = (status: string): keyof typeof statusColors => {
    const normalized = status.toLowerCase().replace(/\s+/g, '-');
    if (normalized === 'done' || normalized === 'approved') return 'completed';
    if (normalized === 'review' || normalized === 'in progress') return 'in-progress';
    if (normalized === 'denied' || normalized === 'fail') return 'rejected';

    // Default to pending if no match
    if (normalized in statusColors) {
      return normalized as keyof typeof statusColors;
    }
    return 'pending';
  };

  return (
    <div className="w-full space-y-4">
      {items.map((item) => {
        const statusKey = getStatusKey(item.status);
        const themeStyle = statusColors[statusKey] || statusColors.pending;

        return (
          <div
            key={item.id}
            className={`flex items-start p-4 rounded-lg border-l-4 transition-all duration-200 ${themeStyle.borderColor} ${themeStyle.bgColor} ${themeStyle.textColor}`}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-sm md:text-base">{item.label}</h3>
              {item.description && (
                <p className="text-sm opacity-80 mt-1">{item.description}</p>
              )}
            </div>

            {/* Status Badge using Theme Colors */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${themeStyle.badgeBg} ${themeStyle.badgeText}`}>
              {item.status.replace(/-/g, ' ').toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressChecklist;
