const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env';
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) {
    env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fix() {
  const categories = ["SMP/MTS", "SMA/SMK/MA"]; // The ones we seeded
  
  const { data, error } = await supabase.from('competitions').select('id, title, categories');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const comp of data) {
    if (!comp.categories || comp.categories.length === 0) {
      await supabase.from('competitions').update({ categories: categories }).eq('id', comp.id);
      console.log(`Updated ${comp.id} categories`);
    }
  }
}
fix();
