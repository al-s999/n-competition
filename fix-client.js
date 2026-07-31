const fs = require('fs');
const path = 'src/app/(dashboard)/competitions/[id]/competition-client.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace imports
content = content.replace(/import { getSupabaseBrowserClient } from "@\/lib\/supabase-browser";/, '');
content = content.replace(/import { CompetitionPhase/g, 'import { CompetitionService } from "@/features/competitions/data/service";\nimport { ParticipantService } from "@/features/participants/data/service";\nimport { CompetitionPhase');

// Mock fetchCompetitionDetail
content = content.replace(
  /const fetchCompetitionDetail = async \(\) => {[\s\S]*?};/g,
  `const fetchCompetitionDetail = async () => {
    try {
      const data = await CompetitionService.getCompetitionById(compId);
      if (!data) throw new Error("Not found");
      setCompetition(data as any);
      setOriginalCompetition(data as any);
    } catch (err) {
      console.error(err);
      toast.error(t("competition.error_loading"));
    } finally {
      setIsLoading(false);
    }
  };`
);

// Mock loadStaticData
content = content.replace(
  /const loadStaticData = async \(\) => {[\s\S]*?};/g,
  `const loadStaticData = async () => {
    try {
      setGames([]);
      setQuizzes([]);
      cacheService.set("admin_games", []);
      cacheService.set("admin_quizzes", []);
    } catch (err) {
      console.error("Error fetching static data:", err);
    }
  };`
);

// Mock fetchParticipants
content = content.replace(
  /const fetchParticipants = async \(\) => {[\s\S]*?};/g,
  `const fetchParticipants = async () => {
    try {
      const data = await ParticipantService.getParticipantsByCompetition(compId);
      const mapped = data.map(p => ({
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
    } catch (err) {
      console.error(err);
    }
  };`
);

// Remove setupRealtime
content = content.replace(
  /const setupRealtime = \(\) => {[\s\S]*?return \(\) => {[\s\S]*?};[\s\S]*?};/g,
  `const setupRealtime = () => { return () => {}; };`
);

// Replace /manage-competitions with /competitions
content = content.replace(/\/manage-competitions/g, '/competitions');

// Remove RealtimeIndicator (if present)
content = content.replace(/<RealtimeIndicator [^>]*\/>/g, '');

fs.writeFileSync(path, content);
