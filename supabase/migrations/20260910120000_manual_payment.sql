-- 1. Thêm 'manual' vào enum payment_provider nếu chưa có
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'manual';

-- 2. Thêm trường receipt_url vào payments_log để lưu link ảnh (dùng IF NOT EXISTS)
ALTER TABLE payments_log ADD COLUMN IF NOT EXISTS receipt_url text;

-- 3. Tạo storage bucket 'receipts' để lưu biên lai
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Phân quyền (RLS) cho bucket 'receipts'
CREATE POLICY "Public Access Receipts" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'receipts' );

CREATE POLICY "Users can upload their own receipts" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Cho phép user tự chèn log thanh toán (Duyệt trước)
CREATE POLICY "Users can insert their own payment logs" 
ON payments_log FOR INSERT 
WITH CHECK ( auth.uid() = user_id );
