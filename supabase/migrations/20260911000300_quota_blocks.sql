-- Migration: Block-based Quota Logic for Business Accounts
-- Gói Mặc định (Free): 200 lượt gửi, 200 danh bạ.
-- Nâng cấp theo Block (b2b_block_500): mỗi block cộng 500 lượt gửi và 500 danh bạ.

CREATE OR REPLACE FUNCTION get_my_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used_count int;
  v_limit int;
  v_active_blocks int;
BEGIN
  -- 1. Đếm số lượt đã gửi trong năm nay
  SELECT COALESCE(SUM(used_count), 0) INTO v_used_count
  FROM message_quotas
  WHERE user_id = auth.uid() AND period_year = EXTRACT(YEAR FROM CURRENT_DATE);

  -- 2. Đếm số block B2B đang active
  SELECT COUNT(*) INTO v_active_blocks
  FROM subscriptions
  WHERE user_id = auth.uid() 
    AND status = 'active'
    AND sub_type = 'b2b_block_500'
    AND (current_period_end IS NULL OR current_period_end > now());

  -- 3. Tính limit: Base 200 + 500 cho mỗi block
  v_limit := 200 + (v_active_blocks * 500);

  RETURN jsonb_build_object(
    'used_count', v_used_count,
    'bonus_credits', 0,
    'limit', v_limit
  );
END;
$$;

CREATE OR REPLACE FUNCTION my_wallet_limits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
  v_limit int;
  v_active_blocks int;
  v_contact_addons int;
BEGIN
  -- 1. Đếm số liên hệ đã lưu
  SELECT count(*) INTO v_count
  FROM saved_contacts
  WHERE user_id = auth.uid();

  -- 2. Đếm số block danh bạ (dùng chung block b2b_block_500, HOẶC add-on mở rộng danh bạ)
  -- Ở đây theo yêu cầu: mua block 500 thì được cả 500 lượt gửi VÀ 500 danh bạ.
  -- Nếu có gói contact_block_addon riêng thì cộng thêm.
  SELECT COUNT(*) INTO v_active_blocks
  FROM subscriptions
  WHERE user_id = auth.uid() 
    AND status = 'active'
    AND sub_type = 'b2b_block_500'
    AND (current_period_end IS NULL OR current_period_end > now());

  SELECT COUNT(*) INTO v_contact_addons
  FROM subscriptions
  WHERE user_id = auth.uid() 
    AND status = 'active'
    AND sub_type = 'contact_block_addon';
    
  -- Limit = 200 (Base) + 500 * (b2b_blocks + contact_addons)
  v_limit := 200 + (v_active_blocks * 500) + (COALESCE(v_contact_addons, 0) * 500);

  RETURN jsonb_build_object(
    'current_saved_count', v_count,
    'max_saved_allowed', v_limit,
    'blocks_purchased', v_active_blocks
  );
END;
$$;

-- Tạo bảng app_settings để lưu cài đặt ngân hàng
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Bật RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Ai cũng có thể đọc (để trang pricing lấy thông tin bank)
CREATE POLICY "Public can view app_settings"
  ON app_settings FOR SELECT
  USING (true);

-- Chỉ admin mới được sửa
CREATE POLICY "Admins can update app_settings"
  ON app_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Insert dữ liệu mặc định
INSERT INTO app_settings (key, value)
VALUES (
  'bank_info',
  '{"bank_name": "Vietcombank (VCB)", "account_number": "1234567890", "account_owner": "CTY TNHH BIZCONNECT ONE", "bin": "970436"}'
)
ON CONFLICT (key) DO NOTHING;
