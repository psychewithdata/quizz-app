import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Gamepad2, Sparkles } from "lucide-react";

const Practice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Luyện tập</h1>
          <p className="text-muted-foreground">
            Chọn mini-game phù hợp để luyện tư duy và kỹ năng.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="h-full card-hover overflow-hidden">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-200/60 via-yellow-100/50 to-sky-200/60" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-11 h-11 rounded-2xl bg-white/70 border border-white/80 shadow-sm flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Least → Greatest</CardTitle>
                        <CardDescription>
                          Hoàn thành đường đi từ số nhỏ nhất đến số lớn nhất.
                        </CardDescription>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-white/70 border border-white/80 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      Lớp 1+
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Kéo để nối đường đi, chỉ được đi lên/xuống/trái/phải.
                    </div>
                    <Button onClick={() => navigate("/practice/least-to-greatest")}>
                      Chơi ngay <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Practice;

