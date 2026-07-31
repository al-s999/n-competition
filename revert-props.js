const fs = require('fs');
const path = 'src/app/(dashboard)/competitions/[id]/competition-client.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<TabsContent value="registration" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="registration" className="m-0">
  <PhaseRegistration 
    competition={detail} 
    players={players} 
    totalPlayersCount={players.length}
    refreshData={triggerRefresh}
    dbTotalRegistered={players.length}
  />
</TabsContent>`);

content = content.replace(/<TabsContent value="payment" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="payment" className="m-0">
  <PhasePayment 
    competition={detail} 
    players={players} 
    refreshData={triggerRefresh}
    dbTotalPaid={players.filter(p => p.paid).length}
  />
</TabsContent>`);

content = content.replace(/<TabsContent value="qualification" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="qualification" className="m-0">
  <PhaseQualification 
    competition={detail} 
    players={players} 
    refreshData={triggerRefresh}
    dbTotalFinalists={players.filter(p => p.isFinalist).length}
  />
</TabsContent>`);

content = content.replace(/<TabsContent value="standings" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="standings" className="m-0">
  <PhaseStandings 
    competition={detail} 
    players={players} 
    refreshData={triggerRefresh}
  />
</TabsContent>`);

content = content.replace(/<TabsContent value="group_stage" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="group_stage" className="m-0">
  <PhaseGroupStage 
    competitionId={compId}
    onGroupsChange={() => {}}
  />
</TabsContent>`);

content = content.replace(/<TabsContent value="completed" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="completed" className="m-0">
  <PhaseCompleted 
    competition={detail} 
    refreshData={triggerRefresh}
  />
</TabsContent>`);

fs.writeFileSync(path, content);
