// src/pages/CustomerIntake.tsx
// -----------------------------------------------------------------------------
// Public intake form (Supabase version)
// - Calls RPC: intake_add_customer(p_slug, p_first_name, p_last_name, p_phone, p_zip_code, p_extra)
// - No login required
// - Supports /intake/:slug (preferred) and /u/:username (legacy)
// - Reads owner display info via public_slugs -> profiles(username)
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabaseClient";
import { submitIntake, fetchWizardConfig, WizardConfig } from "@/services/intake";
import { formatPhone, normalizePhone } from "@/utils/phone";

type RouteParams = {
  slug?: string;
  username?: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  zipCode: string;
};

export default function CustomerIntake() {
  const { username: legacyUsernameParam, slug: slugParam } = useParams<RouteParams>();
  const navigate = useNavigate();

  // Support both routes: /intake/:slug OR /u/:username
  const slug = slugParam ?? legacyUsernameParam ?? "";

  const [ownerName, setOwnerName] = useState<string>("");
  const [loadingOwner, setLoadingOwner] = useState<boolean>(true);

  const [config, setConfig] = useState<WizardConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  const [form, setForm] = useState<FormState>({ firstName: "", lastName: "", phone: "", zipCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the owner's public name and campaign config
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!slug) {
          setLoadingOwner(false);
          setLoadingConfig(false);
          return;
        }

        // public_slugs.user_id -> profiles(id)
        const { data, error } = await supabase
          .from("public_slugs")
          .select("slug, profiles(username)")
          .eq("slug", slug)
          .single();

        if (mounted) {
          if (error || !data) {
            setOwnerName("");
          } else {
            // @ts-ignore - without generated types, we rely on runtime
            setOwnerName(data.profiles?.username ?? "");
          }
          setLoadingOwner(false);
        }

        const cfg = await fetchWizardConfig(slug);
        if (mounted) setConfig(cfg);
      } catch (e) {
        if (mounted) {
          console.error(e);
          setOwnerName("");
          setConfig(null);
        }
      } finally {
        if (mounted) setLoadingConfig(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  // Very light optional validation (remove if you don't want it)
  const isValidPhone = (p: string) => !!normalizePhone(p);

  // Invalid link screen
  if (!slug) {
    return (
      <ScreenWrapper>
        <h1 className="text-2xl font-bold text-red-700 mb-4">Invalid Link</h1>
        <p className="mb-6 text-sm text-gray-600">
          Missing slug/username. Please scan a valid QR code.
        </p>
        <PrimaryButton onClick={() => navigate("/")}>Go Home</PrimaryButton>
      </ScreenWrapper>
    );
  }

  if (loadingConfig) {
    return (
      <ScreenWrapper>
        <p className="text-sm text-gray-500">Loading…</p>
      </ScreenWrapper>
    );
  }

  if (!config) {
    return (
      <ScreenWrapper>
        <h1 className="text-2xl font-bold text-red-700 mb-4">Campaign Unavailable</h1>
        <p className="mb-6 text-sm text-gray-600">This campaign is inactive or expired.</p>
        <PrimaryButton onClick={() => navigate("/")}>Return Home</PrimaryButton>
      </ScreenWrapper>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <ScreenWrapper>
        <h1 className="text-3xl font-extrabold text-green-700 mb-2">Thanks!</h1>
        <p className="mb-6 text-center">
          Your information has been sent{ownerName ? ` to ${ownerName}` : ""}. You may close this
          window.
        </p>
        <PrimaryButton onClick={() => navigate("/")}>Return Home</PrimaryButton>
      </ScreenWrapper>
    );
  }

  // Main form
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-2">
      <div className="bg-white/90 shadow-xl p-8 rounded-2xl max-w-lg w-full">
        {loadingOwner ? (
          <p className="text-sm text-gray-500 mb-4">Loading…</p>
        ) : (
          <h2 className="text-2xl font-bold text-blue-800 mb-2">
            Join {ownerName || "this user"}’s List
          </h2>
        )}

        {error && (
          <div className="mb-3 text-red-600 text-sm border border-red-200 rounded p-2 bg-red-50">
            {error}
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);

            if (!form.firstName || !form.phone) {
              setError("First name and phone are required.");
              return;
            }
            if (!isValidPhone(form.phone)) {
              setError("Please enter a valid phone number.");
              return;
            }

            setSubmitting(true);

            try {
              await submitIntake({
                slug,
                campaignId: config.campaignId,
                formVersionId: config.formVersionId,
                ownerId: config.ownerId,
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                zipCode: form.zipCode || null,
                extra: { source: "qr" },
              });
              setSubmitted(true);
            } catch (e: any) {
              console.error(e);
              setError(e?.message ?? "Failed to submit. Try again later.");
            } finally {
              setSubmitting(false);
            }
          }}
          className="flex flex-col gap-4"
        >
          <input
            type="text"
            placeholder="First Name"
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="p-3 rounded border border-blue-200 focus:ring w-full"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="p-3 rounded border border-blue-200 focus:ring w-full"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            required
            value={formatPhone(form.phone)}
            onChange={(e) =>
              setForm({ ...form, phone: normalizePhone(e.target.value) ?? "" })
            }
            className="p-3 rounded border border-blue-200 focus:ring w-full"
          />
          <input
            type="text"
            placeholder="Zip Code (optional)"
            value={form.zipCode}
            onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
            className="p-3 rounded border border-blue-200 focus:ring w-full"
          />

          <button
            disabled={submitting}
            className="bg-blue-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-800 transition disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Add Me to the List"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ------------------------- tiny UI helpers -------------------------

function ScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-2 text-center">
      <div className="bg-white/90 shadow-xl p-8 rounded-2xl max-w-lg w-full">{children}</div>
    </div>
  );
}

function PrimaryButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="px-4 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 transition"
    >
      {children}
    </button>
  );
}
