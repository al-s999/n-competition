const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/(dashboard)/competitions');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace {t("...") || "..."} with "..."
    content = content.replace(/\{t\(['"]([^'"]+)['"]\)\s*\|\|\s*['"]([^'"]+)['"]\}/g, '"$2"');
    
    // Replace t("...") || "..." with "..."
    content = content.replace(/t\(['"]([^'"]+)['"]\)\s*\|\|\s*(['"][^'"]+['"])/g, '$2');
    
    // For specific bare t("...") in competition-client.tsx
    const bareReplacements = {
        'common.loading': 'Loading',
        'competition.not_found': 'Competition Not Found',
        'common.back': 'Back',
        'common.edit': 'Edit',
        'competition.phase_registration': 'Registration',
        'competition.phase_payment': 'Payment',
        'competition.phase_qualification': 'Qualification',
        'competition.phase_standings': 'Standings',
        'competition.phase_group_stage': 'Group Stage',
        'competition.phase_completed': 'Completed',
        
        'competition.group_name_required': 'Group name required',
        'competition.group_created': 'Group created',
        'competition.group_deleted': 'Group deleted',
        'competition.advancing': 'advancing',
        'competition.group_name_placeholder': 'Group name',
        'competition.add_group': 'Add Group',
        'competition.no_groups': 'No groups',
        'competition.advanced': 'advanced',
        'competition.assign_participants': 'Assign participants',
        'comp_detail.table_player': 'Player',
        'comp_detail.table_avg': 'Avg',
        'competition.time': 'Time',
        'competition.advance_selected': 'Advance selected',
        'competition.no_bracket': 'No bracket',
        'competition.bracket_title': 'Bracket',
        'competition.round': 'Round',
        'competition.members': 'members',
        'competition.more': 'more',
        'comp_detail.paid': 'paid',
        'comp_detail.search_player': 'Search player',
        'competition.school': 'School',
        'comp_detail.table_play': 'Play',
        'competition.payment_status': 'Payment Status',
        'comp_detail.no_players': 'No players found',
        'nav.game_sessions': 'Game Sessions',
        'competition.paid_label': 'Paid',
        'competition.unpaid_label': 'Unpaid',
        'Showing': 'Showing',
        
        // competition-dialogs.tsx
        'manage_competitions.delete_confirm_title': 'Delete Competition',
        'manage_competitions.delete_confirm_desc': 'Are you sure you want to delete {{name}}?',
        'manage_competitions.delete_confirm_instruction': 'Type the phrase below to confirm',
        'manage_competitions.delete_phrase': 'Delete Competition',
        'action.cancel': 'Cancel',
        'action.delete': 'Delete',
        'action.deleting': 'Deleting...'
    };
    
    // Replace {t("key")} with "Value"
    for (const [key, value] of Object.entries(bareReplacements)) {
        const regex1 = new RegExp(`\\{t\\(['"]${key}['"]\\)\\}`, 'g');
        content = content.replace(regex1, `"${value}"`);
        
        const regex2 = new RegExp(`t\\(['"]${key}['"]\\)`, 'g');
        content = content.replace(regex2, `"${value}"`);
    }

    // Replace any remaining {t("...")} with its key (to avoid crashes)
    content = content.replace(/\{t\(['"]([^'"]+)['"]\)\}/g, '"$1"');
    content = content.replace(/t\(['"]([^'"]+)['"]\)/g, '"$1"');
    
    // Remove import { useTranslation } ...
    content = content.replace(/import\s*\{\s*useTranslation\s*\}\s*from\s*['"]@\/lib\/i18n['"];?\n?/g, '');
    
    // Remove const { t } = useTranslation();
    content = content.replace(/const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\);\n?/g, '');
    
    // competition-dialogs.tsx has `t: (key: string) => string` in props, remove it
    if (file.includes('competition-dialogs.tsx')) {
        content = content.replace(/t:\s*\([^)]+\)\s*=>\s*any,?/, '');
        content = content.replace(/t:\s*\([^)]+\)\s*=>\s*string,?/, '');
    }

    fs.writeFileSync(file, content);
});

console.log('Translations hardcoded.');
