const fs = require('fs');
const path = 'src/app/(dashboard)/competitions/[id]/competition-client.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<TabsContent value="registration" className="m-0">[\s\S]*?<\/TabsContent>/,
`<TabsContent value="registration" className="m-0">
  <PhaseRegistration
    players={players}
    totalCount={players.length}
    currentPage={1}
    pageSize={10}
    onPageChange={() => {}}
    onPageSizeChange={() => {}}
    search=""
    onSearch={() => {}}
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
    onPageSizeChange={() => {}}
    search=""
    onSearch={() => {}}
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
    onPageSizeChange={() => {}}
    search=""
    onSearch={() => {}}
  />
</TabsContent>`);

fs.writeFileSync(path, content);
