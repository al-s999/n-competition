const fs = require('fs');
const file = 'src/app/(dashboard)/competitions/[id]/competition-client.tsx';
let content = fs.readFileSync(file, 'utf8');

const tabsBlockRegex = /<Tabs value=\{activePhase\} onValueChange=\{\(v\) => setActivePhase\(v as CompetitionPhase\)\}>\s*<TabsList className="w-full flex justify-start overflow-x-auto pb-2 h-auto no-scrollbar">([\s\S]*?)<\/TabsList>/;

const newTabsBlock = `<Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as CompetitionPhase)} className="w-full relative z-0">
        <TabsList className="mb-4 w-full justify-start h-auto bg-transparent p-0 gap-0.5 sm:gap-2 overflow-x-auto rounded-none border-b no-scrollbar">
          <TabsTrigger value="registration" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
            Registration
          </TabsTrigger>
          <TabsTrigger value="payment" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
            Payment
          </TabsTrigger>
          <TabsTrigger value="qualification" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
            Qualification
          </TabsTrigger>
          <TabsTrigger value="standings" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
            Standings
          </TabsTrigger>
          <TabsTrigger value="group_stage" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
            Group Stage
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
            Completed
          </TabsTrigger>
        </TabsList>`;

content = content.replace(tabsBlockRegex, newTabsBlock);
fs.writeFileSync(file, content);
console.log("Updated Tabs style successfully.");
