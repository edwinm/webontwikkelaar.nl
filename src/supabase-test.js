import { createClient } from '@supabase/supabase-js'

// Run as: node --env-file=.env src/supabase-test.js

// Docs: https://supabase.com/docs/reference/javascript/introduction


const supabase = createClient(process.env.SupabaseUrl, process.env.SupabaseAnonKey);

const { data, error } = await supabase
    .from('conferences')
    .select();

console.log('error', error);

console.log('data', data);