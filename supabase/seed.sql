-- 闲妙 - 数据库初始化种子数据
-- 在 Supabase SQL Editor 中执行此脚本
-- 前提：已执行 schema.sql 创建了所有表

-- ============================================
-- 1. 默认分类（覆盖 schema.sql 中的简单分类）
-- ============================================
INSERT INTO categories (id, name, icon_url, sort_order, ai_keywords) VALUES
  (1,  '手机数码', '/icons/cat-phone.svg',    1,  ARRAY['手机','iPhone','安卓','数码','耳机','平板','手表']),
  (2,  '电脑办公', '/icons/cat-computer.svg', 2,  ARRAY['电脑','笔记本','MacBook','显示器','键盘','鼠标']),
  (3,  '家用电器', '/icons/cat-appliance.svg',3,  ARRAY['冰箱','洗衣机','空调','电视','吸尘器','微波炉']),
  (4,  '服饰鞋包', '/icons/cat-fashion.svg',  4,  ARRAY['衣服','鞋子','包包','T恤','外套','运动鞋']),
  (5,  '美妆个护', '/icons/cat-beauty.svg',   5,  ARRAY['化妆品','护肤品','香水','口红','面膜']),
  (6,  '图书文具', '/icons/cat-book.svg',     6,  ARRAY['书籍','教材','小说','文具','笔记本','笔']),
  (7,  '运动户外', '/icons/cat-sport.svg',    7,  ARRAY['运动','健身','瑜伽','自行车','露营','登山']),
  (8,  '母婴玩具', '/icons/cat-baby.svg',     8,  ARRAY['婴儿','童装','玩具','推车','奶粉','乐高']),
  (9,  '家居家装', '/icons/cat-home.svg',     9,  ARRAY['家具','沙发','床','灯具','装饰','收纳']),
  (10, '其他',     '/icons/cat-other.svg',    10, ARRAY['二手','闲置','转让'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon_url = EXCLUDED.icon_url,
  sort_order = EXCLUDED.sort_order,
  ai_keywords = EXCLUDED.ai_keywords;

-- 重置序列
SELECT setval('categories_id_seq', 10);

-- ============================================
-- 2. 优惠券模板（与 schema.sql 的 coupons 表字段一致）
-- ============================================
INSERT INTO coupons (name, type, condition_amount, discount_amount, total_count, used_count, per_user_limit, valid_from, valid_to, is_active) VALUES
  ('新人满减券', 'full_reduction', 50,  10, 1000, 0, 1, NOW(), NOW() + INTERVAL '30 days', true),
  ('满100减20',  'full_reduction', 100, 20, 500,  0, 1, NOW(), NOW() + INTERVAL '15 days', true),
  ('满200减50',  'full_reduction', 200, 50, 200,  0, 1, NOW(), NOW() + INTERVAL '7 days',  true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. RPC 函数
-- ============================================

-- 聊天未读数自增
CREATE OR REPLACE FUNCTION increment(unread_count INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
BEGIN
  RETURN unread_count + 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Storage Buckets（在 Supabase Dashboard 操作更方便）
-- ============================================
-- 需要在 Supabase Dashboard > Storage 中手动创建：
--
--   products  - 商品图片，公开读
--   avatars   - 用户头像，公开读
--   chat      - 聊天图片，私有
--
-- 每个 Bucket 的 RLS 策略：
--   SELECT: true（公开）或 auth.uid() IS NOT NULL（私有）
--   INSERT: auth.uid() IS NOT NULL
--   UPDATE: auth.uid() = owner
--   DELETE: auth.uid() = owner

-- ============================================
-- 5. 创建管理员（替换为你的手机号）
-- ============================================
-- 登录后执行：
--   UPDATE profiles SET role = 'admin' WHERE phone = '你的手机号';

-- ============================================
-- 完成！
-- ============================================
