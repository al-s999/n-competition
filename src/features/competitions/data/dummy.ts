import { Competition } from './types';

export const DUMMY_COMPETITIONS: Competition[] = [
  {
    id: 'c1',
    name: 'KING EXPERT SCIENCE COMPETITION 2026',
    title: 'KING EXPERT SCIENCE COMPETITION 2026',
    slug: 'king-expert-science-competition-2026',
    description: 'Ignite Your Scientific Spirit! Kompetisi sains bergengsi untuk SD/MI sederajat, SMP/MTs sederajat, dan SMA/SMK & MA sederajat. Memperebutkan piala bergilir dan hadiah total puluhan juta rupiah.',
    rules: [
      '<strong>Kategori Lomba:</strong>',
      '<ul><li><strong>SD, MI Sederajat:</strong> Matematika, IPA</li><li><strong>SMP, MTs Sederajat:</strong> Matematika, IPA, IPS</li><li><strong>SMA, SMK & MA Sederajat:</strong> Matematika, Fisika, Kimia, Biologi, Geografi, Ekonomi, Informatika</li></ul>',
      '<strong>Benefit Pemenang:</strong>',
      '<ul><li>Pemenang akan dibantu untuk proses kurasi prestasi di Puspresnas Kemendikdasmen</li><li>Hadiah uang tunai, medali dan sertifikat juara bagi peringkat 1, 2 & 3</li><li>Sertifikat bisa digunakan untuk PPDB dan SNBP</li></ul>',
      '<strong>Alur Pendaftaran:</strong>',
      '<ul><li>Pendaftaran: 17 November 2025 - 16 Januari 2026</li><li>Penyisihan: 17 Januari 2026</li><li>Final: 24 Januari 2026</li></ul>',
      '<strong>Sponsor:</strong> Dicoding, GoTo, Pertamina',
      '<strong>Biaya Pendaftaran:</strong> Rp 100.000,- / Peserta'
    ],
    owner_id: 'u1',
    status: 'ongoing',
    
    // Legacy dates (still used by some components)
    registration_start_date: new Date('2025-11-17T00:00:00Z').toISOString(),
    registration_end_date: new Date('2026-01-16T23:59:59Z').toISOString(),
    qualification_start_date: new Date('2026-01-17T00:00:00Z').toISOString(),
    qualification_end_date: new Date('2026-01-17T23:59:59Z').toISOString(),
    final_start_date: new Date('2026-01-24T00:00:00Z').toISOString(),
    final_end_date: new Date('2026-01-24T23:59:59Z').toISOString(),
    
    // New date fields
    registration_start: new Date('2025-11-17T00:00:00Z').toISOString(),
    registration_end: new Date('2026-01-16T23:59:59Z').toISOString(),
    qualification_start: new Date('2026-01-17T00:00:00Z').toISOString(),
    qualification_end: new Date('2026-01-17T23:59:59Z').toISOString(),
    grandfinal_start: new Date('2026-01-24T00:00:00Z').toISOString(),
    grandfinal_end: new Date('2026-01-24T23:59:59Z').toISOString(),

    // Media
    poster_url: '/images.jpeg',
    banner_url: '/images.jpeg',
    gallery: ['/images.jpeg'],

    // Detail configurations
    category: 'Science',
    location: 'Jakarta',
    registration_fee: 'Rp 100.000',
    prize_pool: '30000000',
    entry_fee: 100000,
    total_prize: 30000000,
    registration_link: 'https://www.kesc-heei.com',
    max_participants: 1000,
    
    is_limit: true,
    is_split_by_subject: true,
    
    categories: [
      { id: 'cat-1', name: 'SD/MI' },
      { id: 'cat-2', name: 'SMP/MTs' },
      { id: 'cat-3', name: 'SMA/SMK/MA' }
    ],
    subjects: [
      { id: 'sub-1', name: 'Matematika' },
      { id: 'sub-2', name: 'IPA' },
      { id: 'sub-3', name: 'Fisika' },
      { id: 'sub-4', name: 'Kimia' },
      { id: 'sub-5', name: 'Biologi' }
    ],
    
    registration_fees: [
      { id: 'fee-1', name: 'Early Bird', amount: 75000 },
      { id: 'fee-2', name: 'Regular', amount: 100000 }
    ],

    prize_allocation: {
      1: 15000000,
      2: 10000000,
      3: 5000000
    },

    progression_details: {
      toSemifinal: 50,
      toFinal: 10
    },

    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];
