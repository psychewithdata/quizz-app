import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface QuizTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  isPaused?: boolean;
}

export const QuizTimer = ({ duration, onTimeUp, isPaused = false }: QuizTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / duration) * 100;

  const isWarning = percentage <= 20 && percentage > 10;
  const isDanger = percentage <= 10;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all',
        isDanger && 'border-destructive bg-destructive/10 timer-danger',
        isWarning && 'border-warning bg-warning/10 timer-warning',
        !isDanger && !isWarning && 'border-border bg-card'
      )}
    >
      {isDanger ? (
        <AlertTriangle className="w-5 h-5 text-destructive" />
      ) : (
        <Clock className={cn('w-5 h-5', isWarning ? 'text-warning' : 'text-muted-foreground')} />
      )}
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Thời gian còn lại</span>
        <span
          className={cn(
            'text-xl font-mono font-bold tabular-nums',
            isDanger && 'text-destructive',
            isWarning && 'text-warning',
            !isDanger && !isWarning && 'text-foreground'
          )}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden ml-2">
        <div
          className={cn(
            'h-full transition-all duration-1000',
            isDanger && 'bg-destructive',
            isWarning && 'bg-warning',
            !isDanger && !isWarning && 'bg-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
