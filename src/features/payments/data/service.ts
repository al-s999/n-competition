import { Payment } from "./types";
import { createClient } from "@/utils/supabase/client";

export class PaymentService {
  static async getPaymentByParticipant(
    participantId: string
  ): Promise<Payment | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("participant_id", participantId)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      participant_id: data.participant_id,
      amount: data.amount,
      proof_url: data.proof_url || "",
      status: data.status,
      created_at: data.created_at,
    };
  }

  static async updateStatus(
    paymentId: string,
    status: Payment["status"]
  ): Promise<void> {
    const supabase = createClient();
    await supabase.from("payments").update({ status }).eq("id", paymentId);
  }

  static async createPayment(data: Omit<Payment, "id" | "created_at" | "status">): Promise<Payment> {
    const supabase = createClient();
    const { data: newPayment, error } = await supabase
      .from("payments")
      .insert({
        participant_id: data.participant_id,
        amount: data.amount,
        proof_url: data.proof_url,
        status: "pending",
      })
      .select()
      .single();

    if (error || !newPayment) throw new Error("Failed to create payment");

    return {
      id: newPayment.id,
      participant_id: newPayment.participant_id,
      amount: newPayment.amount,
      proof_url: newPayment.proof_url || "",
      status: newPayment.status,
      created_at: newPayment.created_at,
    };
  }
}
