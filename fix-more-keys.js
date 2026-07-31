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
    const oldContent = content;

    const replacements = {
        'competition.no_members': 'No members',
        'competition.moved_to_finalist': 'moved to finalist',
        'competition.finalist': 'Finalist',
        'competition.selected': 'selected',
        'competition.move_to_finalist': 'Move to Finalist',
        'competition.status_col': 'Status',
        'action.action': 'Action',
        'competition.remove_from_finalist': 'Remove from Finalist',
        'competition.round_name_required': 'Round name required',
        'competition.round_created': 'Round created',
        'competition.round_deleted': 'Round deleted',
        'competition.rounds_title': 'Rounds',
        'competition.round_name_placeholder': 'Round name',
        'competition.add_round': 'Add Round',
        'competition.no_rounds': 'No rounds',
        'competition.groups': 'groups',
        'competition.star': 'Start',
        'competition.start': 'Start',
        'competition.complete': 'Complete',
        'competition.delete_round_title': 'Delete Round',
        'competition.delete_round_desc': 'Are you sure you want to delete this round?',
        'table.category': 'Category',
        'competition.players_assigned': 'players assigned',
        'competition.assigned': 'assigned',
        'competition.assign_finalist': 'Assign Finalist',
        'competition.deselect_all': 'Deselect all',
        'competition.select_all': 'Select all',
        'competition.assign_action': 'Assign Action',
        'competition.select_source': 'Select source',
        'competition.source_groups': 'Source Groups',
        'competition.no_groups_yet': 'No groups yet'
    };

    for (const [key, value] of Object.entries(replacements)) {
        // Fix inside tags: >key< or >key</Button> etc.
        const tagRegex = new RegExp(`>\\s*${key}\\s*<`, 'g');
        content = content.replace(tagRegex, `>${value}<`);

        const tagRegex2 = new RegExp(`>\\s*${key}\\s*([a-zA-Z0-9_</])`, 'g');
        content = content.replace(tagRegex2, `>${value}$1`);

        // Fix inside template literals: $"key"
        const tplRegex = new RegExp(`\\$"${key}"`, 'g');
        content = content.replace(tplRegex, value);

        // Fix quotes: "key"
        const qtRegex = new RegExp(`"${key}"`, 'g');
        content = content.replace(qtRegex, `"${value}"`);

        // Fix raw key
        const rawRegex = new RegExp(`\\b${key}\\b`, 'g');
        content = content.replace(rawRegex, value);
    }
    
    // Some specific ones
    content = content.replace(/"members"/g, '"members"'); // noop
    content = content.replace(/>StartStart</g, '>Start<'); // fixing accidental double replace
    content = content.replace(/>StartStart<\/Button>/g, '>Start</Button>');

    if (content !== oldContent) {
        fs.writeFileSync(file, content);
    }
});

console.log('Fixed more keys');
