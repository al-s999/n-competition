const fs = require('fs');
const path = 'src/app/(dashboard)/competitions/[id]/competition-client.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<TabsContent value="standings" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="standings" className="m-0">
  <PhaseStandings 
    groups={[]}
    finalists={players.filter(p => p.isFinalist)}
  />
</TabsContent>`);

content = content.replace(/<TabsContent value="group_stage" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="group_stage" className="m-0">
  <PhaseGroupStage 
    competitionId={compId}
    finalists={players.filter(p => p.isFinalist)}
    groups={[]}
    quizzes={[]}
    games={[]}
    onGroupsChange={() => {}}
  />
</TabsContent>`);

content = content.replace(/<TabsContent value="completed" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="completed" className="m-0">
  <PhaseCompleted 
    groups={[]}
    finalists={players.filter(p => p.isFinalist)}
  />
</TabsContent>`);

fs.writeFileSync(path, content);
