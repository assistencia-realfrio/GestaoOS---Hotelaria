import { createClient } from '@supabase/supabase-js';

// No Vite, as variáveis de ambiente são acedidas via import.meta.env
// Certifique-se que tem um ficheiro .env na raiz do projeto com:
// VITE_SUPABASE_URL=https://seu-projeto.supabase.co
// VITE_SUPABASE_ANON_KEY=sua-chave

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'AVISO: Variáveis de ambiente do Supabase não encontradas. A aplicação pode não funcionar corretamente no modo online.'
  );
}

// Criação do cliente. Se as variáveis estiverem vazias, criará um cliente inválido mas não quebrará a app imediatamente,
// permitindo que o ecrã de login apareça e o utilizador possa escolher "Modo Demo".
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);