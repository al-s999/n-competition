const fs = require('fs');
const path = require('path');
const idDict = require('./id.js');

// Merge idDict with some custom manual phrases we know exist in the codebase
const customTranslations = {
  "Masukkan nominal Total Prize terlebih dahulu.": "Please enter the Total Prize amount first.",
  "Tidak ada kompetisi ditemukan.": "No competitions found.",
  "Tidak ada peserta yang ditemukan.": "No participants found.",
  "Coba ubah kata kunci pencarian atau filter.": "Try changing the search keywords or filters.",
  "Apakah Anda yakin ingin menghapus kompetisi ini? Tindakan ini tidak dapat dibatalkan.": "Are you sure you want to delete this competition? This action cannot be undone.",
  "Berhasil dihapus.": "Successfully deleted.",
  "Gagal menghapus: ": "Failed to delete: ",
  "Pindahkan peserta ke finalis dari tab Kualifikasi terlebih dahulu.": "Move participants to finalists from the Qualification tab first.",
  "Peserta disaring berdasarkan kategori dan subjek braket ini.": "Participants are filtered based on the category and subject of this bracket.",
  "Apakah Anda yakin ingin menyelesaikan pertandingan ini? Peringkat akan dikunci.": "Are you sure you want to finalize this match? Rankings will be locked.",
  "Apakah Anda yakin ingin mengeluarkan peserta ini dari pertandingan?": "Are you sure you want to remove this participant from the match?",
  "Pilih peserta untuk ditambahkan ke pertandingan ini.": "Select a participant to add to this match.",
  "-- Pilih Peserta --": "-- Select Participant --",
  "Tidak ada pertandingan yang cocok.": "No matching matches.",
  "Buat pertandingan terlebih dahulu untuk melihat braket.": "Generate matches first to view the bracket.",
  "Tidak ada finalis yang cocok atau semua sudah masuk ke braket pada fase ini.": "No matching finalists or all have entered the bracket in this phase.",
  "Belum ada data braket.": "No bracket data yet.",
  "Bagikan kode undangan ini atau kode QR dengan resepsionis Anda agar mereka dapat bergabung secara instan.": "Share this invite code or QR code with your receptionist so they can join instantly.",
  "Disalin ke papan klip!": "Copied to clipboard!",
  "Pindai kode ini menggunakan Aplikasi Resepsionis.": "Scan this code using the Receptionist App.",
  "Kelola siapa yang memiliki akses untuk memindai tiket.": "Manage who has access to scan tickets.",
  "Belum ada resepsionis yang meminta akses.": "No receptionists have requested access yet.",
  "Apakah Anda yakin ingin menghapus resepsionis ini?": "Are you sure you want to remove this receptionist?",
  "Kelola informasi pribadi dan detail kontak Anda.": "Manage your personal information and contact details.",
  "Pilih username": "Choose a username",
  "Nama lengkap": "Full name",
  "NIK atau NISN": "National ID Number",
  "Cth: SMA Negeri 1": "E.g. High School 1",
  "Alamat tempat tinggal lengkap": "Full residential address",
  "Harap berikan foto KTP atau Kartu Pelajar yang jelas.": "Please provide a clear photo of your ID Card or Student Card.",
  "Posisikan wajah di dalam bingkai dan ikuti instruksi.": "Position your face within the frame and follow the instructions.",
  "Harap periksa data yang diekstraksi dari kartu identitas Anda.": "Please check the data extracted from your ID card.",
  "Pastikan teks dan foto di kartu terlihat jelas": "Ensure text and photo on the card are clearly visible",
  "Posisikan wajah Anda di dalam bingkai dan ikuti instruksi.": "Position your face inside the frame and follow the instructions.",
  "Harap konfirmasi data yang diekstrak.": "Please confirm the extracted data.",
  "Pilih Provinsi": "Select Province",
  "Pilih Kab/Kota": "Select Regency/City",
  "Pilih Kecamatan": "Select District",
  "Pilih Desa/Kelurahan": "Select Village/Sub-district",
  "Detail Jalan, RT/RW, Perumahan, dsb.": "Street Details, Housing, etc.",
  "Pilih opsi kompetisi berdasarkan dokumen terverifikasi Anda.": "Choose competition options based on your verified documents.",
  "Posisikan kode QR di tengah bingkai untuk memindai.": "Position the QR code in the middle of the frame to scan.",
  "Selalu bandingkan": "Always compare",
  "dengan orang yang ada di depan Anda.": "with the person in front of you.",
  "Jika wajah tidak cocok, klik": "If the face does not match, click",
  "dan informasikan keamanan.": "and inform security.",
  "Cth: Wajah tidak cocok, dokumen tidak valid...": "E.g. Face does not match, invalid document...",
  "Cth: Cerdas Cermat Online - Sains": "E.g. Online Quiz - Science",
  "Tulis detail kompetisi, hadiah, dll.": "Write competition details, prizes, etc.",
  "Pilih Tipe Kompetisi": "Select Competition Type",
  "Tampilan braket berdasarkan jadwal.": "Bracket view based on schedule.",
  "Silakan tambah atau jadwalkan otomatis pertandingan": "Please add or auto-schedule matches",
  "Braket akan dibuat berdasarkan jadwal.": "Bracket will be created based on the schedule.",
  "Kelola setiap pertandingan": "Manage each match",
  "Tidak ada subjek tersedia": "No subjects available",
  "Kategori, Fase, dan Ronde harus diisi!": "Category, Phase, and Round must be filled!",
  "Silakan pilih subjek!": "Please select a subject!",
  "Jadwal ini sudah ada!": "This schedule already exists!",
  "Tetapkan satu harga tetap": "Set a fixed price",
  "Konfigurasi tingkatan harga berbeda": "Configure different price tiers",
  "Belum": "Pending",
  "Check In": "Checked In",
  "Sekolah Tidak Diketahui": "Unknown School"
};

const exactWordMap = {};

// Prioritize longer strings to prevent sub-string replacement issues
const sortedKeys = [...Object.values(idDict), ...Object.keys(customTranslations)].sort((a, b) => b.length - a.length);

for (const idStr of sortedKeys) {
  // Find the english equivalent in idDict key, or use customTranslations
  let enStr = customTranslations[idStr];
  if (!enStr) {
    const key = Object.keys(idDict).find(k => idDict[k] === idStr);
    if (key) {
      const parts = key.split('.');
      const word = parts[parts.length - 1].replace(/_/g, ' ');
      // Capitalize first letter of each word
      enStr = word.replace(/\b\w/g, l => l.toUpperCase());
      
      // Some manual overrides for keys
      if (key === 'action.search') enStr = 'Search...';
      if (key === 'action.view_details') enStr = 'View Details';
      if (key === 'public.overview.timeline_desc') enStr = 'From registration to grand final';
      if (key === 'public.schedule.match_start') enStr = 'Match Starts';
      if (key === 'public.schedule.next_phase') enStr = 'Next Phase';
      if (key === 'public.schedule.no_upcoming') enStr = 'No Upcoming Phase';
      if (key === 'public.schedule.not_released') enStr = 'Schedule for this competition has not been released yet.';
      if (key === 'public.schedule.desc') enStr = 'Latest match schedules and tournament status.';
      if (key === 'public.schedule.empty') enStr = 'No schedule available yet.';
      if (key === 'public.schedule.search') enStr = 'Search participant or school...';
      if (key === 'public.participants.desc') enStr = 'Participants registered in this competition.';
      if (key === 'public.participants.search') enStr = 'Search participants...';
      if (key === 'public.participants.name') enStr = 'Participant Name';
      if (key === 'public.participants.school') enStr = 'School Origin';
      if (key === 'public.ranking.desc') enStr = 'Current ranking based on points earned.';
      if (key === 'public.ranking.search') enStr = 'Search ranking...';
      if (key === 'public.ranking.empty') enStr = 'Ranking data is not available yet.';
      if (key === 'public.ranking.not_ready') enStr = 'Rankings will appear after the match is completed.';
      if (key === 'public.bracket.desc') enStr = 'Tournament visualization.';
      if (key === 'public.bracket.empty') enStr = 'Bracket is not available yet.';
      if (key === 'public.dashboard.empty_desc') enStr = 'Look forward to upcoming competitions.';
      if (key === 'status.coming_soon') enStr = 'Coming Soon';
      if (key === 'footer.rights') enStr = '© 2026 GameForSmart. All rights reserved.';
      if (key === 'public.participants.empty') enStr = 'no participants found.';
      if (key === 'display.loading_scoreboard') enStr = 'Loading Scoreboard...';
      if (key === 'display.match_roster') enStr = 'Match Participant Roster';
      if (key === 'display.match_timer') enStr = 'Match Timer';
      if (key === 'admin.competitions.all_status') enStr = 'All Statuses';
      if (key === 'admin.competitions.empty') enStr = 'No competitions found.';
      if (key === 'admin.competitions.empty_desc') enStr = 'Try changing search keywords or filters.';
      if (key === 'admin.competitions.public_page') enStr = 'Public Page';
      if (key === 'admin.competitions.delete_confirm') enStr = 'Are you sure you want to delete this competition? This action cannot be undone.';
      if (key === 'admin.competitions.delete_success') enStr = 'Successfully deleted.';
      if (key === 'admin.competitions.delete_error') enStr = 'Failed to delete: ';
      if (key === 'admin.competitions.total_prize') enStr = 'Total Prize';
      if (key === 'admin.competitions.prize_allocation') enStr = 'Prize Allocation';
      if (key === 'admin.competitions.detail') enStr = 'Competition Detail';
      if (key === 'admin.actions.move_to_finalist') enStr = 'Move to Finalists';
      if (key === 'admin.standings.insert_to_bracket') enStr = 'Insert to Bracket';
      if (key === 'admin.standings.insert_random') enStr = 'Insert Randomly';
      if (key === 'admin.standings.insert_selected') enStr = 'Insert Selected';
      if (key === 'admin.standings.select_all') enStr = 'Select All';
      if (key === 'admin.standings.eligible_finalists') enStr = 'Eligible Finalists';
      if (key === 'admin.standings.bracket_info') enStr = 'Bracket Info';
      if (key === 'admin.standings.modal_title') enStr = 'Add to Bracket';
      if (key === 'admin.users.desc') enStr = 'Manage all registered teams, individuals, and their seedings.';
      if (key === 'admin.users.registered') enStr = 'Registered Participants';
      if (key === 'admin.users.overview') enStr = 'Overview of all entries across your competitions.';
      if (key === 'admin.users.table.team_info') enStr = 'Team Info';
      if (key === 'admin.users.table.participant_info') enStr = 'Participant Info';
      if (key === 'admin.match.finalize_confirm') enStr = 'Are you sure you want to finalize this match? Rankings will be locked.';
      if (key === 'admin.match.remove_confirm') enStr = 'Are you sure you want to remove this participant from the match?';
      if (key === 'admin.match.not_found') enStr = 'Match Not Found';
      if (key === 'admin.match.back') enStr = 'Back to Competition';
      if (key === 'admin.match.edit_score') enStr = 'Edit';
      if (key === 'admin.match.add_participant') enStr = 'Add';
      if (key === 'admin.match.select_desc') enStr = 'Select a participant to add to this match.';
      if (key === 'admin.match.select_placeholder') enStr = '-- Select Participant --';
      if (key === 'admin.match.add_btn') enStr = 'Add';
      if (key === 'admin.match.edit_points') enStr = 'Edit';
      if (key === 'admin.match.update_score_for') enStr = 'Update';
      if (key === 'admin.common.search_matches') enStr = 'Search matches...';
      if (key === 'admin.common.search_finalist') enStr = 'Search finalists...';
      if (key === 'admin.common.email_placeholder') enStr = 'contact@example.com';
      if (key === 'admin.common.phone_placeholder') enStr = '+62xxx';
      if (key === 'admin.common.school_placeholder') enStr = 'School / Institution Name';
      if (key === 'admin.common.city_placeholder') enStr = 'E.g. Surabaya';
      if (key === 'admin.common.select_category') enStr = 'Select Category';
      if (key === 'admin.common.select_subject') enStr = 'Select Subject';
      if (key === 'admin.common.select_phase') enStr = 'Select Phase';
      if (key === 'admin.common.all_categories') enStr = 'All Categories';
      if (key === 'admin.common.all_phases') enStr = 'All Phases';
      if (key === 'admin.common.select_bracket_type') enStr = 'Select Bracket Type';
      if (key === 'admin.common.title_placeholder') enStr = 'E.g. Online Quiz';
      if (key === 'admin.common.desc_placeholder') enStr = 'Write competition details, prizes...';
      if (key === 'admin.common.fee_placeholder') enStr = 'Rp 0 (Free)';
      if (key === 'admin.common.total_prize_placeholder') enStr = 'Total Overall';
      if (key === 'admin.common.reward_placeholder') enStr = 'Rp / Prize';
      if (key === 'admin.common.registration_link') enStr = 'Registration Link';
      if (key === 'admin.common.registration_fee') enStr = 'Registration Fee';
      if (key === 'admin.common.separate_subject') enStr = 'Separate by Subject';
      if (key === 'admin.common.bracket_config') enStr = 'Bracket Configuration';
      if (key === 'admin.common.limit_participants') enStr = 'Set Participant Limit';
      if (key === 'admin.common.progression') enStr = 'Progression Details';
      if (key === 'admin.common.match_time') enStr = 'Match Time';
      if (key === 'admin.common.specific_subject') enStr = 'Specific Subject';
      if (key === 'admin.common.participant_type') enStr = 'Participant Type';
      if (key === 'admin.common.registration_full') enStr = 'Registration full';
      if (key === 'admin.common.add_new_participant') enStr = 'Add';
      if (key === 'admin.common.saving') enStr = 'Saving...';
      if (key === 'admin.common.generate_matches_first') enStr = 'Generate matches first to view bracket.';
      if (key === 'admin.common.avg_score') enStr = 'Average Score';
      
      // Replace options to look nicer
      if (key === 'options.category.pra_sekolah') enStr = 'Kindergarten';
      if (key === 'options.category.sd') enStr = 'Elementary';
      if (key === 'options.category.smp') enStr = 'Middle School';
      if (key === 'options.category.sma') enStr = 'High School';
      if (key === 'options.category.mahasiswa') enStr = 'University';
      if (key === 'options.category.umum') enStr = 'General';
      if (key === 'options.category.profesional') enStr = 'Professional';
      
      if (key === 'options.subject.bahasa_inggris') enStr = 'English';
      if (key === 'options.subject.bahasa_indonesia') enStr = 'Indonesian';
      if (key === 'options.subject.pendidikan_jasmani') enStr = 'Physical Education';
      if (key === 'options.subject.agama') enStr = 'Religion';
      if (key === 'options.subject.seni_rupa') enStr = 'Fine Arts';
      if (key === 'options.doc_type.kartu_pelajar') enStr = 'Student Card';
      if (key === 'options.doc_type.lainnya') enStr = 'Other';
    }
  }

  if (enStr && enStr !== idStr) {
    exactWordMap[idStr] = enStr;
  }
}

// Add remaining custom
Object.assign(exactWordMap, customTranslations);
// Explicit overwrites to make sure
exactWordMap["Masuk"] = "Login";
exactWordMap["Keluar"] = "Logout";
exactWordMap["Dasbor"] = "Dashboard";
exactWordMap["Jadwal"] = "Schedule";
exactWordMap["Pengaturan"] = "Settings";
exactWordMap["Ringkasan"] = "Overview";
exactWordMap["Braket"] = "Bracket";
exactWordMap["Peserta"] = "Participants";
exactWordMap["Peringkat"] = "Ranking";
exactWordMap["Simpan"] = "Save";
exactWordMap["Batal"] = "Cancel";
exactWordMap["Hapus"] = "Delete";
exactWordMap["Tambah"] = "Add";
exactWordMap["Cari..."] = "Search...";
exactWordMap["Saring"] = "Filter";
exactWordMap["Draf"] = "Draft";
exactWordMap["Dipublikasikan"] = "Published";
exactWordMap["Pendaftaran"] = "Registration";
exactWordMap["Berlangsung"] = "Ongoing";
exactWordMap["Selesai"] = "Completed";
exactWordMap["Dijadwalkan"] = "Scheduled";
exactWordMap["Disetujui"] = "Approved";
exactWordMap["Menunggu"] = "Pending";
exactWordMap["Lunas"] = "Paid";
exactWordMap["Belum Bayar"] = "Unpaid";
exactWordMap["Aturan"] = "Rules";
exactWordMap["Semua Kategori"] = "All Categories";
exactWordMap["Semua Mata Pelajaran"] = "All Subjects";
exactWordMap["Total Hadiah"] = "Total Prize";
exactWordMap["Jadwal Pelaksanaan"] = "Timeline";
exactWordMap["Babak Kualifikasi"] = "Qualification Round";
exactWordMap["Babak Grand Final"] = "Grand Final Round";
exactWordMap["Grup"] = "Group";
exactWordMap["Penobatan Juara"] = "Champion Crowning";
exactWordMap["Juara 1"] = "1st Place";
exactWordMap["Juara 2"] = "2nd Place";
exactWordMap["Juara 3"] = "3rd Place";
exactWordMap["Hari"] = "Days";
exactWordMap["Jam"] = "Hours";
exactWordMap["Menit"] = "Mins";
exactWordMap["Detik"] = "Secs";
exactWordMap["Mata Pelajaran"] = "Subject";
exactWordMap["Independen"] = "Independent";
exactWordMap["Umum"] = "General";
exactWordMap["Tampilkan"] = "Show";
exactWordMap["data"] = "entries";
exactWordMap["Halaman"] = "Page";
exactWordMap["dari"] = "of";
exactWordMap["Sesuaikan ke layar"] = "Fit to Screen";
exactWordMap["Layar Penuh"] = "Fullscreen";
exactWordMap["Keluar Layar Penuh"] = "Exit Fullscreen";
exactWordMap["Ronde"] = "Round";
exactWordMap["Kategori"] = "Category";
exactWordMap["Final"] = "Final";
exactWordMap["Data Kompetisi"] = "Competition Data";
exactWordMap["Semua Status"] = "All Statuses";
exactWordMap["Poster"] = "Poster";
exactWordMap["Nama"] = "Name";
exactWordMap["Status"] = "Status";
exactWordMap["Aksi"] = "Action";
exactWordMap["Kualifikasi"] = "Qualification";
exactWordMap["Fase Grup"] = "Group Stage";
exactWordMap["Juara"] = "Champion";
exactWordMap["Klasemen"] = "Standings";
exactWordMap["Tim"] = "Teams";
exactWordMap["Individu"] = "Individuals";
exactWordMap["Kontak"] = "Contact";
exactWordMap["Panel Kontrol Pertandingan"] = "Match Control Panel";
exactWordMap["Akun"] = "Account";
exactWordMap["Asal"] = "Origin";
exactWordMap["Lokasi"] = "Location";
exactWordMap["Poin"] = "Points";
exactWordMap["Terkunci"] = "Locked";
exactWordMap["Fase"] = "Phase";
exactWordMap["Tipe"] = "Type";
exactWordMap["Rp 0 (Gratis)"] = "Rp 0 (Free)";
exactWordMap["Rp / Hadiah"] = "Rp / Prize";
exactWordMap["Judul"] = "Title";
exactWordMap["Deskripsi"] = "Description";
exactWordMap["Tautan Pendaftaran"] = "Registration Link";
exactWordMap["Biaya Pendaftaran"] = "Registration Fee";
exactWordMap["Pisahkan berdasarkan Bidang"] = "Separate by Subject";
exactWordMap["Konfigurasi Braket"] = "Bracket Configuration";
exactWordMap["Tetapkan Batas Peserta"] = "Set Participant Limit";
exactWordMap["Detail Progresi"] = "Progression Details";
exactWordMap["Waktu Pertandingan"] = "Match Time";
exactWordMap["Bidang Tertentu"] = "Specific Subject";
exactWordMap["Tipe Peserta"] = "Participant Type";
exactWordMap["Email"] = "Email";
exactWordMap["Telepon"] = "Phone";
exactWordMap["Sekolah"] = "School";
exactWordMap["Kota"] = "City";
exactWordMap["Pembayaran"] = "Payment";
exactWordMap["(opsional)"] = "(optional)";
exactWordMap["Terdaftar"] = "Registered";
exactWordMap["Menyimpan..."] = "Saving...";
exactWordMap["Rata-rata Skor"] = "Average Score";
exactWordMap["Audit Jejak Kehadiran"] = "Attendance Audit Trail";
exactWordMap["Log Cek-in"] = "Check-in Logs";
exactWordMap["Jejak audit keamanan dari semua verifikasi resepsionis."] = "Security audit trail from all receptionist verifications.";
exactWordMap["Waktu"] = "Time";
exactWordMap["Diverifikasis"] = "Verified by";
exactWordMap["Catatan"] = "Notes";
exactWordMap["Keamanan"] = "Security";
exactWordMap["Memuat jejak audit..."] = "Loading audit trail...";
exactWordMap["Tidak ada catatan verifikasi ditemukan."] = "No verification records found.";
exactWordMap["Cuplikan"] = "Snapshot";
exactWordMap["Tidak Ada Cuplikan"] = "No Snapshot";
exactWordMap["Tidak Diketahui"] = "Unknown";
exactWordMap["Manajemen Resepsionis"] = "Receptionist Management";
exactWordMap["Kembali ke Kompetisi"] = "Back to Competition";
exactWordMap["Memuat data resepsionis..."] = "Loading receptionist data...";
exactWordMap["Undang"] = "Invite";
exactWordMap["Kode Undangan"] = "Invite Code";
exactWordMap["Permintaan"] = "Requests";
exactWordMap["Total"] = "Total";
exactWordMap["Profil"] = "Profile";
exactWordMap["Informasi Dasar"] = "Basic Information";
exactWordMap["Nomor Telepon"] = "Phone Number";
exactWordMap["Identitas & Institusi"] = "Identity & Institution";
exactWordMap["Tipe Dokumen"] = "Document Type";
exactWordMap["KTP"] = "ID Card";
exactWordMap["Kartu Pelajar"] = "Student Card";
exactWordMap["Lainnya"] = "Other";
exactWordMap["Nomor Dokumen"] = "Document Number";
exactWordMap["Nama Institusi / Sekolah"] = "Institution / School Name";
exactWordMap["Informasi Tambahan"] = "Additional Information";
exactWordMap["Tanggal Lahir"] = "Date of Birth";
exactWordMap["Alamat Lengkap"] = "Full Address";
exactWordMap["Unggah Kartu Identitas"] = "Upload ID Card";
exactWordMap["Deteksi Wajah"] = "Face Detection";
exactWordMap["Konfirmasi Data"] = "Confirm Data";
exactWordMap["Kartu Identitas"] = "ID Card";
exactWordMap["Diunggah"] = "Uploaded";
exactWordMap["Pilih Gambar"] = "Select Image";
exactWordMap["Selanjutnya"] = "Next";
exactWordMap["Terverifikasi"] = "Verified";
exactWordMap["Buka Kamera"] = "Open Camera";
exactWordMap["Mulai"] = "Start";
exactWordMap["Identitas Cocok"] = "Identity Matched";
exactWordMap["Kembali"] = "Back";
exactWordMap["Proses"] = "Process";
exactWordMap["Nomor Identitas"] = "ID Number";
exactWordMap["Provinsi"] = "Province";
exactWordMap["Kabupaten / Kota"] = "Regency / City";
exactWordMap["Kecamatan"] = "District";
exactWordMap["Desa / Kelurahan"] = "Village / Sub-district";
exactWordMap["Detail Jalan"] = "Street Details";
exactWordMap["Dokumen"] = "Document";
exactWordMap["Institusi"] = "Institution";
exactWordMap["Konfirmasi"] = "Confirm";
exactWordMap["Detail Pendaftaran"] = "Registration Details";
exactWordMap["Penuh"] = "Full";
exactWordMap["Daftar"] = "Register";
exactWordMap["Pemindai"] = "Scanner";
exactWordMap["Buka Pemindai"] = "Open Scanner";
exactWordMap["Ganti Kamera"] = "Switch Camera";
exactWordMap["Tutup Pemindai"] = "Close Scanner";
exactWordMap["Verifikasi Tiket"] = "Ticket Verification";
exactWordMap["Informasi Peserta"] = "Participant Information";
exactWordMap["Pemeriksaan Keamanan"] = "Security Check";
exactWordMap["Foto Langsung"] = "Live Photo";
exactWordMap["Tolak"] = "Reject";
exactWordMap["Detail Kompetisi"] = "Competition Details";
exactWordMap["Dari"] = "From";
exactWordMap["Mendaftar Pada"] = "Registered At";
exactWordMap["Tandai"] = "Flag";
exactWordMap["Alasan"] = "Reason";
exactWordMap["Kirim"] = "Submit";
exactWordMap["Matematika"] = "Mathematics";
exactWordMap["Sains"] = "Science";
exactWordMap["Bahasa Inggris"] = "English";
exactWordMap["Fisika"] = "Physics";
exactWordMap["Kimia"] = "Chemistry";
exactWordMap["Biologi"] = "Biology";
exactWordMap["IT & Pemrograman"] = "IT & Programming";
exactWordMap["Sejarah"] = "History";
exactWordMap["Geografi"] = "Geography";
exactWordMap["Ekonomi"] = "Economics";
exactWordMap["Sosiologi"] = "Sociology";
exactWordMap["Akuntansi"] = "Accounting";
exactWordMap["Seni Rupa"] = "Fine Arts";
exactWordMap["Musik"] = "Music";
exactWordMap["Sastra"] = "Literature";
exactWordMap["Bahasa Indonesia"] = "Indonesian";
exactWordMap["Bahasa Mandarin"] = "Mandarin";
exactWordMap["Bahasa Arab"] = "Arabic";
exactWordMap["Robotika"] = "Robotics";
exactWordMap["Pendidikan Jasmani"] = "Physical Education";
exactWordMap["Pendidikan Agama"] = "Religion Education";
exactWordMap["PKn"] = "Civics";
exactWordMap["Informatika"] = "Informatics";
exactWordMap["TIK"] = "ICT";
exactWordMap["Elektronika"] = "Electronics";
exactWordMap["Mesin"] = "Machinery";
exactWordMap["Kewirausahaan"] = "Entrepreneurship";
exactWordMap["Isi Otomatis"] = "Auto Fill";
exactWordMap["Link Registrasi"] = "Registration Link";
exactWordMap["Pisahkan per Bidang"] = "Separate by Subject";
exactWordMap["Gunakan Biaya Registrasi Dinamis"] = "Use Dynamic Registration Fee";
exactWordMap["Biaya Registrasi Standar"] = "Standard Registration Fee";
exactWordMap["Konfigurasi Turnamen"] = "Tournament Configuration";
exactWordMap["Sistem Gugur Tunggal"] = "Single Elimination";
exactWordMap["Sistem Gugur Ganda"] = "Double Elimination";
exactWordMap["Sistem Kompetisi Penuh"] = "Round Robin";
exactWordMap["Sistem Swiss"] = "Swiss System";
exactWordMap["Atur Batas Peserta"] = "Set Participant Limit";
exactWordMap["Peserta Tidak Terbatas"] = "Unlimited Participants";
exactWordMap["Grup Semifinal"] = "Semifinal Groups";
exactWordMap["Menuju Semifinal"] = "To Semifinal";
exactWordMap["Menuju Final"] = "To Final";
exactWordMap["Menuju Grandfinal"] = "To Grandfinal";
exactWordMap["Menuju Kualifikasi"] = "To Qualification";
exactWordMap["Menuju Upper Bracket"] = "To Upper Bracket";
exactWordMap["Menuju Lower Bracket"] = "To Lower Bracket";
exactWordMap["Menuju Fase Grup"] = "To Group Stage";
exactWordMap["Menuju Fase Knockout"] = "To Knockout Stage";
exactWordMap["Total Ronde"] = "Total Rounds";
exactWordMap["Menuju Playoff"] = "To Playoffs";
exactWordMap["Belum Dijadwalkan"] = "Unscheduled";
exactWordMap["Eliminasi"] = "Elimination";
exactWordMap["Perempat Final"] = "Quarterfinal";
exactWordMap["Semifinal"] = "Semifinal";
exactWordMap["Grandfinal"] = "Grandfinal";
exactWordMap["Upper Bracket"] = "Upper Bracket";
exactWordMap["Lower Bracket"] = "Lower Bracket";
exactWordMap["Fase Knockout"] = "Knockout Stage";
exactWordMap["Ronde 1"] = "Round 1";
exactWordMap["Ronde 2"] = "Round 2";
exactWordMap["Ronde 3"] = "Round 3";
exactWordMap["Ronde 4"] = "Round 4";
exactWordMap["Biaya Registrasi"] = "Registration Fee";
exactWordMap["Registrasi"] = "Registration";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');

// Sort the dictionary by length descending so we match longer strings first
const dictKeys = Object.keys(exactWordMap).sort((a, b) => b.length - a.length);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const idText of dictKeys) {
    const enText = exactWordMap[idText];
    if (!enText || idText === enText) continue;

    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeId = escapeRegExp(idText);
    
    // Replace "Text"
    const regexQuotesDouble = new RegExp(`("${safeId}")`, 'g');
    if (regexQuotesDouble.test(content)) {
      content = content.replace(regexQuotesDouble, `"${enText}"`);
      changed = true;
    }

    const regexQuotesSingle = new RegExp(`('${safeId}')`, 'g');
    if (regexQuotesSingle.test(content)) {
      content = content.replace(regexQuotesSingle, `'${enText}'`);
      changed = true;
    }
    
    const regexQuotesBacktick = new RegExp(`(\`${safeId}\`)`, 'g');
    if (regexQuotesBacktick.test(content)) {
      content = content.replace(regexQuotesBacktick, '`' + enText + '`');
      changed = true;
    }

    // Replace >Text<
    const regexTags = new RegExp(`(>\\s*)${safeId}(\\s*<)`, 'g');
    if (regexTags.test(content)) {
      content = content.replace(regexTags, `$1${enText}$2`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Translated in: ${file}`);
  }
});
