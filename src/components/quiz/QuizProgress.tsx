import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

interface QuizProgressProps {
  total: number;
  current: number;
  answered: number[];
  onNavigate: (index: number) => void;
}

export const QuizProgress = ({ total, current, answered, onNavigate }: QuizProgressProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: total }, (_, i) => {
        const isAnswered = answered.includes(i);
        const isCurrent = current === i;

        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all',
              isCurrent && 'ring-2 ring-primary ring-offset-2',
              isAnswered && !isCurrent && 'bg-success/20 text-success border border-success/30',
              !isAnswered && !isCurrent && 'bg-muted text-muted-foreground hover:bg-muted/80',
              isCurrent && isAnswered && 'bg-primary text-primary-foreground',
              isCurrent && !isAnswered && 'bg-primary text-primary-foreground'
            )}
          >
            {isAnswered ? <Check className="w-4 h-4" /> : i + 1}
          </button>
        );
      })}
    </div>
  );
};
