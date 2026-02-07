-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create exam status enum
CREATE TYPE public.exam_status AS ENUM ('draft', 'pending_approval', 'approved', 'archived');

-- Create attempt status enum
CREATE TYPE public.attempt_status AS ENUM ('not_started', 'in_progress', 'completed', 'graded');

-- Create question type enum
CREATE TYPE public.question_type AS ENUM ('single_choice', 'multiple_choice');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_answers INTEGER[] NOT NULL DEFAULT '{}',
    question_type question_type NOT NULL DEFAULT 'single_choice',
    explanation TEXT,
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5) DEFAULT 3,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exams table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status exam_status NOT NULL DEFAULT 'draft',
    passing_score INTEGER DEFAULT 50,
    is_randomized BOOLEAN DEFAULT false,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exam questions junction table
CREATE TABLE public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 1,
    UNIQUE (exam_id, question_id)
);

-- Exam attempts table
CREATE TABLE public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    status attempt_status NOT NULL DEFAULT 'in_progress',
    time_remaining INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student answers table
CREATE TABLE public.student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    selected_options INTEGER[] NOT NULL DEFAULT '{}',
    is_correct BOOLEAN,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (attempt_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can create questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Creators and admins can update questions"
  ON public.questions FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    (public.has_role(auth.uid(), 'teacher') AND creator_id = auth.uid())
  );

CREATE POLICY "Creators and admins can delete questions"
  ON public.questions FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    (public.has_role(auth.uid(), 'teacher') AND creator_id = auth.uid())
  );

-- RLS Policies for exams
CREATE POLICY "Anyone can view approved exams"
  ON public.exams FOR SELECT
  TO authenticated
  USING (
    status = 'approved' OR 
    creator_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Teachers and admins can create exams"
  ON public.exams FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Creators and admins can update exams"
  ON public.exams FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    (public.has_role(auth.uid(), 'teacher') AND creator_id = auth.uid())
  );

CREATE POLICY "Creators and admins can delete exams"
  ON public.exams FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    (public.has_role(auth.uid(), 'teacher') AND creator_id = auth.uid())
  );

-- RLS Policies for exam_questions
CREATE POLICY "Anyone can view exam questions for accessible exams"
  ON public.exam_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage exam questions"
  ON public.exam_questions FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'teacher')
  );

-- RLS Policies for exam_attempts
CREATE POLICY "Students can view own attempts"
  ON public.exam_attempts FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts for their exams"
  ON public.exam_attempts FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (
      SELECT 1 FROM public.exams 
      WHERE exams.id = exam_attempts.exam_id 
      AND exams.creator_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own attempts"
  ON public.exam_attempts FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own active attempts"
  ON public.exam_attempts FOR UPDATE
  USING (student_id = auth.uid() AND status = 'in_progress');

-- RLS Policies for student_answers
CREATE POLICY "Students can view own answers"
  ON public.student_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts 
      WHERE exam_attempts.id = student_answers.attempt_id 
      AND exam_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers for their exams"
  ON public.student_answers FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (
      SELECT 1 FROM public.exam_attempts ea
      JOIN public.exams e ON e.id = ea.exam_id
      WHERE ea.id = student_answers.attempt_id 
      AND e.creator_id = auth.uid()
    )
  );

CREATE POLICY "Students can create answers for own attempts"
  ON public.student_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_attempts 
      WHERE exam_attempts.id = student_answers.attempt_id 
      AND exam_attempts.student_id = auth.uid()
      AND exam_attempts.status = 'in_progress'
    )
  );

CREATE POLICY "Students can update answers for own active attempts"
  ON public.student_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts 
      WHERE exam_attempts.id = student_answers.attempt_id 
      AND exam_attempts.student_id = auth.uid()
      AND exam_attempts.status = 'in_progress'
    )
  );