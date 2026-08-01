require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEST_SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixRoles() {
  console.log("Fixing roles to lowercase...");
  
  // Update all users with uppercase COMPETITION to lowercase
  const { error } = await supabase
    .from('users')
    .update({ role: 'competition' })
    .eq('role', 'COMPETITION');
    
  if (error) {
    console.error("Failed to update roles:", error);
  } else {
    console.log("Successfully updated all 'COMPETITION' roles to 'competition' in the database!");
  }
}

fixRoles();
