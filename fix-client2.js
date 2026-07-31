const fs = require('fs');
const path = 'src/app/(dashboard)/competitions/[id]/competition-client.tsx';
let content = fs.readFileSync(path, 'utf8');

// The admin code has:
//   useEffect(() => {
//     let mounted = true;
//     async function loadStaticData() { ... }

content = content.replace(
  /useEffect\(\(\) => \{\s*let mounted = true;\s*async function loadStaticData\(\) \{[\s\S]*?loadStaticData\(\);\s*return \(\) => \{\s*mounted = false;\s*\};\s*\}, \[compId, refreshKey\]\);/,
  `useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const comp = await CompetitionService.getCompetitionById(compId);
        if (mounted && comp) setCompetition(comp as any);

        const parts = await ParticipantService.getParticipantsByCompetition(compId);
        if (mounted) {
          const mapped = parts.map(p => ({
            id: p.id,
            userId: p.user_id,
            name: p.name,
            username: p.username,
            avatar: p.avatar,
            gamesPlayed: p.games_played || 0,
            avgScore: p.avg_score || 0,
            paid: p.is_paid || false,
            registeredAt: p.registered_at || p.created_at,
            isFinalist: p.is_finalist,
            isPresent: p.is_present,
            category: p.category,
            schoolName: p.school_name,
            sessions: []
          }));
          setParticipants(mapped);
          
          setGames([]);
          setQuizzes([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [compId, refreshKey]);`
);

// also remove setupRealtime hook
content = content.replace(
  /useEffect\(\(\) => \{[\s\S]*?const channel = supabase[\s\S]*?return \(\) => \{[\s\S]*?supabase\.removeChannel[\s\S]*?\}\s*\}, \[compId\]\);/g,
  `useEffect(() => { return () => {}; }, [compId]);`
);

// and fetchParticipants hook
content = content.replace(
  /useEffect\(\(\) => \{\s*let mounted = true;\s*async function fetchParticipants\(\) \{[\s\S]*?fetchParticipants\(\);\s*return \(\) => \{\s*mounted = false;\s*\};\s*\}, \[compId, refreshKey\]\);/g,
  ``
);

fs.writeFileSync(path, content);
