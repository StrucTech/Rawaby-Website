-- تحديث بنية قاعدة البيانات لحل مشاكل التعيين

-- 1. إضافة حقول جديدة لجدول orders لتوضيح المسؤوليات
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS assigned_supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_delegate_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assignment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;

-- 2. إنشاء فهارس للحقول الجديدة
CREATE INDEX IF NOT EXISTS idx_orders_assigned_supervisor_id ON orders(assigned_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_delegate_id ON orders(assigned_delegate_id);
CREATE INDEX IF NOT EXISTS idx_orders_assignment_date ON orders(assignment_date);

-- 3. إضافة تعليقات للتوضيح
COMMENT ON COLUMN orders.supervisor_id IS 'المشرف المسؤول عن الطلب (قديم - للتوافق فقط)';
COMMENT ON COLUMN orders.assigned_supervisor_id IS 'المشرف الذي عين المندوب للطلب';
COMMENT ON COLUMN orders.assigned_delegate_id IS 'المندوب المعين للطلب';
COMMENT ON COLUMN orders.delegate_id IS 'حقل قديم - استخدم assigned_delegate_id';
COMMENT ON COLUMN orders.staff_id IS 'حقل قديم - استخدم assigned_delegate_id';

-- 4. إنشاء دالة لنقل البيانات من note إلى الحقول الجديدة
CREATE OR REPLACE FUNCTION migrate_assignment_data()
RETURNS void AS $$
DECLARE
    order_record RECORD;
    note_data JSONB;
BEGIN
    FOR order_record IN SELECT id, note FROM orders WHERE note IS NOT NULL LOOP
        BEGIN
            -- محاولة تحليل JSON من حقل note
            note_data := order_record.note::JSONB;
            
            -- تحديث الحقول الجديدة إذا وجدت البيانات
            UPDATE orders 
            SET 
                assigned_supervisor_id = (note_data->>'assignedBy')::UUID,
                assigned_delegate_id = (note_data->>'assignedDelegate')::UUID,
                assignment_date = (note_data->>'assignedAt')::TIMESTAMP WITH TIME ZONE,
                completion_date = (note_data->>'completedAt')::TIMESTAMP WITH TIME ZONE
            WHERE id = order_record.id
            AND (
                (note_data->>'assignedBy') IS NOT NULL OR
                (note_data->>'assignedDelegate') IS NOT NULL
            );
            
        EXCEPTION WHEN OTHERS THEN
            -- تجاهل الأخطاء وأكمل للسجل التالي
            CONTINUE;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. تشغيل دالة النقل
SELECT migrate_assignment_data();

-- 6. إنشاء view لعرض الطلبات مع معلومات مفصلة
CREATE OR REPLACE VIEW orders_detailed AS
SELECT 
    o.id,
    o.client_id,
    o.supervisor_id,
    o.delegate_id,
    o.staff_id,
    o.services,
    o.status,
    o.total_price,
    o.note,
    o.created_at,
    
    -- الحقول الجديدة المضافة
    o.assigned_supervisor_id,
    o.assigned_delegate_id,
    o.assignment_date,
    o.completion_date,
    
    -- معلومات العميل
    client.name as client_name,
    client.email as client_email,
    
    -- معلومات المشرف المعين
    supervisor.name as assigned_supervisor_name,
    supervisor.email as assigned_supervisor_email,
    
    -- معلومات المندوب المعين
    delegate.name as assigned_delegate_name,
    delegate.email as assigned_delegate_email,
    
    -- حالة التعيين
    CASE 
        WHEN o.assigned_delegate_id IS NOT NULL THEN 'assigned'
        ELSE 'unassigned'
    END as assignment_status,
    
    -- اسم الخدمة (من JSON في note)
    COALESCE(
        CASE 
            WHEN o.note IS NOT NULL AND o.note != '' THEN
                (o.note::JSONB->'selectedServices'->0->>'title')
            ELSE NULL
        END,
        'خدمة غير محددة'
    ) as service_name,
    
    -- معلومات ولي الأمر (من JSON في note)
    CASE 
        WHEN o.note IS NOT NULL AND o.note != '' THEN
            (o.note::JSONB->'guardianInfo'->>'fullName')
        ELSE NULL
    END as guardian_name
    
FROM orders o
LEFT JOIN users client ON o.client_id = client.id
LEFT JOIN users supervisor ON o.assigned_supervisor_id = supervisor.id
LEFT JOIN users delegate ON o.assigned_delegate_id = delegate.id;

-- 7. منح الصلاحيات للـ view
ALTER VIEW orders_detailed OWNER TO postgres;

-- 8. إنشاء دالة لتعيين مندوب بطريقة صحيحة
CREATE OR REPLACE FUNCTION assign_delegate_to_order(
    p_order_id UUID,
    p_supervisor_id UUID,
    p_delegate_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_assignment RECORD;
BEGIN
    -- التحقق من أن الطلب غير معين لمندوب
    SELECT assigned_delegate_id INTO existing_assignment 
    FROM orders 
    WHERE id = p_order_id;
    
    IF existing_assignment.assigned_delegate_id IS NOT NULL THEN
        RAISE EXCEPTION 'الطلب معين لمندوب بالفعل';
    END IF;
    
    -- تعيين المندوب
    UPDATE orders 
    SET 
        assigned_supervisor_id = p_supervisor_id,
        assigned_delegate_id = p_delegate_id,
        assignment_date = NOW(),
        status = CASE WHEN status = 'new' THEN 'in_progress' ELSE status END
    WHERE id = p_order_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. إنشاء trigger لتحديث معلومات التعيين عند تغيير الـ note
CREATE OR REPLACE FUNCTION sync_assignment_from_note()
RETURNS TRIGGER AS $$
DECLARE
    note_data JSONB;
BEGIN
    IF NEW.note IS NOT NULL AND NEW.note != OLD.note THEN
        BEGIN
            note_data := NEW.note::JSONB;
            
            -- تحديث الحقول من الـ note
            NEW.assigned_supervisor_id := (note_data->>'assignedBy')::UUID;
            NEW.assigned_delegate_id := (note_data->>'assignedDelegate')::UUID;
            NEW.assignment_date := (note_data->>'assignedAt')::TIMESTAMP WITH TIME ZONE;
            NEW.completion_date := (note_data->>'completedAt')::TIMESTAMP WITH TIME ZONE;
            
        EXCEPTION WHEN OTHERS THEN
            -- في حالة خطأ، لا تغير شيء
            NULL;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. إنشاء الـ trigger
DROP TRIGGER IF EXISTS sync_assignment_trigger ON orders;
CREATE TRIGGER sync_assignment_trigger 
    BEFORE UPDATE ON orders
    FOR EACH ROW 
    EXECUTE FUNCTION sync_assignment_from_note();