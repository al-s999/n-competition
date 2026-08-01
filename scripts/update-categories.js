require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEST_SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function updateParticipants() {
  const { data: comp, error: compError } = await supabase
    .from('competitions')
    .select('id')
    .eq('title', 'olimpiade sains nasional 2026')
    .single();
    
  if (compError) {
    console.error("Competition not found:", compError);
    return;
  }
  
  const compId = comp.id;
  
    const { data: participants, error: pError } = await supabase
      .from('participants')
      .select('*')
      .eq('competition_id', compId);
      
    if (pError || !participants) {
      console.error("Participants not found:", pError);
      return;
    }
    
    console.log(`Found ${participants.length} participants.`);
    
    let updatedCount = 0;
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      
      const isSmp = i < participants.length / 2;
      const newCategory = isSmp ? 'smp/mts' : 'sma/smk/ma';
      
      let newSchool = p.school_name || '';
      if (isSmp) {
        newSchool = newSchool.replace(/SMA/gi, 'SMP');
      } else {
        newSchool = newSchool.replace(/SMP/gi, 'SMA');
        if (!newSchool.includes('SMA')) {
          newSchool = newSchool + " SMA";
        }
      }
      
      const { error: updateError } = await supabase
        .from('participants')
        .update({ category: newCategory, school_name: newSchool })
        .eq('id', p.id);
      
    if (updateError) {
      console.error(`Error updating participant ${p.id}:`, updateError);
    } else {
      updatedCount++;
    }
  }
  
  console.log(`Successfully updated ${updatedCount} participants.`);
}

updateParticipants().catch(console.error);
