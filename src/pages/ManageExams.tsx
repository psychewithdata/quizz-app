import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Plus, Pencil, RefreshCcw, Send, Undo2 } from 'lucide-react';

type ExamRow = Tables<'exams'>;

const statusLabel = (status: ExamRow['status']) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'pending_approval':
      return 'Chờ duyệt';
    case 'approved':
      return 'Published';
    case 'archived':
      return 'Đã lưu trữ';
    default:
      return status;
  }
};

const statusBadgeClass = (status: ExamRow['status']) => {
  switch (status) {
    case 'draft':
      return 'bg-muted text-foreground border-border';
    case 'pending_approval':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'approved':
      return 'bg-success/10 text-success border-success/20';
    case 'archived':
      return 'bg-secondary text-secondary-foreground border-border';
    default:
      return '';
  }
};

async function fetchAttemptCount(examId: string): Promise<number> {
  const { count, error } = await supabase
    .from('exam_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId);

  if (error) throw error;
  return count ?? 0;
}

const ManageExams = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState('60');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [confirmAttempts, setConfirmAttempts] = useState<number | null>(null);
  const [confirmExam, setConfirmExam] = useState<ExamRow | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const canManage = role === 'admin' || role === 'teacher';

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !canManage) navigate('/dashboard');
  }, [loading, user, canManage, navigate]);

  const loadExams = async () => {
    if (!user || !role) return;
    setLoadingExams(true);
    try {
      let query = supabase.from('exams').select('*').order('updated_at', { ascending: false });
      if (role === 'teacher') query = query.eq('creator_id', user.id);
      const { data, error } = await query;
      if (error) throw error;
      setExams(data ?? []);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Không thể tải danh sách đề thi',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    if (!loading && user && canManage) {
      loadExams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, role, canManage]);

  const resetCreateForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewDuration('60');
  };

  const handleCreateExam = async () => {
    if (!user) return;
    const title = newTitle.trim();
    const duration = Number(newDuration);
    if (!title) {
      toast({ title: 'Vui lòng nhập tiêu đề đề thi', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      toast({ title: 'Thời lượng không hợp lệ', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('exams').insert({
        title,
        description: newDescription.trim() || null,
        duration_minutes: duration,
        creator_id: user.id,
        status: 'draft',
      });
      if (error) throw error;
      toast({ title: 'Đã tạo đề thi (Draft)' });
      setCreateOpen(false);
      resetCreateForm();
      await loadExams();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Tạo đề thi thất bại',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const updateExamStatus = async (exam: ExamRow, status: ExamRow['status']) => {
    try {
      const { error } = await supabase.from('exams').update({ status }).eq('id', exam.id);
      if (error) throw error;
      toast({ title: `Đã cập nhật trạng thái: ${statusLabel(status)}` });
      await loadExams();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Cập nhật trạng thái thất bại',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const openUnpublishConfirm = async (exam: ExamRow) => {
    setConfirmExam(exam);
    setConfirmAttempts(null);
    setConfirmText('');
    setConfirmOpen(true);

    try {
      const count = await fetchAttemptCount(exam.id);
      setConfirmAttempts(count);
    } catch (e) {
      console.error(e);
      // If count fetch fails, still allow manual confirm
      setConfirmAttempts(null);
    }
  };

  const confirmRequired = useMemo(() => {
    // If we can't verify attempt count, require explicit confirmation as well.
    return confirmAttempts === null || confirmAttempts > 0;
  }, [confirmAttempts]);

  const confirmOk = useMemo(() => {
    if (!confirmRequired) return true;
    return confirmText.trim().toUpperCase() === 'DONGY';
  }, [confirmRequired, confirmText]);

  const handleConfirmUnpublish = async () => {
    if (!confirmExam) return;
    setConfirmBusy(true);
    try {
      await updateExamStatus(confirmExam, 'draft');
      setConfirmOpen(false);
    } finally {
      setConfirmBusy(false);
    }
  };

  if (loading || loadingExams) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !canManage) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Quản lý đề thi</h1>
            <p className="text-muted-foreground">
              Admin/Giáo viên có thể đưa đề thi Published về Draft để chỉnh sửa (có cảnh báo nếu đã có lượt làm).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadExams}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tải lại
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo đề thi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo đề thi mới</DialogTitle>
                  <DialogDescription>Đề thi sẽ được tạo ở trạng thái Draft.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Tiêu đề</div>
                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="VD: Đề thi Toán - Hàm số" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Mô tả</div>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Mô tả ngắn (tuỳ chọn)"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Thời lượng (phút)</div>
                    <Input value={newDuration} onChange={(e) => setNewDuration(e.target.value)} inputMode="numeric" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                    Huỷ
                  </Button>
                  <Button onClick={handleCreateExam} disabled={creating}>
                    {creating ? 'Đang tạo...' : 'Tạo'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {exams.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Chưa có đề thi</CardTitle>
              <CardDescription>Hãy tạo đề thi mới để bắt đầu.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {exams.map((exam) => (
              <Card key={exam.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{exam.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {exam.description || '—'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={statusBadgeClass(exam.status)}>
                      {statusLabel(exam.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="text-sm text-muted-foreground flex items-center justify-between">
                    <span>Thời lượng</span>
                    <span className="font-medium text-foreground">{exam.duration_minutes} phút</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" onClick={() => navigate(`/manage-exams/${exam.id}`)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </Button>

                    {exam.status === 'draft' && role === 'teacher' && (
                      <Button variant="secondary" onClick={() => updateExamStatus(exam, 'pending_approval')}>
                        <Send className="mr-2 h-4 w-4" />
                        Gửi duyệt
                      </Button>
                    )}

                    {exam.status === 'pending_approval' && (
                      <Button variant="secondary" onClick={() => updateExamStatus(exam, 'draft')}>
                        <Undo2 className="mr-2 h-4 w-4" />
                        Rút về nháp
                      </Button>
                    )}

                    {exam.status === 'approved' && (
                      <Button variant="destructive" onClick={() => openUnpublishConfirm(exam)}>
                        <Undo2 className="mr-2 h-4 w-4" />
                        Gỡ xuất bản
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Chuyển Published → Draft?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmExam ? (
                  <>
                    Bạn đang gỡ xuất bản đề thi <span className="font-medium text-foreground">{confirmExam.title}</span>.
                    {confirmAttempts === null ? (
                      <span className="block mt-2">
                        Không thể kiểm tra số lượt làm ngay lúc này. Vui lòng xác nhận kỹ trước khi chỉnh sửa để tránh sai lệch điểm số.
                      </span>
                    ) : confirmAttempts > 0 ? (
                      <span className="block mt-2 text-warning">
                        Cảnh báo: Đề thi đã có {confirmAttempts} lượt làm. Việc chỉnh sửa có thể gây sai lệch điểm số/báo cáo.
                      </span>
                    ) : (
                      <span className="block mt-2 text-muted-foreground">Chưa có lượt làm.</span>
                    )}
                  </>
                ) : (
                  'Vui lòng xác nhận.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {confirmRequired && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Gõ DONGY để xác nhận</div>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DONGY" />
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={confirmBusy}>Huỷ</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUnpublish} disabled={confirmBusy || !confirmOk}>
                {confirmBusy ? 'Đang cập nhật...' : 'Chuyển về Draft'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default ManageExams;

