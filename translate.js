const fs = require('fs');

const dict = require('./id.js');
const files = [
  'src/components/bracket/bracket-tree.tsx',
  'src/components/bracket/match-node.tsx',
  'src/components/bracket/bracket-draw-modal.tsx',
  'src/components/competition-sidebar-display.tsx'
];

files.forEach(pageFile => {
  if (!fs.existsSync(pageFile)) return;
  let content = fs.readFileSync(pageFile, 'utf8');

  // Also remove `useTranslation` import
  content = content.replace(/import\s*\{\s*useTranslation\s*\}\s*from\s*['"][^'"]+['"];?/g, '');
  content = content.replace(/const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\);?/g, '');

  // Case 1: as children: >{t("...")}< -> >Text<
  content = content.replace(/>\s*\{t\((['"])(.*?)\1\)\}\s*</g, (fullMatch, quote, key) => {
    if (dict[key]) return `>${dict[key]}<`;
    return fullMatch;
  });

  // Case 2: as prop: prop={t("...")} -> prop="Text"
  content = content.replace(/=\s*\{t\((['"])(.*?)\1\)\}/g, (fullMatch, quote, key) => {
    if (dict[key]) return `="${dict[key]}"`;
    return fullMatch;
  });

  // Case 3: anything else: t("...") -> "Text"
  content = content.replace(/t\((['"])(.*?)\1\)/g, (fullMatch, quote, key) => {
    if (dict[key]) return `"${dict[key]}"`;
    return fullMatch;
  });

  fs.writeFileSync(pageFile, content);
  console.log("Translation replaced in", pageFile);
});
