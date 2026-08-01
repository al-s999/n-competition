require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEST_SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

async function fixNames() {
  console.log("Fixing participant names...");
  for (let i = 1; i <= 50; i++) {
    const email = `peserta${i}_osn2026@example.com`;
    const newName = INDONESIAN_NAMES[i - 1] || `Peserta ${i}`;
    
    const { error } = await supabase
      .from('users')
      .update({ name: newName })
      .eq('email', email);
      
    if (error) {
      console.error(`Failed to update ${email}:`, error);
    } else {
      console.log(`Updated ${email} to ${newName}`);
    }
  }
  console.log("Done fixing names.");
}

fixNames();
