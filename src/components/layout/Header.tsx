import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BookOpen, LogOut, Settings, User, LayoutDashboard } from 'lucide-react';

export const Header = () => {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return <Badge className="badge-admin">Admin</Badge>;
      case 'teacher':
        return <Badge className="badge-teacher">Giáo viên</Badge>;
      case 'student':
        return <Badge className="badge-student">Học sinh</Badge>;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">QuizMaster</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/exams"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Đề thi
          </Link>
          <Link
            to="/practice"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Luyện tập
          </Link>
          {user && (
            <Link
              to="/history"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Lịch sử
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile?.full_name || user.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <div>{getRoleBadge()}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Hồ sơ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Cài đặt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Đăng nhập
              </Button>
              <Button onClick={() => navigate('/auth?mode=signup')}>
                Đăng ký
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
