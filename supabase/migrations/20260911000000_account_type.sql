-- Thêm TYPE `app_account_type`
CREATE TYPE public.app_account_type AS ENUM ('personal', 'business');

-- Thêm cột account_type vào bảng profiles (mặc định là personal)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type public.app_account_type NOT NULL DEFAULT 'personal';

-- Cập nhật hàm handle_new_user để tự động lưu account_type lúc signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account_type public.app_account_type;
BEGIN
  -- Lấy account_type từ meta data lúc đăng ký, nếu không có thì mặc định là personal
  v_account_type := COALESCE(
    (NEW.raw_user_meta_data->>'account_type')::public.app_account_type,
    'personal'::public.app_account_type
  );

  INSERT INTO public.profiles (id, email, display_name, account_type)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    v_account_type
  );
  
  RETURN NEW;
END;
$$;
