import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  Trophy,
  Users,
  FileText,
  BarChart3,
  Plus,
  ArrowRight,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const adminStats = [
    { label: 'Tổng người dùng', value: '1,234', icon: Users, trend: '+12%' },
    { label: 'Đề thi chờ duyệt', value: '23', icon: FileText, trend: '+5' },
    { label: 'Bài thi hôm nay', value: '156', icon: BookOpen, trend: '+8%' },
    { label: 'Điểm TB toàn hệ thống', value: '7.5', icon: BarChart3, trend: '+0.3' },
  ];

  const teacherStats = [
    { label: 'Đề thi của tôi', value: '18', icon: FileText },
    { label: 'Câu hỏi đã tạo', value: '245', icon: BookOpen },
    { label: 'Học sinh làm bài', value: '89', icon: Users },
    { label: 'Điểm TB học sinh', value: '7.2', icon: TrendingUp },
  ];

  const studentStats = [
    { label: 'Bài thi hoàn thành', value: '24', icon: CheckCircle },
    { label: 'Điểm trung bình', value: '8.2', icon: TrendingUp },
    { label: 'Thời gian luyện tập', value: '45h', icon: Clock },
    { label: 'Xếp hạng', value: '#12', icon: Trophy },
  ];

  const getStats = () => {
    switch (role) {
      case 'admin':
        return adminStats;
      case 'teacher':
        return teacherStats;
      default:
        return studentStats;
    }
  };

  const stats = getStats();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Xin chào, {profile?.full_name?.split(' ').pop() || 'bạn'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {role === 'admin' && 'Quản lý hệ thống và phê duyệt đề thi'}
            {role === 'teacher' && 'Soạn đề thi và theo dõi tiến độ học sinh'}
            {role === 'student' && 'Tiếp tục luyện tập để cải thiện kết quả'}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={item}>
              <Card className="stat-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      {'trend' in stat && stat.trend && (
                        <Badge variant="secondary" className="mt-2 text-success">
                          {String(stat.trend)}
                        </Badge>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Primary Action Card */}
          <Card className="overflow-hidden">
            <div className="hero-gradient p-6 text-primary-foreground">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl text-primary-foreground">
                  {role === 'student' && 'Bắt đầu luyện tập'}
                  {role === 'teacher' && 'Tạo đề thi mới'}
                  {role === 'admin' && 'Quản lý người dùng'}
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  {role === 'student' && 'Chọn một đề thi để bắt đầu luyện tập ngay'}
                  {role === 'teacher' && 'Tạo đề thi mới từ kho câu hỏi của bạn'}
                  {role === 'admin' && 'Xem và quản lý tất cả người dùng trong hệ thống'}
                </CardDescription>
              </CardHeader>
              <Button
                size="lg"
                variant="secondary"
                className="glow-on-hover"
                onClick={() =>
                  navigate(
                    role === 'student' ? '/exams' : role === 'teacher' ? '/manage-exams' : '/admin/users'
                  )
                }
              >
                {role === 'student' && <BookOpen className="mr-2 h-5 w-5" />}
                {role === 'teacher' && <Plus className="mr-2 h-5 w-5" />}
                {role === 'admin' && <Users className="mr-2 h-5 w-5" />}
                Bắt đầu
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: 'Hoàn thành bài thi Toán học',
                    time: '2 giờ trước',
                    score: '8.5/10',
                  },
                  {
                    title: 'Bắt đầu luyện tập Vật lý',
                    time: '1 ngày trước',
                    score: '7.0/10',
                  },
                  {
                    title: 'Hoàn thành bài thi Hóa học',
                    time: '3 ngày trước',
                    score: '9.0/10',
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant="secondary">{activity.score}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
