import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Users, Play, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const demoExams = [
  {
    id: '1',
    title: 'Đề thi Toán học - Giải tích',
    description: 'Ôn tập kiến thức giải tích: giới hạn, đạo hàm, tích phân',
    duration_minutes: 30,
    question_count: 5,
    attempts: 245,
    rating: 4.8,
    subject: 'Toán học',
    difficulty: 'Trung bình',
  },
  {
    id: '2',
    title: 'Đề thi Vật lý - Cơ học',
    description: 'Kiểm tra kiến thức về động học, động lực học và các định luật Newton',
    duration_minutes: 45,
    question_count: 20,
    attempts: 189,
    rating: 4.6,
    subject: 'Vật lý',
    difficulty: 'Khó',
  },
  {
    id: '3',
    title: 'Đề thi Hóa học - Hữu cơ',
    description: 'Các phản ứng hóa học hữu cơ cơ bản và ứng dụng',
    duration_minutes: 60,
    question_count: 30,
    attempts: 156,
    rating: 4.5,
    subject: 'Hóa học',
    difficulty: 'Trung bình',
  },
  {
    id: '4',
    title: 'Đề thi Tiếng Anh - Grammar',
    description: 'Kiểm tra ngữ pháp tiếng Anh nâng cao',
    duration_minutes: 40,
    question_count: 25,
    attempts: 312,
    rating: 4.7,
    subject: 'Tiếng Anh',
    difficulty: 'Dễ',
  },
];

const ExamList = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Dễ':
        return 'bg-success/10 text-success border-success/20';
      case 'Trung bình':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Khó':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return '';
    }
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

      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Danh sách đề thi</h1>
          <p className="text-muted-foreground">
            Chọn một đề thi để bắt đầu luyện tập
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {demoExams.map((exam) => (
            <motion.div key={exam.id} variants={item}>
              <Card className="h-full card-hover overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline">{exam.subject}</Badge>
                    <Badge className={getDifficultyColor(exam.difficulty)}>
                      {exam.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{exam.title}</CardTitle>
                  <CardDescription>{exam.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{exam.duration_minutes} phút</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{exam.question_count} câu</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{exam.attempts} lượt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span>{exam.rating}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/quiz/${exam.id}`)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Bắt đầu
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default ExamList;
