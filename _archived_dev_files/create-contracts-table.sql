-- إنشاء جدول العقود إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  contract1_url TEXT,
  contract2_url TEXT,
  contract1_filename VARCHAR(255),
  contract2_filename VARCHAR(255),
  status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'reviewed', 'approved', 'rejected')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء trigger لتحديث updated_at في جدول العقود
CREATE OR REPLACE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إنشاء فهارس جدول العقود
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_order_id ON contracts(order_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_uploaded_at ON contracts(uploaded_at);

-- تفعيل Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- إنشاء Policies للعقود
CREATE POLICY "Users can view their own contracts" ON contracts
    FOR SELECT USING (user_id::text = auth.uid());

CREATE POLICY "Users can manage their own contracts" ON contracts
    FOR ALL USING (user_id::text = auth.uid());

CREATE POLICY "Admin can view all contracts" ON contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can manage all contracts" ON contracts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid() AND role = 'admin'
        )
    );

-- إنشاء bucket للعقود في storage إذا لم يكن موجوداً (هذا سيتم عمله من خلال API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false) ON CONFLICT DO NOTHING;