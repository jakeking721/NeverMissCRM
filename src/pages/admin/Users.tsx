import React, { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { supabase } from "@/utils/supabaseClient";
import { getProfilesOrderKey } from "@/utils/profiles";
import { toast } from "react-toastify";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order(getProfilesOrderKey(), { ascending: false, nullsFirst: false });
    const s = search.trim();
    if (s) {
      query = query.or(
        `email.ilike.%${s}%,username.ilike.%${s}%`
      );
    }
    if (pendingOnly) {
      query = query.eq("is_approved", false);
    }
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count, error } = await query.range(from, to);
    if (error) {
      console.error(error);
      toast.error("Failed to load users");
      setUsers([]);
      setTotal(0);
    } else {
      setUsers((data as Profile[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchUsers();
  }, [page, search, pendingOnly]);

  const approve = async (id: string) => {
    setActionId(id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: true, is_active: true, deactivated_at: null })
      .eq("id", id);
    setActionId(null);
    if (error) return toast.error("Failed to approve user");
    toast.success("User approved");
    void fetchUsers();
  };

  const prohibit = async (id: string) => {
    setActionId(id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq("id", id);
    setActionId(null);
    if (error) return toast.error("Failed to prohibit user");
    toast.success("User prohibited");
    void fetchUsers();
  };

  const toggleRole = async (id: string, role: string | null) => {
    setActionId(id);
    const next = role === "admin" ? "user" : "admin";
    const { error } = await supabase
      .from("profiles")
      .update({ role: next })
      .eq("id", id);
    setActionId(null);
    if (error) return toast.error("Failed to update role");
    toast.success("Role updated");
    void fetchUsers();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    setActionId(id);
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    setActionId(null);
    if (error) return toast.error("Failed to delete user");
    toast.success("User deleted");
    void fetchUsers();
  };

  const pageCount = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <PageShell faintFlag>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Users</h1>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search email or username..."
              className="border rounded px-2 py-1 text-sm"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={pendingOnly}
                onChange={(e) => {
                  setPage(0);
                  setPendingOnly(e.target.checked);
                }}
              />
              Pending
            </label>
          </div>
        </header>

        <div className="overflow-x-auto bg-white border rounded-md shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-2">Email</th>
                <th className="p-2">Username</th>
                <th className="p-2">Role</th>
                <th className="p-2">Approved</th>
                <th className="p-2">Active</th>
                <th className="p-2">Updated</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const busy = actionId === u.id;
                  return (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 break-all">{u.email}</td>
                      <td className="p-2">{u.username}</td>
                      <td className="p-2 capitalize">{u.role}</td>
                      <td className="p-2">{u.is_approved ? "Yes" : "No"}</td>
                      <td className="p-2">{u.is_active ? "Yes" : "No"}</td>
                      <td className="p-2">
                        {u.updated_at
                          ? new Date(u.updated_at).toLocaleDateString()
                          : ""}
                      </td>
                      <td className="p-2 text-right space-x-2 whitespace-nowrap">
                        {!u.is_approved && (
                          <button
                            disabled={busy}
                            onClick={() => approve(u.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded disabled:opacity-50 text-xs"
                          >
                            Approve
                          </button>
                        )}
                        {u.is_active ? (
                          <button
                            disabled={busy}
                            onClick={() => prohibit(u.id)}
                            className="px-2 py-1 bg-yellow-500 text-white rounded disabled:opacity-50 text-xs"
                          >
                            Prohibit
                          </button>
                        ) : (
                          <button
                            disabled={busy}
                            onClick={() => approve(u.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-50 text-xs"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          disabled={busy}
                          onClick={() => toggleRole(u.id, u.role)}
                          className="px-2 py-1 bg-purple-600 text-white rounded disabled:opacity-50 text-xs"
                        >
                          {u.role === "admin" ? "Make User" : "Make Admin"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => remove(u.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded disabled:opacity-50 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div>
            Page {page + 1} of {pageCount}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => (p + 1 < pageCount ? p + 1 : p))}
              disabled={page + 1 >= pageCount}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
