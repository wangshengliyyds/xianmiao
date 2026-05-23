-- ============================================================
-- 闲妙 (XianMiao) - 完整数据库建表脚本
-- 适用于 Supabase PostgreSQL
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 4.2 位置与地理 (无依赖，最先创建)
-- ============================================================

CREATE TABLE locations (
  id              serial PRIMARY KEY,
  name            text NOT NULL,
  code            text,
  parent_id       int REFERENCES locations(id),
  level           text NOT NULL CHECK (level IN ('province','city','district')),
  lat             decimal(10,7),
  lng             decimal(10,7),
  is_active       bool DEFAULT true
);

-- ============================================================
-- 4.3 商品核心 - 分类 (无依赖)
-- ============================================================

CREATE TABLE categories (
  id              serial PRIMARY KEY,
  name            text NOT NULL,
  icon_url        text,
  parent_id       int REFERENCES categories(id),
  sort_order      int DEFAULT 0,
  ai_keywords     text[],
  is_active       bool DEFAULT true
);

-- 默认分类由 seed.sql 插入

-- ============================================================
-- 4.1 用户与权限
-- ============================================================

CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id),
  nickname        text NOT NULL,
  avatar_url      text,
  phone           text UNIQUE,
  email           text,
  role            text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','merchant','admin')),
  city_id         int REFERENCES locations(id),
  credit_score    int NOT NULL DEFAULT 100,
  is_verified     bool DEFAULT false,
  is_banned       bool DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE merchant_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES profiles(id),
  store_name      text NOT NULL,
  store_description text,
  logo_url        text,
  license_url     text,
  deposit_amount  decimal(10,2) DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  rating          decimal(3,2) DEFAULT 0,
  total_sales     int DEFAULT 0,
  approved_at     timestamptz,
  approved_by     uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE admin_permissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES profiles(id),
  permission_level text NOT NULL CHECK (permission_level IN ('viewer','operator','finance','super')),
  granted_by      uuid REFERENCES profiles(id),
  granted_at      timestamptz DEFAULT now()
);

CREATE TABLE addresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  name            text NOT NULL,
  phone           text NOT NULL,
  province        text,
  city            text,
  district        text,
  detail          text NOT NULL,
  is_default      bool DEFAULT false,
  lat             decimal(10,7),
  lng             decimal(10,7),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE user_follows (
  follower_id     uuid NOT NULL REFERENCES profiles(id),
  following_id    uuid NOT NULL REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE oauth_providers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  provider        text NOT NULL CHECK (provider IN ('wechat','github','google')),
  provider_uid    text NOT NULL,
  linked_at       timestamptz DEFAULT now(),
  UNIQUE(provider, provider_uid)
);

CREATE TABLE device_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  token           text NOT NULL,
  platform        text NOT NULL CHECK (platform IN ('ios','android','web')),
  is_active       bool DEFAULT true,
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- ============================================================
-- 4.3 商品核心
-- ============================================================

CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid NOT NULL REFERENCES profiles(id),
  category_id     int REFERENCES categories(id),
  title           text NOT NULL,
  description     text,
  price           decimal(10,2) NOT NULL,
  original_price  decimal(10,2),
  condition       text NOT NULL CHECK (condition IN ('new','like_new','good','fair','poor')),
  trade_method    text NOT NULL DEFAULT 'both' CHECK (trade_method IN ('offline','escrow','both')),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','reserved','sold','expired','removed')),
  city_id         int REFERENCES locations(id),
  lat             decimal(10,7),
  lng             decimal(10,7),
  view_count      int DEFAULT 0,
  fav_count       int DEFAULT 0,
  is_merchant     bool DEFAULT false,
  ai_generated    bool DEFAULT false,
  expires_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_city ON products(city_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_created ON products(created_at DESC);

CREATE TABLE product_images (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url             text NOT NULL,
  sort_order      int DEFAULT 0,
  ai_tags         text[],
  ai_features     vector(512),
  is_cover        bool DEFAULT false,
  hash            text,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_product_images_product ON product_images(product_id);

CREATE TABLE product_videos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url             text NOT NULL,
  thumbnail_url   text,
  duration        int,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE product_skus (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_name       text NOT NULL,
  stock           int NOT NULL DEFAULT 0,
  price_override  decimal(10,2),
  is_active       bool DEFAULT true
);

CREATE TABLE product_ai_analysis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_guess  text,
  brand_guess     text,
  condition_guess text,
  defect_tags     text[],
  suggested_price decimal(10,2),
  price_range_low decimal(10,2),
  price_range_high decimal(10,2),
  title_suggestion text,
  description_suggestion text,
  risk_flags      text[],
  analyzed_at     timestamptz DEFAULT now()
);

CREATE TABLE product_tags (
  id              serial PRIMARY KEY,
  name            text UNIQUE NOT NULL,
  type            text NOT NULL DEFAULT 'user' CHECK (type IN ('system','ai','user')),
  use_count       int DEFAULT 0
);

CREATE TABLE product_tag_relations (
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id          int NOT NULL REFERENCES product_tags(id),
  PRIMARY KEY (product_id, tag_id)
);

CREATE TABLE product_views (
  id              bigserial PRIMARY KEY,
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewer_id       uuid REFERENCES profiles(id),
  source          text CHECK (source IN ('search','recommend','share','direct')),
  viewed_at       timestamptz DEFAULT now()
);

CREATE TABLE favorites (
  user_id         uuid NOT NULL REFERENCES profiles(id),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE search_history (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES profiles(id),
  query           text NOT NULL,
  filters         jsonb,
  result_count    int,
  searched_at     timestamptz DEFAULT now()
);

-- ============================================================
-- 4.4 交易
-- ============================================================

CREATE TABLE orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no        text UNIQUE NOT NULL,
  product_id      uuid NOT NULL REFERENCES products(id),
  buyer_id        uuid NOT NULL REFERENCES profiles(id),
  seller_id       uuid NOT NULL REFERENCES profiles(id),
  trade_method    text NOT NULL CHECK (trade_method IN ('offline','escrow')),
  sku_id          uuid REFERENCES product_skus(id),
  quantity        int NOT NULL DEFAULT 1,
  unit_price      decimal(10,2) NOT NULL,
  total_amount    decimal(10,2) NOT NULL,
  shipping_fee    decimal(10,2) DEFAULT 0,
  coupon_id       uuid,
  discount_amount decimal(10,2) DEFAULT 0,
  pay_amount      decimal(10,2) NOT NULL,
  commission      decimal(10,2) DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending_pay' CHECK (status IN (
                    'pending_pay','paid','shipped','delivered',
                    'completed','cancelled','refunding','refunded','disputed'
                  )),
  address_snapshot jsonb,
  logistics_company text,
  logistics_no    text,
  remark          text,
  auto_confirm_at timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_status_logs (
  id              bigserial PRIMARY KEY,
  order_id        uuid NOT NULL REFERENCES orders(id),
  from_status     text,
  to_status       text NOT NULL,
  operator_id     uuid REFERENCES profiles(id),
  remark          text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id),
  payment_no      text UNIQUE,
  channel         text NOT NULL CHECK (channel IN ('alipay','wechat')),
  amount          decimal(10,2) NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
  paid_at         timestamptz,
  callback_data   jsonb,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE refunds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id),
  payment_id      uuid REFERENCES payments(id),
  amount          decimal(10,2) NOT NULL,
  reason          text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','processing','done')),
  evidence_images text[],
  processed_by    uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);

CREATE TABLE disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id),
  reporter_id     uuid NOT NULL REFERENCES profiles(id),
  type            text NOT NULL CHECK (type IN ('quality','not_received','not_as_described','fraud')),
  description     text,
  evidence        text[],
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  resolution      text,
  resolved_by     uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE commissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id),
  rate            decimal(5,4) NOT NULL,
  amount          decimal(10,2) NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','settled')),
  settled_at      timestamptz
);

CREATE TABLE ratings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id),
  rater_id        uuid NOT NULL REFERENCES profiles(id),
  ratee_id        uuid NOT NULL REFERENCES profiles(id),
  score           int NOT NULL CHECK (score BETWEEN 1 AND 5),
  content         text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(order_id, rater_id)
);

-- ============================================================
-- 4.5 通讯
-- ============================================================

CREATE TABLE conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            text NOT NULL DEFAULT 'private' CHECK (type IN ('private','group','system')),
  title           text,
  avatar_url      text,
  last_message_at timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE conversation_members (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id),
  role            text DEFAULT 'member' CHECK (role IN ('member','admin')),
  nickname        text,
  is_muted        bool DEFAULT false,
  unread_count    int DEFAULT 0,
  joined_at       timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES profiles(id),
  type            text NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','voice','product_card','offer','order_push','system')),
  content         text,
  metadata        jsonb,
  is_withdrawn    bool DEFAULT false,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

CREATE TABLE message_reads (
  message_id      uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id),
  read_at         timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  type            text NOT NULL CHECK (type IN ('order','chat','system','promotion','security')),
  title           text NOT NULL,
  body            text,
  data            jsonb,
  is_read         bool DEFAULT false,
  channels_sent   text[],
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE notification_queue (
  id              bigserial PRIMARY KEY,
  notification_id uuid NOT NULL REFERENCES notifications(id),
  channel         text NOT NULL CHECK (channel IN ('sms','wechat','email','push')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  retry_count     int DEFAULT 0,
  sent_at         timestamptz,
  error           text
);

CREATE TABLE circles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  cover_url       text,
  creator_id      uuid NOT NULL REFERENCES profiles(id),
  member_count    int DEFAULT 0,
  is_official     bool DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE circle_members (
  circle_id       uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id),
  role            text DEFAULT 'member' CHECK (role IN ('member','moderator','owner')),
  joined_at       timestamptz DEFAULT now(),
  PRIMARY KEY (circle_id, user_id)
);

-- ============================================================
-- 4.6 营销
-- ============================================================

CREATE TABLE coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('full_reduction','discount','free_shipping')),
  condition_amount decimal(10,2),
  discount_amount decimal(10,2),
  discount_rate   decimal(3,2),
  total_count     int NOT NULL,
  used_count      int DEFAULT 0,
  per_user_limit  int DEFAULT 1,
  valid_from      timestamptz NOT NULL,
  valid_to        timestamptz NOT NULL,
  applicable_to   text DEFAULT 'all' CHECK (applicable_to IN ('all','category','merchant')),
  target_id       text,
  is_active       bool DEFAULT true
);

CREATE TABLE user_coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  coupon_id       uuid NOT NULL REFERENCES coupons(id),
  status          text NOT NULL DEFAULT 'unused' CHECK (status IN ('unused','used','expired')),
  used_order_id   uuid REFERENCES orders(id),
  received_at     timestamptz DEFAULT now(),
  used_at         timestamptz
);

-- 添加 orders 表的 coupon_id 外键
ALTER TABLE orders ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES user_coupons(id);

CREATE TABLE campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('flash_sale','topic','ranking')),
  banner_url      text,
  description     text,
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  is_active       bool DEFAULT true,
  sort_order      int DEFAULT 0
);

CREATE TABLE campaign_products (
  campaign_id     uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES products(id),
  sort_order      int DEFAULT 0,
  PRIMARY KEY (campaign_id, product_id)
);

-- ============================================================
-- 4.7 运营管理
-- ============================================================

CREATE TABLE reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid NOT NULL REFERENCES profiles(id),
  target_type     text NOT NULL CHECK (target_type IN ('product','user','message')),
  target_id       uuid NOT NULL,
  reason          text NOT NULL CHECK (reason IN ('fraud','prohibited','spam','inappropriate','other')),
  description     text,
  evidence        text[],
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  resolution      text,
  handled_by      uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now(),
  resolved_at     timestamptz
);

CREATE TABLE ai_moderation_logs (
  id              bigserial PRIMARY KEY,
  target_type     text NOT NULL CHECK (target_type IN ('product','message','image','user')),
  target_id       uuid NOT NULL,
  check_type      text NOT NULL CHECK (check_type IN ('text','image','behavior')),
  result          text NOT NULL CHECK (result IN ('pass','warning','block')),
  confidence      decimal(3,2),
  flags           text[],
  raw_response    jsonb,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE banners (
  id              serial PRIMARY KEY,
  title           text,
  image_url       text NOT NULL,
  link_type       text CHECK (link_type IN ('product','campaign','url','circle')),
  link_id         text,
  sort_order      int DEFAULT 0,
  position        text DEFAULT 'home_top' CHECK (position IN ('home_top','home_middle','category')),
  is_active       bool DEFAULT true,
  start_at        timestamptz,
  end_at          timestamptz
);

CREATE TABLE announcements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  content         text,
  type            text DEFAULT 'system' CHECK (type IN ('system','activity','maintenance')),
  is_pinned       bool DEFAULT false,
  target          text DEFAULT 'all' CHECK (target IN ('all','seller','merchant')),
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE help_articles (
  id              serial PRIMARY KEY,
  category        text,
  title           text NOT NULL,
  content         text,
  sort_order      int DEFAULT 0,
  view_count      int DEFAULT 0,
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE city_stats (
  id              bigserial PRIMARY KEY,
  city_id         int NOT NULL REFERENCES locations(id),
  stat_date       date NOT NULL,
  new_users       int DEFAULT 0,
  new_products    int DEFAULT 0,
  gmv             decimal(12,2) DEFAULT 0,
  order_count     int DEFAULT 0,
  active_users    int DEFAULT 0,
  avg_price       decimal(10,2) DEFAULT 0,
  UNIQUE(city_id, stat_date)
);

CREATE TABLE finance_reconciliation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period          text NOT NULL,
  total_income    decimal(12,2) DEFAULT 0,
  total_commission decimal(12,2) DEFAULT 0,
  total_refund    decimal(12,2) DEFAULT 0,
  net_amount      decimal(12,2) DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reconciled','disputed')),
  reconciled_by   uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE risk_rules (
  id              serial PRIMARY KEY,
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('transaction','content','account')),
  condition       jsonb NOT NULL,
  action          text NOT NULL CHECK (action IN ('warn','block','review','ban')),
  severity        text NOT NULL CHECK (severity IN ('low','medium','high')),
  is_active       bool DEFAULT true,
  hit_count       int DEFAULT 0,
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 4.8 系统
-- ============================================================

CREATE TABLE system_configs (
  id              serial PRIMARY KEY,
  key             text UNIQUE NOT NULL,
  value           jsonb NOT NULL,
  description     text,
  updated_by      uuid REFERENCES profiles(id),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE scheduled_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type        text NOT NULL CHECK (job_type IN ('stale_analysis','data_aggregation','ai_cleanup','notification_digest','settlement')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','success','failed')),
  params          jsonb,
  result          jsonb,
  started_at      timestamptz,
  finished_at     timestamptz,
  error           text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE audit_logs (
  id              bigserial PRIMARY KEY,
  operator_id     uuid NOT NULL REFERENCES profiles(id),
  action          text NOT NULL,
  target_type     text,
  target_id       uuid,
  old_value       jsonb,
  new_value       jsonb,
  ip_address      inet,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_audit_logs_operator ON audit_logs(operator_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================
-- RLS (Row Level Security) 策略
-- ============================================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- profiles: 用户只能查看和编辑自己的资料
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- products: 所有人可查看，卖家可增删改
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Sellers can insert products" ON products FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update own products" ON products FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "Sellers can delete own products" ON products FOR DELETE USING (seller_id = auth.uid());

-- orders: 买卖双方可查看
CREATE POLICY "Buyers and sellers can view orders" ON orders FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Buyers and sellers can update orders" ON orders FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- messages: 会话成员可查看
CREATE POLICY "Conversation members can view messages" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- notifications: 用户只能查看自己的
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- favorites: 用户管理自己的收藏
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (user_id = auth.uid());

-- addresses: 用户管理自己的地址
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- 触发器：自动创建用户资料
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, phone)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nickname', '用户'), new.phone);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 完成！
-- ============================================================
