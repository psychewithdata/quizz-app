import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RenderLatex } from '@/lib/katex';
import { QuizOption } from './QuizOption';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: string;
  content: string;
  options: string[];
  question_type: 'single_choice' | 'multiple_choice';
  correct_answers?: number[];
  explanation?: string;
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  selectedOptions: number[];
  onSelectOption: (optionIndex: number) => void;
  showResult?: boolean;
}

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const QuestionCard = ({
  question,
  questionNumber,
  selectedOptions,
  onSelectOption,
  showResult = false,
}: QuestionCardProps) => {
  const handleOptionClick = (index: number) => {
    if (showResult) return;
    onSelectOption(index);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg font-medium">
            <span className="text-primary font-bold mr-2">Câu {questionNumber}:</span>
            <RenderLatex content={question.content} className="inline" />
          </CardTitle>
          <Badge variant="outline" className="flex-shrink-0">
            {question.question_type === 'single_choice' ? 'Một đáp án' : 'Nhiều đáp án'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedOptions.includes(index);
          const isCorrect = showResult && question.correct_answers?.includes(index);
          const isIncorrect = showResult && isSelected && !question.correct_answers?.includes(index);

          return (
            <QuizOption
              key={index}
              label={optionLabels[index]}
              content={option}
              isSelected={isSelected}
              isCorrect={isCorrect}
              isIncorrect={isIncorrect}
              showResult={showResult}
              disabled={showResult}
              onClick={() => handleOptionClick(index)}
            />
          );
        })}

        {showResult && question.explanation && (
          <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-xl">
            <h4 className="font-semibold text-info mb-2">Giải thích:</h4>
            <RenderLatex content={question.explanation} className="text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
