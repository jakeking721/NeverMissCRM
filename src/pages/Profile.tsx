// src/pages/Profile.tsx
import React, { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/utils/supabaseClient";

export default function Profile() {
  const { user: legacyCacheUser, refresh } = useAuth(); // legacy 'user' shape from AuthContext
  const navigate = useNavigate();

  // We’ll rely on the cache user (AuthContext) for now to keep backward-compat
  const user = legacyCacheUser;

  // We do NOT prefill password (Supabase doesn’t expose it). User can enter a new one to update.
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState(""); // new password only
  const [avatar, setAvatar] = useState<string>((user as any)?.avatar || "");
  const [preview, setPreview] = useState<string>((user as any)?.avatar || "");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);
    setErr(null);

    try {
      // 1) Update email/password via supabase.auth
      // NOTE: If you change email, Supabase may require re-confirmation depending on your project settings
      const updates: { email?: string; password?: string } = {};
      if (email && email !== user.email) {
        updates.email = email;
      }
      if (password) {
        updates.password = password;
      }
      if (updates.email || updates.password) {
        const { error: authErr } = await supabase.auth.updateUser(updates);
        if (authErr) throw authErr;
      }

      // 2) Update profile row (avatar or anything else you store there)
      // Make sure your profiles table has an `avatar` column (text)
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ avatar })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      await refresh(); // re-hydrate AuthContext (pulls from Supabase)
      setMessage("Profile updated!");
      setPassword(""); // clear password field
    } catch (e: any) {
      console.error(e);
      setErr(e.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatar(base64);
        setPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <PageShell faintFlag>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white/95 p-8 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-extrabold text-blue-900 mb-6">
            Edit Profile
          </h1>

          {err && (
            <div className="mb-4 text-red-600 text-sm text-center">{err}</div>
          )}
          {message && (
            <div className="mb-4 text-green-600 text-sm text-center">
              {message}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="font-semibold text-sm text-blue-700">
                Email
              </label>
              <input
                className="border px-4 py-2 rounded-xl"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold text-sm text-blue-700">
                New Password (leave blank to keep current)
              </label>
              <input
                className="border px-4 py-2 rounded-xl"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold text-sm text-blue-700">
                Avatar (Optional)
              </label>
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
              {preview && (
                <img
                  src={preview}
                  alt="Avatar Preview"
                  className="w-20 h-20 object-cover rounded-full mt-3"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
