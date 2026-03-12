-- Corrige ou recria a credencial seeded do SuperAdmin sem resetar o banco inteiro.
-- Senha esperada: Admin@123

INSERT INTO public.users (tenant_id, name, email, password_hash, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Super Admin',
  'superadmin@atend.ai',
  'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7',
  'SuperAdmin'
)
ON CONFLICT (email) DO UPDATE SET
  tenant_id = excluded.tenant_id,
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  deleted_at = null;
