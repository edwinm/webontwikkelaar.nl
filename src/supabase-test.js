import { createClient } from '@supabase/supabase-js'

// Run as: node --env-file=.env src/supabase-test.js

// Docs: https://supabase.com/docs/reference/javascript/introduction

// CREATE VIEW conferences_with_location AS
// SELECT
// conf.*,
//     c.latitude,
//     c.longitude
// FROM conferences conf
// LEFT JOIN cities c ON c.name = conf.city;

const today = new Intl.DateTimeFormat('sv-SE').format(new Date());

const supabase = createClient(process.env.SupabaseUrl, process.env.SupabaseAnonKey);

const { data, error } = await supabase
    .from('conferences_with_location')
    .select()
    .gte('end_date', today)
    .order('start_date', { ascending: true });

console.log('error', error);

console.log('data', data);