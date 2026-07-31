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
    let changed = false;

    // We have places like >"Registration"< in JSX. Let's fix them to >Registration<
    const fixes = {
        '> "Registration" <': '>Registration<',
        '> "Payment" <': '>Payment<',
        '> "Qualification" <': '>Qualification<',
        '> "Standings" <': '>Standings<',
        '> "Group Stage" <': '>Group Stage<',
        '> "Completed" <': '>Completed<',
        '> "Edit" <': '>Edit<',
        '> "Back" <': '>Back<',
        '> "Loading" <': '>Loading<',
        '> "Competition Not Found" <': '>Competition Not Found<',
        '> "Registration"': '>Registration',
        '> "Payment"': '>Payment',
        '> "Qualification"': '>Qualification',
        '> "Standings"': '>Standings',
        '> "Group Stage"': '>Group Stage',
        '> "Completed"': '>Completed',
        '> "Edit"': '>Edit',
        '> "Back"': '>Back',
        '> "Loading"': '>Loading',
        '> "Competition Not Found"': '>Competition Not Found',
        '> "Player" <': '>Player<',
        '> "Category" <': '>Category<',
        '> "School" <': '>School<',
        '> "Play" <': '>Play<',
        '> "Avg" <': '>Avg<',
        '> "Player"': '>Player',
        '> "Category"': '>Category',
        '> "School"': '>School',
        '> "Play"': '>Play',
        '> "Avg"': '>Avg',
        '> "comp_detail.table_registered" <': '>Registered<',
        '> "comp_detail.table_registered"': '>Registered',
        '"comp_detail.table_registered"': 'Registered',
        // Also fix any leftover raw keys wrapped in quotes like "comp_detail.table_play"
        '"comp_detail.table_play"': 'Play',
        '"comp_detail.table_avg"': 'Avg',
        '"competition.group_name_required"': '"Group name required"',
        '"competition.group_created"': '"Group created"',
        '"competition.group_deleted"': '"Group deleted"',
        '> "Time" <': '>Time<',
        '> "Time"': '>Time',
        '> "Round" <': '>Round<',
        '> "Round"': '>Round'
    };

    // Because I replaced {t("...")} with "..."
    // If it was <button>"Edit"</button>, it needs to be <button>Edit</button>
    // I can just regex replace >\s*"([^"]+)"\s*< with >$1<
    
    // A better regex: find > "Text" < and make it >Text<
    const re = />\s*"([^"]+)"\s*</g;
    const oldContent = content;
    content = content.replace(re, '>$1<');

    // Also replace raw keys that might have been left over
    content = content.replace(/"comp_detail\.table_registered"/g, 'Registered');
    content = content.replace(/"comp_detail\.table_play"/g, 'Play');
    content = content.replace(/"comp_detail\.table_avg"/g, 'Avg');
    content = content.replace(/"comp_detail\.table_player"/g, 'Player');
    content = content.replace(/"comp_detail\.no_players"/g, 'No players found');

    if (content !== oldContent) {
        fs.writeFileSync(file, content);
    }
});

console.log('Fixed quotes');
