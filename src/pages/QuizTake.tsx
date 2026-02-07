import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { QuizProgress } from '@/components/quiz/QuizProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Send, Trophy, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

// Demo questions with LaTeX
const demoQuestions = [
  {
    id: '1',
    content: 'Tính giới hạn: $\\lim_{x \\to 0} \\frac{\\sin x}{x}$',
    options: ['$0$', '$1$', '$\\infty$', 'Không tồn tại'],
    question_type: 'single_choice' as const,
    correct_answers: [1],
    explanation: 'Đây là giới hạn cơ bản trong giải tích. Theo định lý L\'Hôpital hoặc khai triển Taylor, ta có $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.',
  },
  {
    id: '2',
    content: 'Phương trình $x^2 - 5x + 6 = 0$ có nghiệm là:',
    options: ['$x = 1$ và $x = 6$', '$x = 2$ và $x = 3$', '$x = -2$ và $x = -3$', '$x = 1$ và $x = -6$'],
    question_type: 'single_choice' as const,
    correct_answers: [1],
    explanation: 'Phân tích thành nhân tử: $x^2 - 5x + 6 = (x-2)(x-3) = 0$, suy ra $x = 2$ hoặc $x = 3$.',
  },
  {
    id: '3',
    content: 'Tích phân $\\int_0^1 x^2 dx$ bằng:',
    options: ['$\\frac{1}{2}$', '$\\frac{1}{3}$', '$\\frac{1}{4}$', '$1$'],
    question_type: 'single_choice' as const,
    correct_answers: [1],
    explanation: '$\\int_0^1 x^2 dx = \\left[\\frac{x^3}{3}\\right]_0^1 = \\frac{1}{3} - 0 = \\frac{1}{3}$',
  },
  {
    id: '4',
    content: 'Đạo hàm của hàm số $f(x) = e^{2x}$ là:',
    options: ['$e^{2x}$', '$2e^{2x}$', '$2xe^{2x}$', '$e^{2x-1}$'],
    question_type: 'single_choice' as const,
    correct_answers: [1],
    explanation: 'Áp dụng quy tắc dây chuyền: $f\'(x) = e^{2x} \\cdot (2x)\' = 2e^{2x}$',
  },
  {
    id: '5',
    content: 'Trong tam giác ABC, nếu $\\sin A = \\frac{3}{5}$ và $\\cos A > 0$, thì $\\cos A$ bằng:',
    options: ['$\\frac{3}{5}$', '$\\frac{4}{5}$', '$\\frac{5}{4}$', '$\\frac{5}{3}$'],
    question_type: 'single_choice' as const,
    correct_answers: [1],
    explanation: 'Ta có $\\sin^2 A + \\cos^2 A = 1$, suy ra $\\cos^2 A = 1 - \\frac{9}{25} = \\frac{16}{25}$. Vì $\\cos A > 0$ nên $\\cos A = \\frac{4}{5}$.',
  },
];

const QuizTake = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { examId } = useParams();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const questions = demoQuestions;
  const currentQuestion = questions[currentIndex];
  const answeredIndices = Object.keys(answers).map((id) =>
    questions.findIndex((q) => q.id === id)
  );

  const handleSelectOption = (optionIndex: number) => {
    if (submitted) return;

    const questionId = currentQuestion.id;
    const currentAnswers = answers[questionId] || [];

    if (currentQuestion.question_type === 'single_choice') {
      setAnswers({ ...answers, [questionId]: [optionIndex] });
    } else {
      // Multiple choice - toggle selection
      if (currentAnswers.includes(optionIndex)) {
        setAnswers({
          ...answers,
          [questionId]: currentAnswers.filter((i) => i !== optionIndex),
        });
      } else {
        setAnswers({
          ...answers,
          [questionId]: [...currentAnswers, optionIndex],
        });
      }
    }
  };

  const handleTimeUp = useCallback(() => {
    if (!submitted) {
      handleSubmit();
    }
  }, [submitted]);

  const handleSubmit = () => {
    // Calculate score
    let correct = 0;
    questions.forEach((question) => {
      const userAnswers = answers[question.id] || [];
      const correctAnswers = question.correct_answers;

      if (
        userAnswers.length === correctAnswers.length &&
        userAnswers.every((a) => correctAnswers.includes(a))
      ) {
        correct++;
      }
    });

    setScore(correct);
    setSubmitted(true);
    setShowSubmitDialog(false);
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 max-w-4xl">
        {/* Quiz Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Đề thi Toán - Demo</h1>
              <p className="text-muted-foreground">
                {submitted
                  ? `Kết quả: ${score}/${questions.length} câu đúng`
                  : `Câu ${currentIndex + 1}/${questions.length}`}
              </p>
            </div>

            {!submitted && (
              <QuizTimer duration={30 * 60} onTimeUp={handleTimeUp} />
            )}
          </div>

          {/* Progress */}
          <QuizProgress
            total={questions.length}
            current={currentIndex}
            answered={answeredIndices}
            onNavigate={setCurrentIndex}
          />
        </div>

        {/* Question Card */}
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="mb-6 overflow-hidden">
              <div className="hero-gradient p-8 text-center text-primary-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Hoàn thành bài thi!</h2>
                <p className="text-primary-foreground/80 mb-4">
                  Bạn đã trả lời đúng {score}/{questions.length} câu hỏi
                </p>
                <div className="text-5xl font-bold">
                  {((score / questions.length) * 10).toFixed(1)}/10
                </div>
              </div>
              <CardContent className="p-6 flex justify-center gap-4">
                <Button variant="outline" onClick={handleRestart}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Làm lại
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  Về Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Show all questions with results */}
            <div className="space-y-6">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  questionNumber={index + 1}
                  selectedOptions={answers[question.id] || []}
                  onSelectOption={() => {}}
                  showResult
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              selectedOptions={answers[currentQuestion.id] || []}
              onSelectOption={handleSelectOption}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Câu trước
              </Button>

              {currentIndex === questions.length - 1 ? (
                <Button onClick={() => setShowSubmitDialog(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Nộp bài
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                >
                  Câu tiếp
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* Submit Dialog */}
        <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận nộp bài?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn đã trả lời {Object.keys(answers).length}/{questions.length} câu hỏi.
                {Object.keys(answers).length < questions.length && (
                  <span className="text-warning block mt-2">
                    Còn {questions.length - Object.keys(answers).length} câu chưa trả lời.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit}>Nộp bài</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default QuizTake;
