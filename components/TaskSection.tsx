import React from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface TaskSectionProps {
  title: string;
  checked: boolean;
  onToggle: () => void;
}

export const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  checked,
  onToggle,
}) => {
  const { themeConfig, themeMarkers } = useTheme();
  const marker = checked ? themeMarkers.completed : themeMarkers.pending;

  return (
    <div
      className={`
        flex items-center justify-between p-4 mb-4 border rounded-lg cursor-pointer transition-all
        ${checked
          ? `${themeConfig.sectionCheckedBg} ${themeConfig.sectionCheckedBorder} ${themeConfig.sectionCheckedText}`
          : `${themeConfig.sectionUncheckedBg} ${themeConfig.sectionUncheckedBorder} ${themeConfig.bodyText}`
        }
      `}
      onClick={onToggle}
    >
      <span className={`font-medium ${checked ? themeConfig.headingColor : themeConfig.bodyText}`}>
        {title}
      </span>
      <span className="text-2xl">{marker}</span>
    </div>
  );
};