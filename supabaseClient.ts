import { createClient } from '@supabase/supabase-js';

// Função segura para aceder a variáveis de ambiente sem crachar o browser
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
  } catch (e) {
    console.warn('Erro ao ler variável de ambiente', key);
  }
  return '';
};

// Configuração padrão para evitar crash se as vars não existirem
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);