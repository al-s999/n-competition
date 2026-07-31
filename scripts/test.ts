import { AuthService } from '../src/features/auth/data/service';
import { CompetitionService } from '../src/features/competitions/data/service';
import { MemberService } from '../src/features/members/data/service';

async function test() {
  const user = await AuthService.getCurrentUser('u1');
  console.log('User:', user);

  const comps = await CompetitionService.getCompetitionsByOwner('u1');
  console.log('Competitions:', comps);

  const members = await MemberService.getMembersByCompetition('c1');
  console.log('Members:', members);
}

test();
