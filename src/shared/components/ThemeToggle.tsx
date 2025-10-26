import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '@/components/button';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (resolvedTheme === 'dark') {
      return <Moon className="h-5 w-5" />;
    }
    return <Sun className="h-5 w-5" />;
  };

  const getLabel = () => {
    if (theme === 'system') return 'System';
    if (theme === 'dark') return 'Dark';
    return 'Light';
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-lg bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 relative group"
      title={`Current: ${getLabel()} - Click to cycle`}
    >
      <div className="transition-transform duration-300 group-hover:scale-110">
        {getIcon()}
      </div>
      <span className="sr-only">Toggle theme (Current: {getLabel()})</span>
    </Button>
  );
};
