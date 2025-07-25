// src/pages/Settings/Billing.tsx
// ------------------------------------------------------------------------------------
// Billing page (Supabase-backed credits)
// - Reads balance from profiles.credits
// - "Buy credits" stub updates credits column via Supabase
// - Ready for future Stripe integration
// ------------------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import PageShell from "../../components/PageShell";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function Billing() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch credits from Supabase profile
  const loadBalance = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
    if (error) {
      console.error("Failed to fetch credits:", error);
      return;
    }
    setBalance(data?.credits ?? 0);
  };

  useEffect(() => {
    loadBalance();
  }, [user?.id]);

  const onPurchase = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (!user?.id) {
        setMessage("You must be logged in.");
        return;
      }

      // Simulate adding credits (stub)
      const { error } = await supabase.rpc("add_credits", {
        p_user_id: user.id,
        p_amount: amount,
      });

      if (error) {
        console.error("add_credits error:", error);
        setMessage("Failed to update credits. (Stub)");
      } else {
        setMessage(`Added ${amount} credits (stub).`);
        await loadBalance();
      }
    } catch (err: any) {
      setMessage(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell faintFlag>
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-semibold mb-2">Billing & Credits</h1>
          <p className="text-sm text-gray-600">
            This is a stub integration. A real checkout (Stripe, etc.) will replace this, and credits
            will be updated via webhooks.
          </p>
        </header>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Your Balance</h2>
          <div className="text-3xl font-bold text-blue-700">{balance.toLocaleString()} credits</div>
        </section>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Buy Credits (Stub)</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              className="w-32 px-3 py-2 rounded border"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button
              onClick={onPurchase}
              disabled={loading || amount <= 0}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded disabled:opacity-50"
            >
              {loading ? "Processing..." : "Buy Credits"}
            </button>
          </div>
          {message && <div className="text-sm text-gray-700">{message}</div>}
          {/* TODO: After Stripe integration, list last N transactions/invoices here */}
        </section>
      </div>
    </PageShell>
  );
}
