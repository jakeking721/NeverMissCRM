// src/pages/AdminDashboard.tsx
// ------------------------------------------------------------------------------------
// Admin-only panel (Supabase)
// - Fetch all users from profiles
// - Adjust credits via creditsService (Supabase-backed)
// - Quick stats
// ------------------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/utils/roles";
import { getAllUsers, User } from "@/utils/auth";
import { creditsService } from "@/services/creditsService";

export default function AdminDashboard() {
  const { user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Record<string, number>>({});

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin(user)) {
      window.location.href = "/dashboard";
    }
  }, [user]);

  // Fetch all users
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const u = await getAllUsers();
        setUsers(u);

        // Fetch credits for all users (parallel)
        const credits = await Promise.all(
          u.map(async (usr) => ({
            id: usr.id,
            credits: await creditsService.getUserBalance(usr.id),
          }))
        );

        const map: Record<string, number> = {};
        credits.forEach((c) => (map[c.id] = c.credits));
        setBalances(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      (u.username ?? u.email ?? "").toLowerCase().includes(s)
    );
  }, [users, search]);

  const onAddCredits = async (id: string) => {
    const amtStr = prompt("Credits to add:");
    if (!amtStr) return;
    const amt = Number(amtStr);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Invalid amount.");
      return;
    }
    try {
      const res = await creditsService.adminAddToUser(id, amt);
      if (!res.ok) {
        alert(res.message ?? "Failed.");
        return;
      }

      // Reload balances
      const newBal = await creditsService.getUserBalance(id);
      setBalances((prev) => ({ ...prev, [id]: newBal }));
      alert(`Added ${amt} credits.`);
    } catch (e: any) {
      alert(e?.message ?? "Failed.");
    }
  };

  const totalCredits = useMemo(() => {
    return Object.values(balances).reduce((sum, c) => sum + c, 0);
  }, [balances]);

  return (
    <PageShell faintFlag>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Manage users, credits, and global settings.</p>
          </div>
        </header>

        {/* Quick stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat title="Total Users" value={loading ? "…" : users.length} />
          <Stat title="Total Credits" value={loading ? "…" : totalCredits} />
          <Stat title="Logged In As" value={user?.username ?? user?.email ?? "—"} />
        </section>

        {/* Users */}
        <section className="p-4 bg-white rounded-md shadow border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Users</h2>
            <input
              type="text"
              placeholder="Search by email / username…"
              className="border rounded px-2 py-1 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading users…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Email / Username</th>
                    <th className="py-2">Credits</th>
                    <th className="py-2">Role</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => {
                      const credits = balances[u.id] ?? 0;
                      return (
                        <tr key={u.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{u.email ?? u.username ?? u.id}</td>
                          <td className="py-2">{credits}</td>
                          <td className="py-2 capitalize">{u.role ?? "user"}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => onAddCredits(u.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Add Credits
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function Stat({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="p-4 bg-white rounded-md shadow border text-center">
      <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
