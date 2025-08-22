import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { supabase } from "@/utils/supabaseClient";
import { normalizePhone } from "@/utils/phone";
import { normalizeEmail } from "@/utils/email";
import { fetchWizardConfig, type WizardConfig } from "@/services/intake";

interface RouteParams extends Record<string, string | undefined> {
  slug?: string;
}

export default function Wizard() {
  const { slug = "" } = useParams<RouteParams>();
  const navigate = useNavigate();

  const [config, setConfig] = useState<WizardConfig | null>(null);
  const [gateValue, setGateValue] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
    const cfg = await fetchWizardConfig(slug);
        if (!mounted) return;
        setConfig(cfg);
      } catch (e: any) {
        if (mounted) setError(e.message || "Failed to load campaign");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading…</div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">Campaign not found.</div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setError(null);

    const normalized =
      config.gateField === "phone"
        ? normalizePhone(gateValue)
        : normalizeEmail(gateValue);

    if (!normalized) {
      setError("Invalid value");
      return;
    }

    if (config.requireConsent && !consent) {
      setError("Consent required");
      return;
    }

    const { data: existing } = await supabase.rpc("intake_find_customer", {
      owner_id: config.ownerId,
      gate: config.gateField,
      value: normalized,
    });
    if (existing) {
      setCheckedIn(true);
      return;
    }

    let url = `/intake/${slug}`;
    if (config.prefill && normalized) {
      const params = new URLSearchParams({
        gateField: config.gateField,
        gateValue: normalized,
      });
      url += `?${params.toString()}`;
    }
    navigate(url);
  }

  if (checkedIn) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded shadow text-center space-y-4">
          <FaCheckCircle className="text-green-600 text-5xl mx-auto" />
          <h1 className="text-xl font-bold">Already checked in</h1>
          {config?.successMessage && (
            <p className="text-sm text-gray-700">{config.successMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow w-full max-w-md space-y-4"
      >
        <div className="space-y-1">
          <label className="font-medium">
            {config.gateField === "phone" ? "Phone" : "Email"}
          </label>
          <input
            type={config.gateField === "phone" ? "tel" : "email"}
            value={gateValue}
            onChange={(e) => setGateValue(e.target.value)}
            className="border rounded w-full p-2"
            required
          />
        </div>

        {config.requireConsent && (
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="rounded border"
            />
            <span>I consent to be contacted.</span>
          </label>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

