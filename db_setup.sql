-- Tabela de Lojas
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir as lojas iniciais
INSERT INTO stores (id, name, address, phone, email) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'CALDAS DA RAINHA', 'Rua Principal, 10, Caldas da Rainha', '262123456', 'caldas@gestaos.pt'),
('f0e9d8c7-b6a5-4321-fedc-ba9876543210', 'PORTO DE MÓS', 'Avenida Central, 20, Porto de Mós', '244987654', 'portodemos@gestaos.pt')
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna store_id à tabela clients
ALTER TABLE clients
ADD COLUMN store_id UUID REFERENCES stores(id);

-- Adicionar coluna store_id à tabela equipments
ALTER TABLE equipments
ADD COLUMN store_id UUID REFERENCES stores(id);

-- Adicionar coluna store_id à tabela service_orders
ALTER TABLE service_orders
ADD COLUMN store_id UUID REFERENCES stores(id);

-- Opcional: Atualizar clientes/equipamentos/OS existentes para uma loja padrão
-- UPDATE clients SET store_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef' WHERE store_id IS NULL;
-- UPDATE equipments SET store_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef' WHERE store_id IS NULL;
-- UPDATE service_orders SET store_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef' WHERE store_id IS NULL;

-- Criar RLS policies para as novas tabelas (exemplo, ajustar conforme necessário)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON stores FOR SELECT USING (TRUE);

-- Atualizar RLS policies para clients, equipments, service_orders para incluir store_id
-- Exemplo: Permitir acesso apenas a clientes da mesma loja do utilizador
-- (Isto requer que o perfil do utilizador tenha um store_id associado)
-- CREATE POLICY "Clients can be viewed by users in the same store" ON clients FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE store_id = clients.store_id));