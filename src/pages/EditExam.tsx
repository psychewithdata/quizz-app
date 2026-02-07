import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowLeft, Save, Undo2 } from 'lucide-react';

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

async function fetchAttemptCount(examId: string): Promise<number> {
  const { count, error } = await supabase
    .from('exam_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId);

  if (error) throw error;
  return count ?? 0;
}

const EditExam = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const { toast } = useToast();
  const examId = params.examId as string | undefined;

  const [exam, setExam] = useState<ExamRow | null>(null);
  const [attempts, setAttempts] = useState<number | null>(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [passingScore, setPassingScore] = useState('');

  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState(false);
  const [saveConfirmText, setSaveConfirmText] = useState('');
  const [unpublishConfirmText, setUnpublishConfirmText] = useState('');

  const canManage = role === 'admin' || role === 'teacher';

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !canManage) navigate('/dashboard');
  }, [loading, user, canManage, navigate]);

  useEffect(() => {
    const run = async () => {
      if (!examId || !user || !canManage) return;
      setLoadingExam(true);
      try {
        const [{ data: examData, error: examError }, attemptCount] = await Promise.all([
          supabase.from('exams').select('*').eq('id', examId).single(),
          fetchAttemptCount(examId).catch(() => null),
        ]);
        if (examError) throw examError;
        setExam(examData);
        setAttempts(attemptCount);

        setTitle(examData.title);
        setDescription(examData.description ?? '');
        setDuration(String(examData.duration_minutes ?? 60));
        setPassingScore(examData.passing_score === null ? '' : String(examData.passing_score));
      } catch (e) {
        console.error(e);
        toast({
          title: 'Không thể tải đề thi',
          description: e instanceof Error ? e.message : 'Unknown error',
          variant: 'destructive',
        });
        navigate('/manage-exams');
      } finally {
        setLoadingExam(false);
      }
    };
    run();
  }, [examId, user, canManage, navigate, toast]);

  const saveConfirmRequired = useMemo(() => {
    // If we can't verify attempt count, require explicit confirmation as well.
    return attempts === null || attempts > 0;
  }, [attempts]);

  const saveConfirmOk = useMemo(() => {
    if (!saveConfirmRequired) return true;
    return saveConfirmText.trim().toUpperCase() === 'DONGY';
  }, [saveConfirmRequired, saveConfirmText]);

  const unpublishConfirmRequired = useMemo(() => {
    // Only require confirm for Published -> Draft (riskier). If attempts are unknown, require confirm too.
    if (!exam) return false;
    if (exam.status !== 'approved') return false;
    return attempts === null || attempts > 0;
  }, [exam, attempts]);

  const unpublishConfirmOk = useMemo(() => {
    if (!unpublishConfirmRequired) return true;
    return unpublishConfirmText.trim().toUpperCase() === 'DONGY';
  }, [unpublishConfirmRequired, unpublishConfirmText]);

  const isDraft = exam?.status === 'draft';
  const isPublished = exam?.status === 'approved';

  const canEditThisExam = useMemo(() => {
    if (!user || !exam || !role) return false;
    if (role === 'admin') return true;
    return role === 'teacher' && exam.creator_id === user.id;
  }, [user, exam, role]);

  const doSave = async () => {
    if (!exam) return;
    const nextTitle = title.trim();
    const nextDuration = Number(duration);
    const nextPassing = passingScore.trim() === '' ? null : Number(passingScore);

    if (!nextTitle) {
      toast({ title: 'Vui lòng nhập tiêu đề', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) {
      toast({ title: 'Thời lượng không hợp lệ', variant: 'destructive' });
      return;
    }
    if (nextPassing !== null && (!Number.isFinite(nextPassing) || nextPassing < 0 || nextPassing > 100)) {
      toast({ title: 'Điểm đạt không hợp lệ (0-100)', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          title: nextTitle,
          description: description.trim() || null,
          duration_minutes: nextDuration,
          passing_score: nextPassing,
        })
        .eq('id', exam.id);
      if (error) throw error;
      toast({ title: 'Đã lưu thay đổi' });
      setConfirmSaveOpen(false);
      setSaveConfirmText('');
    } catch (e) {
      console.error(e);
      toast({
        title: 'Lưu thất bại',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!saveConfirmRequired) {
      void doSave();
      return;
    }
    setConfirmSaveOpen(true);
  };

  const doUnpublishToDraft = async () => {
    if (!exam) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('exams').update({ status: 'draft' }).eq('id', exam.id);
      if (error) throw error;
      toast({ title: 'Đã chuyển về Draft' });
      setExam({ ...exam, status: 'draft' });
      setConfirmUnpublishOpen(false);
      setUnpublishConfirmText('');
    } catch (e) {
      console.error(e);
      toast({
        title: 'Cập nhật trạng thái thất bại',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingExam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !canManage || !exam) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/manage-exams')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <Badge variant="outline">{statusLabel(exam.status)}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa đề thi</CardTitle>
            <CardDescription>
              {isDraft ? (
                <>Bạn đang chỉnh sửa bản Draft.</>
              ) : (
                <>
                  Đề thi đang ở trạng thái <span className="font-medium text-foreground">{statusLabel(exam.status)}</span> và bị khoá chỉnh sửa.
                  {isPublished && (
                    <span className="block mt-2 text-muted-foreground">
                      Bạn có thể chuyển Published → Draft để chỉnh sửa. Nếu đã có lượt làm, hệ thống sẽ yêu cầu xác nhận kỹ.
                    </span>
                  )}
                </>
              )}
              {attempts !== null && attempts > 0 && (
                <span className="block mt-2 text-warning">
                  Cảnh báo: Đề thi đã có {attempts} lượt làm. Việc chỉnh sửa có thể gây sai lệch điểm số/báo cáo.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canEditThisExam && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                Bạn không có quyền chỉnh sửa đề thi này (chỉ Admin hoặc người tạo đề thi mới được sửa).
              </div>
            )}

            {!isDraft && (
              <div className="flex flex-wrap gap-2">
                {(exam.status === 'approved' || exam.status === 'pending_approval') && (
                  <Button
                    variant={exam.status === 'approved' ? 'destructive' : 'secondary'}
                    onClick={() => {
                      setConfirmUnpublishOpen(unpublishConfirmRequired);
                      if (!unpublishConfirmRequired) {
                        void doUnpublishToDraft();
                      } else {
                        setUnpublishConfirmText('');
                      }
                    }}
                    disabled={saving || !canEditThisExam}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Chuyển về Draft
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Tiêu đề</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!isDraft || saving || !canEditThisExam} />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Mô tả</div>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isDraft || saving || !canEditThisExam} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Thời lượng (phút)</div>
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} disabled={!isDraft || saving || !canEditThisExam} inputMode="numeric" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Điểm đạt (0-100)</div>
                <Input value={passingScore} onChange={(e) => setPassingScore(e.target.value)} disabled={!isDraft || saving || !canEditThisExam} inputMode="numeric" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={handleSaveClick} disabled={!isDraft || saving || !canEditThisExam}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận chỉnh sửa?</AlertDialogTitle>
              <AlertDialogDescription>
                {attempts === null ? (
                  <>
                    Không thể kiểm tra số lượt làm ngay lúc này. Việc thay đổi nội dung có thể gây sai lệch điểm số/báo cáo.
                    Vui lòng xác nhận kỹ trước khi lưu.
                  </>
                ) : (
                  <>
                    Đề thi đã có lượt làm. Việc thay đổi nội dung có thể gây sai lệch điểm số/báo cáo.
                    Vui lòng xác nhận kỹ trước khi lưu.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <div className="text-sm font-medium">Gõ DONGY để xác nhận</div>
              <Input value={saveConfirmText} onChange={(e) => setSaveConfirmText(e.target.value)} placeholder="DONGY" />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Huỷ</AlertDialogCancel>
              <AlertDialogAction onClick={doSave} disabled={saving || !saveConfirmOk}>
                {saving ? 'Đang lưu...' : 'Xác nhận lưu'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmUnpublishOpen} onOpenChange={setConfirmUnpublishOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Gỡ xuất bản để chỉnh sửa?</AlertDialogTitle>
              <AlertDialogDescription>
                {attempts === null ? (
                  <>
                    Không thể kiểm tra số lượt làm ngay lúc này. Chuyển Published → Draft và chỉnh sửa có thể gây sai lệch điểm số/báo cáo.
                  </>
                ) : (
                  <>
                    Đề thi đã có lượt làm. Chuyển Published → Draft và chỉnh sửa có thể gây sai lệch điểm số/báo cáo.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <div className="text-sm font-medium">Gõ DONGY để xác nhận</div>
              <Input value={unpublishConfirmText} onChange={(e) => setUnpublishConfirmText(e.target.value)} placeholder="DONGY" />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Huỷ</AlertDialogCancel>
              <AlertDialogAction onClick={doUnpublishToDraft} disabled={saving || !unpublishConfirmOk}>
                {saving ? 'Đang cập nhật...' : 'Chuyển về Draft'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default EditExam;

