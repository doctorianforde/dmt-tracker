import React from 'react';
import type { ThemeChoice } from '@/types';
import { THEME_MARKERS } from '@/lib/themes';

interface TaskSectionProps {
  title: string;
  checked: boolean;
  themeName: ThemeChoice;
  onToggle: () => void;
}

export const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  checked,
  themeName,
  onToggle,
}) => {
  const markers = THEME_MARKERS[themeName];
  const marker = checked ? markers.completed : markers.pending;

  return (
    <div
      className={`
        flex items-center justify-between p-4 mb-4 border rounded-lg cursor-pointer transition-all
        ${checked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
      `}
      onClick={onToggle}
    >
      <span className="text-lg font-medium">{title}</span>
      <span className="text-2xl">{marker}</span>
    </div>
  );
};