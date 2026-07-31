const fs = require('fs');
const path = 'src/app/(dashboard)/competitions/[id]/competition-client.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the <TabsContent> blocks with correct props.
content = content.replace(/<TabsContent value="registration" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="registration" className="m-0">
  <PhaseRegistration
    players={players}
    totalCount={players.length}
    currentPage={1}
    pageSize={10}
    onPageChange={() => {}}
    searchQuery=""
    onSearch={() => {}}
    categoryFilter="all"
    onCategoryFilterChange={() => {}}
    isLoading={isLoading}
    onRefresh={triggerRefresh}
    competitionId={compId}
  />
</TabsContent>`);

content = content.replace(/<TabsContent value="payment" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="payment" className="m-0">
  <PhasePayment
    players={players}
    totalCount={players.length}
    totalRegistered={players.length}
    totalPaid={players.filter(p => p.paid).length}
    currentPage={1}
    pageSize={10}
    onPageChange={() => {}}
    searchQuery=""
    onSearch={() => {}}
    paymentFilter="all"
    onPaymentFilterChange={() => {}}
    isLoading={isLoading}
    onRefresh={triggerRefresh}
    competitionId={compId}
  />
</TabsContent>`);

content = content.replace(/<TabsContent value="qualification" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="qualification" className="m-0">
  <PhaseQualification
    players={players}
    totalCount={players.length}
    totalPaid={players.filter(p => p.paid).length}
    totalFinalists={players.filter(p => p.isFinalist).length}
    currentPage={1}
    pageSize={10}
    onPageChange={() => {}}
    searchQuery=""
    onSearch={() => {}}
    categoryFilter="all"
    onCategoryFilterChange={() => {}}
    isLoading={isLoading}
    onRefresh={triggerRefresh}
    competitionId={compId}
  />
</TabsContent>`);

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
