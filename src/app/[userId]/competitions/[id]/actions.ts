"use server";

export async function startRoundSession(params: any): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  // Mock action for starting round session
  return { success: true, redirectUrl: `/game/${params.groupId}` };
}

export async function deleteGroupFromDatabase(groupId: string, roundId?: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function saveGroupRoundsToDatabase(competitionId: string, payload: any): Promise<{success: boolean; error?: string}> {
  return { success: true };
}
