require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

// Helper to generate a random number
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// Helper to pick random from array
const randomPick = (arr) => arr[randomInt(0, arr.length - 1)];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEST_SUPABASE_SECRET_KEY, // Service role key to bypass RLS & create users
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

const SUBJECTS = ["matematics", "IPA", "IPS"];
const LOCATIONS = ["Jakarta", "Surabaya", "Bandung", "Yogyakarta", "Semarang", "Malang", "Bali", "Medan", "Makassar", "Palembang"];
const SCHOOLS = ["SMA 1", "SMA 2", "SMA 3", "SMA 4", "SMA 5", "SMA Bina Bangsa", "SMA Taruna"];

// Core Users
const coreUsers = [
  { name: 'Budi Santoso', email: 'budi@example.com', role: 'COMPETITION' },
  { name: 'Kevin Wijaya', email: 'kevin@example.com', role: 'USER' },
  { name: 'Rina Sari', email: 'rina@example.com', role: 'USER' },
  { name: 'Reza Aditya', email: 'reza@example.com', role: 'USER' },
];

async function getOrCreateUser(u) {
  // Check if exists in auth
  const { data: existingAuth, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  
  let authUser = existingAuth.users.find(user => user.email === u.email);
  
  if (!authUser) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'password123',
      email_confirm: true,
    });
    if (authError) throw authError;
    authUser = authData.user;
    
    // Insert into public users
    const { error: dbError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        name: u.name,
        email: u.email,
        role: u.role || 'USER',
      });
    if (dbError) throw dbError;
    console.log(`Created new user: ${u.email}`);
  } else {
    // Ensure public user exists too
    await supabase.from('users').upsert({
      id: authUser.id,
      name: u.name,
      email: u.email,
      role: u.role || 'USER',
    });
  }
  
  return authUser;
}

async function seed() {
  console.log('--- Seeding Olimpiade Sains Nasional 2026 ---');
  try {
    // 1. Setup Core Users
    console.log('Setting up core users...');
    const budi = await getOrCreateUser(coreUsers[0]);
    const kevin = await getOrCreateUser(coreUsers[1]);
    const rina = await getOrCreateUser(coreUsers[2]);
    const reza = await getOrCreateUser(coreUsers[3]);
    
    // 2. Create Competition
    console.log('Creating competition...');
    const { data: comp, error: compError } = await supabase
      .from('competitions')
      .insert({
        title: 'olimpiade sains nasional 2026',
        description: 'Kompetisi tingkat nasional untuk bidang Matematika, IPA, dan IPS. Menghadirkan peserta terbaik dari seluruh Indonesia.',
        creator_id: budi.id,
        status: 'draft', // Using 'draft' as it's a safe enum value
        is_split_by_subject: true,
        subjects: SUBJECTS,
        manager_id: kevin.id,
        receptionist_id: rina.id,
        mc_id: reza.id,
        location: 'Online / Jakarta',
        fee: 50000,
        total_prize: 10000000,
        registration_start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        registration_end: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
        match_start: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        match_end: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
        to_semifinal: 10,
        to_final: 3,
      })
      .select()
      .single();
      
    if (compError) throw compError;
    console.log(`Competition created with ID: ${comp.id}`);
    
    // 3. Generate 50 Participants
    console.log('Generating 50 participants...');
    let participantsData = [];
    
    const INDONESIAN_NAMES = [
      "Andi Saputra", "Ayu Lestari", "Bagus Pratama", "Bunga Citra", "Cahyo Nugroho",
      "Citra Dewi", "Dedi Kurniawan", "Desy Ratnasari", "Eko Prasetyo", "Eka Putri",
      "Fajar Hidayat", "Fitriani", "Gilang Ramadhan", "Gita Savitri", "Hendra Gunawan",
      "Hesti Mulyani", "Irfan Hakim", "Indah Permata", "Joko Susilo", "Julia Mulyani",
      "Kevin Anggara", "Kurniawan Dwi", "Lukman Hakim", "Larasati", "Muhamad Rizky",
      "Melati Kusuma", "Nugroho", "Nadia Safira", "Oka Antara", "Olivia Jensen",
      "Pratama Arhan", "Putri Marino", "Qori Akbar", "Qonita", "Reza Rahadian",
      "Rini Wulandari", "Syahrul Yasin", "Siti Aminah", "Taufik Hidayat", "Tiara Andini",
      "Umar Syarief", "Ussy Sulistiawaty", "Vicky Prasetyo", "Vina Panduwinata", "Wahyudi",
      "Wulan Guritno", "Xavier Pramana", "Yanto Basna", "Yuni Shara", "Zainuddin MZ"
    ];
    
    for (let i = 1; i <= 50; i++) {
      const email = `peserta${i}_osn2026@example.com`;
      const loc = randomPick(LOCATIONS);
      const school = `${randomPick(SCHOOLS)} ${loc}`;
      const name = INDONESIAN_NAMES[i - 1] || `Peserta ${i} ${loc}`;
      
      const pUser = await getOrCreateUser({ name, email, role: 'USER' });
      
      // Distribute statuses across phases to provide rich mockup data
      let regStatus = 'registered';
      let payStatus = 'unpaid';
      let isFinalist = false;
      
      const randPhase = randomInt(1, 100);
      if (randPhase <= 10) { // 10% just registered, unpaid
        regStatus = 'registered';
        payStatus = 'unpaid';
      } else if (randPhase <= 30) { // 20% paid but not qualified
        regStatus = 'paid';
        payStatus = 'paid';
      } else if (randPhase <= 80) { // 50% qualified to group stage
        regStatus = 'qualified';
        payStatus = 'paid';
      } else { // 20% reached final
        regStatus = 'final';
        payStatus = 'paid';
        isFinalist = true;
      }
      
      const subject = randomPick(SUBJECTS);
      const gamesPlayed = randomInt(0, 10);
      const avgScore = randomInt(40, 100);
      
      const isSmp = i <= 25;
      const category = isSmp ? 'smp/mts' : 'sma/smk/ma';
      
      let finalSchool = school;
      if (isSmp) {
        finalSchool = finalSchool.replace(/SMA/gi, 'SMP');
      } else {
        finalSchool = finalSchool.replace(/SMP/gi, 'SMA');
        if (!finalSchool.includes('SMA')) finalSchool += " SMA";
      }

      participantsData.push({
        competition_id: comp.id,
        user_id: pUser.id,
        registration_status: regStatus,
        payment_status: payStatus,
        is_finalist: isFinalist,
        is_present: randomInt(1, 10) > 2, // 80% attendance
        category: category,
        subject: subject,
        school_name: finalSchool,
        games_played: gamesPlayed,
        avg_score: avgScore,
      });
    }
    
    // 4. Insert Participants
    console.log(`Inserting ${participantsData.length} participants...`);
    const { error: partError } = await supabase
      .from('participants')
      .insert(participantsData);
      
    if (partError) throw partError;
    console.log('Successfully seeded all participants!');
    console.log('--- Seeding Complete ---');
    
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

seed();
