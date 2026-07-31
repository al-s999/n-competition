const fs = require('fs');
const file = 'src/app/(dashboard)/competitions/[id]/competition-client.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
content = content.replace(
    /import { ArrowLeft, Edit, AlertCircle, ChevronLeft } from "lucide-react";/,
    'import { ArrowLeft, Edit, AlertCircle, ChevronLeft, ChevronRight, Users, CreditCard, CalendarDays, Banknote, Gift, Search, Image as ImageIcon } from "lucide-react";\nimport { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";'
);

// Add states
const statesBlock = `  const [activePhase, setActivePhase] = useState<CompetitionPhase>("registration");
  const [refreshKey, setRefreshKey] = useState(0);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const formatCurrency = (val) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
`;
content = content.replace(
    /  const \[activePhase, setActivePhase\] = useState<CompetitionPhase>\("registration"\);\n  const \[refreshKey, setRefreshKey\] = useState\(0\);/,
    statesBlock
);

// Define statusConfig inside the component or outside
const statusConfigCode = `
const statusConfig: Record<string, any> = {
  published: {
    label: "Published",
    fallback: "Published",
    className: "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
  },
  draft: {
    label: "Draft",
    fallback: "Draft",
    className: "bg-gray-500/15 text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700",
  },
  completed: {
    label: "Completed",
    fallback: "Completed",
    className: "bg-blue-500/15 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  },
  coming_soon: {
    label: "Coming Soon",
    fallback: "Coming Soon",
    className: "bg-orange-500/15 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  },
  finished: {
    label: "Finished",
    fallback: "Finished",
    className: "bg-purple-500/15 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800",
  },
};
`;

if (!content.includes('statusConfig')) {
    content = content.replace('export default function CompetitionClient() {', statusConfigCode + '\nexport default function CompetitionClient() {');
}

// Extract variables before return
const variablesBlock = `
  const startDate = detail.start_date ? new Date(detail.start_date) : null;
  const endDate = detail.end_date ? new Date(detail.end_date) : null;

  const cfg = statusConfig[detail.status] || statusConfig.draft;
  const totalRegistered = players.length;
  const totalPaid = players.filter(p => p.paid).length;
  const paidPercentage = totalRegistered > 0 ? Math.round((totalPaid / totalRegistered) * 100) : 0;
`;
content = content.replace(
    /  const startDate = detail\.start_date \? new Date\(detail\.start_date\) : null;\n  const endDate = detail\.end_date \? new Date\(detail\.end_date\) : null;/,
    variablesBlock
);

// Replace the return block entirely
const oldReturnStart = '  return (\n    <div className="p-6 max-w-7xl mx-auto space-y-6">';
const oldReturnEnd = '      </Tabs>\n    </div>\n  );\n}';

const returnRegex = /return \(\s*<div className="p-6 max-w-7xl mx-auto space-y-6">([\s\S]*?)<\/Tabs>\s*<\/div>\s*\);\s*\}/;

const newReturnJSX = `return (
    <div className="w-full p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/competitions" className="hover:text-foreground transition-colors cursor-pointer">
          Competitions
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Competition Detail</span>
      </nav>

      {/* Title + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-4 min-w-0 flex-1">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground line-clamp-2" title={detail.name || detail.title}>{detail.name || detail.title}</h1>
          </div>

          {/* Inline Stats */}
          <div className="flex items-center gap-x-3 gap-y-2 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline" className={\`capitalize border shrink-0 \${cfg.className}\`}>
              {cfg.label}
            </Badge>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span><strong className="text-foreground">{totalRegistered.toLocaleString("id-ID")}</strong> Registered</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span><strong className="text-foreground">{totalPaid.toLocaleString("id-ID")}</strong> Paid</span>
              <div className="flex items-center gap-1.5 ml-1">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: \`\${paidPercentage}%\` }}
                  />
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{paidPercentage}%</span>
              </div>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span className="text-xs sm:text-sm">
                {detail.registration_start_date
                  ? <TimezoneDisplay date={detail.registration_start_date} compact={false} showBadge={false} />
                  : "—"}
                {" — "}
                {(detail.final_end_date || detail.registration_end_date)
                  ? <TimezoneDisplay date={detail.final_end_date || detail.registration_end_date} compact={false} showBadge={false} />
                  : "—"}
              </span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div
              className="flex items-center gap-1.5 cursor-help"
              title={\`Registration Fee: \${formatCurrency(detail.registration_fee || 0)}\`}
            >
              <Banknote className="h-4 w-4 text-yellow-500" />
              <span>{formatCurrency(detail.registration_fee || 0)}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div
              className="flex items-center gap-1.5 cursor-help"
              title={\`Prize Pool: \${formatCurrency(detail.prize_pool || 0)}\`}
            >
              <Gift className="h-4 w-4 text-rose-500" />
              <strong className="text-foreground">{formatCurrency(detail.prize_pool || 0)}</strong>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => router.push(\`/competitions/\${compId}/edit\`)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Poster + Description + Rules */}
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Poster */}
        <div className="shrink-0">
          <div
            className={\`rounded-lg overflow-hidden border bg-muted/30 relative group transition-all duration-200 shadow-sm hover:shadow-md \${detail.poster_url ? "cursor-zoom-in" : ""}\`}
            style={{ width: "160px", height: "120px" }}
            onClick={() => detail.poster_url && setIsImageModalOpen(true)}
          >
            {detail.poster_url ? (
              <>
                <img
                  src={detail.poster_url}
                  alt={detail.name || detail.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Search className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted border">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-5 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold mb-1.5">Description</h3>
            <p className={\`text-sm text-muted-foreground leading-relaxed wrap-break-word \${!descExpanded ? "line-clamp-2" : ""}\`}>
              {detail.description}
            </p>
            {detail.description && detail.description.length > 100 && (
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="text-xs text-primary hover:underline cursor-pointer whitespace-nowrap mt-1"
              >
                {descExpanded ? "Show less" : "Show All"}
              </button>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold mb-1.5">Rules</h3>
            <div className="text-sm text-muted-foreground wrap-break-word space-y-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1 [&_li_p]:inline">
              {rulesExpanded ? (
                <div>
                  {(detail.rules || []).map((rule: string, i: number) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: rule }} className="mb-2" />
                  ))}
                </div>
              ) : (
                <div
                  className="line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: detail.rules?.[0] || "—" }}
                />
              )}
            </div>
            {detail.rules && detail.rules.length > 1 && (
              <button
                type="button"
                onClick={() => setRulesExpanded(!rulesExpanded)}
                className="text-xs text-primary hover:underline cursor-pointer whitespace-nowrap mt-1"
              >
                {rulesExpanded ? "Show less" : "Show All"}
              </button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as CompetitionPhase)}>
        $1
      </Tabs>

      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-lg p-2">
          <DialogTitle className="sr-only">Poster Preview</DialogTitle>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium px-2 pt-2">{detail.name || detail.title}</p>
            <img
              src={detail.poster_url}
              alt={detail.name || detail.title}
              className="w-full rounded-md object-contain max-h-[70vh]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

content = content.replace(returnRegex, newReturnJSX);
fs.writeFileSync(file, content);
console.log('Component updated successfully.');
