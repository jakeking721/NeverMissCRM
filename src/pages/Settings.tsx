import React from "react";
import PageShell from "../components/PageShell";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/utils/supabaseClient";

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<{ username: string | null; email: string | null } | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setProfile({ username: data?.username ?? null, email: user.email ?? null });
    };
    void loadProfile();
  }, [user, navigate]);

  if (!user || !profile) return null;

  return (
    <PageShell faintFlag>
      <div className="max-w-3xl mx-auto pt-10 pb-14 px-4">
        <div className="bg-white/95 shadow-xl rounded-2xl p-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-6">
            Settings & Preferences
          </h1>

          {/* User Profile */}
          <div className="bg-blue-50/30 rounded-xl p-4 mb-8">
            <h2 className="text-lg font-bold text-blue-800 mb-3">Account</h2>
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">
                <strong>Username:</strong> {profile.username}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Email:</strong> {profile.email}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => alert("Demo: Change Email triggered")}
                className="text-blue-700 bg-blue-100 hover:bg-blue-200 px-4 py-2 text-sm rounded-xl font-semibold"
              >
                Change Email
              </button>
              <button
                onClick={() => alert("Demo: Change Password triggered")}
                className="text-blue-700 bg-blue-100 hover:bg-blue-200 px-4 py-2 text-sm rounded-xl font-semibold"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-blue-50/30 rounded-xl p-4 mb-8">
            <h2 className="text-lg font-bold text-blue-800 mb-3">Preferences</h2>
            <div className="text-sm text-gray-500">
              Preference settings for notifications, appearance, and more coming soon.
            </div>
          </div>

          {/* Navigation to Field Editor */}
          <div className="text-right">
            <button
              onClick={() => navigate("/settings/fields")}
              className="text-blue-700 bg-blue-100 hover:bg-blue-200 px-5 py-2 rounded-xl font-semibold text-sm"
            >
              Customize Customer Fields
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
