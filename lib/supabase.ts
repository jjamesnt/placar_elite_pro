
import { createClient } from '@supabase/supabase-js';

// James: Mantendo as chaves hardcoded para restaurar imediatamente o app na Vercel (já que não temos variáveis de ambiente configuradas lá)
const URL = 'https://uuqgcpojxrwixbmpxyoe.supabase.co'; 
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWdjcG9qeHJ3aXhibXB4eW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjk0MzIsImV4cCI6MjA4NTgwNTQzMn0.PwWs8ZxkTZL4bXHFD3YUUjf0L4SOYNOT1mR2a4ub_jA';

export const supabase = createClient(URL, KEY);
