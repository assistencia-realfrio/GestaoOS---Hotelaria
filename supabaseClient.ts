import { createClient } from '@supabase/supabase-js';

// Função auxiliar para aceder a variáveis de ambiente de forma segura
// previne erros se import.meta.env não estiver definido
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignorar erros de acesso
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ AVISO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.\n' +
    'A aplicação não conseguirá ligar à base de dados.\n\n' +
    'SOLUÇÃO:\n' +
    '1. Procure o ficheiro "env.example" na raiz do projeto.\n' +
    '2. Duplique-o ou renomeie-o para ".env".\n' +
    '3. Preencha as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.\n' +
    '4. Reinicie o servidor.'
  );
}

// Criação do cliente. Se as variáveis estiverem vazias, criará um cliente placeholder
// permitindo que o ecrã de login apareça e o utilizador possa escolher "Modo Demo".
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);