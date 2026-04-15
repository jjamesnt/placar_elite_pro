
import { createClient } from '@supabase/supabase-js';

// As credenciais são lidas do arquivo .env na raiz do projeto.
// Vite expõe variáveis com prefixo VITE_ via import.meta.env.
const URL = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(URL, KEY);
