const fs = require('fs');
const path = 'src/app/(dashboard)/competitions/[id]/competition-client.tsx';
let content = fs.readFileSync(path, 'utf8');

// The admin code has:
//   useEffect(() => {
//     async function fetchStats() { ... }
//   ...
//   }, [compId, refreshKey]);

content = content.replace(
  /useEffect\(\(\) => \{\s*let mounted = true;\s*async function fetchStats\(\) \{[\s\S]*?fetchStats\(\);\s*return \(\) => \{\s*mounted = false;\s*\};\s*\}, \[compId, refreshKey\]\);/g,
  `useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      if (mounted) {
        setTotalPlayersCount(players?.length || 0);
        setDbTotalRegistered(players?.length || 0);
        setDbTotalPaid(players?.filter(p => p.paid).length || 0);
        setDbTotalFinalists(players?.filter(p => p.isFinalist).length || 0);
        setCurrentUserId("mock-user-id");
      }
    }
    fetchStats();
    return () => { mounted = false; };
  }, [compId, refreshKey, players]);`
);

fs.writeFileSync(path, content);
