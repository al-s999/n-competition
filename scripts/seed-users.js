require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_SECRET_KEY
);

const usersToSeed = [
  // COMPETITION ROLE
  { name: 'Budi Santoso', email: 'budi@example.com', role: 'COMPETITION' },
  { name: 'Siti Aminah', email: 'siti@example.com', role: 'COMPETITION' },
  { name: 'Agus Pratama', email: 'agus@example.com', role: 'COMPETITION' },
  // USER ROLE
  { name: 'Rina Sari', email: 'rina@example.com', role: 'USER' },
  { name: 'Doni Saputra', email: 'doni@example.com', role: 'USER' },
  { name: 'Maya Indah', email: 'maya@example.com', role: 'USER' },
  { name: 'Kevin Wijaya', email: 'kevin@example.com', role: 'USER' },
  { name: 'Putri Lestari', email: 'putri@example.com', role: 'USER' },
  { name: 'Reza Aditya', email: 'reza@example.com', role: 'USER' },
  { name: 'Dinda Permata', email: 'dinda@example.com', role: 'USER' },
  { name: 'Hendra Gunawan', email: 'hendra@example.com', role: 'USER' },
];

async function seed() {
  console.log('Seeding users...');
  
  for (const u of usersToSeed) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'password123',
      email_confirm: true,
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`User ${u.email} already exists in auth.`);
        continue;
      }
      console.error(`Error creating auth user ${u.email}:`, authError);
      continue;
    }
    
    console.log(`Created auth user: ${u.email} (${authData.user.id})`);
    
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name: u.name,
        email: u.email,
        role: u.role,
      });
      
    if (dbError) {
      console.error(`Error inserting public user ${u.email}:`, dbError);
    } else {
      console.log(`Inserted public user: ${u.name} [${u.role}]`);
    }
  }
  
  console.log('Seeding complete.');
}

seed();
