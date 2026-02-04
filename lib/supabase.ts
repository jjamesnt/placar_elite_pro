
import { createClient } from '@supabase/supabase-js';

// James: Após criar o novo projeto no Supabase, vá em:
// Project Settings -> API
// Copie a "Project URL" e a "API key (anon public)" e cole abaixo.

const URL = 'https://uuqgcpojxrwixbmpxyoe.supabase.co'; 
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWdjcG9qeHJ3aXhibXB4eW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjk0MzIsImV4cCI6MjA4NTgwNTQzMn0.PwWs8ZxkTZL4bXHFD3YUUjf0L4SOYNOT1mR2a4ub_jA';

export const supabase = createClient(URL, KEY);
