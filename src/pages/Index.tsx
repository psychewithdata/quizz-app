import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  Award,
  Users,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Target,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: 'Kho đề thi phong phú',
      description: 'Hàng nghìn câu hỏi từ các môn học khác nhau, được soạn bởi giáo viên chuyên môn.',
    },
    {
      icon: Clock,
      title: 'Thi thử trực tuyến',
      description: 'Mô phỏng kỳ thi thực tế với đồng hồ đếm ngược và tự động nộp bài.',
    },
    {
      icon: Target,
      title: 'Phân tích kết quả',
      description: 'Xem chi tiết lời giải và thống kê điểm số để cải thiện kết quả.',
    },
    {
      icon: Zap,
      title: 'Hỗ trợ LaTeX',
      description: 'Hiển thị công thức toán học, hóa học chính xác với KaTeX.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Câu hỏi' },
    { value: '500+', label: 'Đề thi' },
    { value: '50,000+', label: 'Học sinh' },
    { value: '98%', label: 'Hài lòng' },
  ];

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient py-20 md:py-32">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-foreground/10 rounded-full blur-3xl" />
          </div>

          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center text-primary-foreground"
            >
              <Badge className="mb-6 bg-accent text-accent-foreground">
                <Sparkles className="w-3 h-3 mr-1" />
                Nền tảng luyện thi #1 Việt Nam
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Chinh phục mọi kỳ thi với{' '}
                <span className="text-accent">QuizMaster</span>
              </h1>

              <p className="text-lg md:text-xl mb-8 text-primary-foreground/80 max-w-2xl mx-auto">
                Nền tảng luyện đề thi trắc nghiệm trực tuyến với hàng nghìn câu hỏi, 
                hỗ trợ công thức LaTeX và phân tích kết quả chi tiết.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg h-14 px-8 glow-on-hover"
                    onClick={() => navigate('/dashboard')}
                  >
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Vào Dashboard
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="text-lg h-14 px-8 glow-on-hover"
                      onClick={() => navigate('/auth?mode=signup')}
                    >
                      <GraduationCap className="mr-2 h-5 w-5" />
                      Bắt đầu miễn phí
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg h-14 px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                      onClick={() => navigate('/auth')}
                    >
                      Đăng nhập
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-card border-y border-border">
          <div className="container py-8">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div key={index} variants={item} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Được thiết kế để giúp bạn học hiệu quả và đạt kết quả tốt nhất
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={item}>
                <Card className="h-full card-hover border-0 bg-card shadow-md">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4" variant="outline">
                <Award className="w-3 h-3 mr-1" />
                Hỗ trợ LaTeX
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Hiển thị công thức chính xác
              </h2>
              <p className="text-muted-foreground mb-6 text-lg">
                Hỗ trợ đầy đủ cú pháp LaTeX để hiển thị công thức toán học, 
                vật lý, hóa học một cách chính xác và đẹp mắt.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <p className="text-sm text-muted-foreground mb-2">Ví dụ công thức:</p>
                  <p className="font-mono text-sm">{'$E = mc^2$'}</p>
                  <p className="font-mono text-sm">{'$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$'}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl bg-card border shadow-xl p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="font-medium mb-2">Câu 1: Tính tích phân sau:</p>
                    <p className="text-lg">∫₀^∞ e^(-x²) dx = √π/2</p>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg border-2 border-primary bg-primary/5">
                      <span className="font-medium">A.</span> √π/2
                    </div>
                    <div className="p-3 rounded-lg border">
                      <span className="font-medium">B.</span> π/2
                    </div>
                    <div className="p-3 rounded-lg border">
                      <span className="font-medium">C.</span> 1/2
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-primary-foreground max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Tham gia cùng hàng nghìn học sinh đang luyện tập mỗi ngày
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg h-14 px-8"
              onClick={() => navigate(user ? '/dashboard' : '/auth?mode=signup')}
            >
              {user ? 'Vào Dashboard' : 'Đăng ký ngay'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">QuizMaster</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 QuizMaster. Nền tảng luyện thi trực tuyến.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
