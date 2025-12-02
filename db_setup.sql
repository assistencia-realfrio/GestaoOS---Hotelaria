-- Tabela de Lojas
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  short_code TEXT UNIQUE, -- Nova coluna para o código curto da loja
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados de exemplo para lojas, se não existirem
INSERT INTO stores (id, name, short_code, address, phone, email)
VALUES
  ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'CALDAS DA RAINHA', 'CR', 'Rua Principal, 10, Caldas da Rainha', '262123456', 'caldas@gestaos.pt'),
  ('f0e9d8c7-b6a5-4321-fedc-ba9876543210', 'PORTO DE MÓS', 'PM', 'Avenida Central, 20, Porto de Mós', '244987654', 'portodemos@gestaos.pt')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, short_code = EXCLUDED.short_code, address = EXCLUDED.address, phone = EXCLUDED.phone, email = EXCLUDED.email;


-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  notes TEXT,
  store_id UUID REFERENCES stores(id), -- Chave estrangeira para a loja
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS equipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  install_date DATE,
  status TEXT DEFAULT 'ativo',
  store_id UUID REFERENCES stores(id), -- Chave estrangeira para a loja
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Ordens de Serviço
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE, -- O código será gerado por um trigger
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipments(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'por_iniciar', -- Estado inicial padrão
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'media',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date DATE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  internal_notes TEXT,
  client_signature TEXT,
  store_id UUID REFERENCES stores(id) -- Chave estrangeira para a loja
);

-- Função para gerar o código da OS
CREATE OR REPLACE FUNCTION generate_os_code()
RETURNS TRIGGER AS $$
DECLARE
    store_short_code TEXT;
    os_date TEXT;
    sequential_number INT;
BEGIN
    -- Obter o short_code da loja
    SELECT short_code INTO store_short_code FROM stores WHERE id = NEW.store_id;

    IF store_short_code IS NULL THEN
        RAISE EXCEPTION 'Short code for store_id % not found.', NEW.store_id;
    END IF;

    -- Formatar a data atual (YYYYMMDD)
    os_date := TO_CHAR(NOW(), 'YYYYMMDD');

    -- Obter o próximo número sequencial para a loja e data
    SELECT COALESCE(MAX(SUBSTRING(code FROM '(\d+)$')::INT), 0) + 1
    INTO sequential_number
    FROM service_orders
    WHERE store_id = NEW.store_id
      AND code LIKE store_short_code || '-' || os_date || '%';

    -- Atribuir o novo código à OS
    NEW.code := store_short_code || '-' || os_date || '-' || LPAD(sequential_number::TEXT, 3, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para chamar a função antes de inserir uma nova OS
CREATE OR REPLACE TRIGGER set_os_code_before_insert
BEFORE INSERT ON service_orders
FOR EACH ROW
EXECUTE FUNCTION generate_os_code();


-- Tabela de Peças Usadas na OS
CREATE TABLE IF NOT EXISTS service_order_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  os_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  part_id TEXT, -- Pode ser um ID do catálogo de peças ou apenas um identificador
  name TEXT NOT NULL,
  reference TEXT,
  quantity INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Fotos da OS
CREATE TABLE IF NOT EXISTS service_order_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  os_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT, -- 'antes', 'depois', 'peca', 'geral'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Registo de Tempo da OS
CREATE TABLE IF NOT EXISTS os_tempo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  os_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Perfis (para utilizadores)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'tecnico', -- 'admin', 'backoffice', 'tecnico'
  avatar_url TEXT,
  store_id UUID REFERENCES stores(id), -- Loja atribuída ao utilizador
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para perfis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Função para criar um perfil automaticamente após o registo de um novo utilizador
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para a função handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set up Storage for OS Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('os-photos', 'os-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Policy for os-photos bucket
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'os-photos');

CREATE POLICY "Allow public access to photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'os-photos');