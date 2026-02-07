import { cn } from '@/lib/utils';
import { RenderLatex } from '@/lib/katex';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuizOptionProps {
  label: string;
  content: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  showResult?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const QuizOption = ({
  label,
  content,
  isSelected,
  isCorrect,
  isIncorrect,
  showResult,
  disabled,
  onClick,
}: QuizOptionProps) => {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'quiz-option w-full text-left flex items-start gap-4',
        isSelected && !showResult && 'selected',
        showResult && isCorrect && 'correct',
        showResult && isIncorrect && 'incorrect',
        disabled && 'cursor-not-allowed opacity-70'
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all',
          isSelected && !showResult && 'bg-primary text-primary-foreground border-primary',
          showResult && isCorrect && 'bg-success text-success-foreground border-success',
          showResult && isIncorrect && 'bg-destructive text-destructive-foreground border-destructive',
          !isSelected && !showResult && 'border-border text-muted-foreground'
        )}
      >
        {showResult && isCorrect && <Check className="w-5 h-5" />}
        {showResult && isIncorrect && <X className="w-5 h-5" />}
        {!showResult && label}
      </span>
      <div className="flex-1 pt-2">
        <RenderLatex content={content} />
      </div>
    </motion.button>
  );
};
