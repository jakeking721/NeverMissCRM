// src/pages/CampaignBuilder.tsx
// ------------------------------------------------------------------------------------
// Campaign Builder (with Segment Filters) – Supabase-ready
// - Build/schedule SMS campaigns
// - Estimate & deduct credits (creditsService is async now)
// - Test send via smsService
// - SegmentBuilder to filter recipients by custom fields
// ------------------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { v4 as uuid } from "uuid";
import { Campaign, getCampaigns, addCampaign } from "@/services/campaignService";
import { getCustomers } from "@/services/customerService";
import { getFields, CustomField } from "@/services/fieldsService";
import { creditsService } from "@/services/creditsService";
import { getSmsService } from "@/services/smsService";
import SegmentBuilder, { Segment, SegmentRule } from "@/components/segments/SegmentBuilder";
import { FiSave } from "react-icons/fi";
import { formatPhone, normalizePhone } from "@/utils/phone";

type AnyValue = string | number | boolean | null | undefined;

type Customer = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  location?: string;
  signupDate: string;
  [key: string]: AnyValue;
};

export default function CampaignBuilder() {
  const { user } = useAuth();

  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fields, setFields] = useState<CustomField[]>([]);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [creditsBalance, setCreditsBalance] = useState<number>(0);
  const [creditsEstimate, setCreditsEstimate] = useState<number>(0);
  const [canAfford, setCanAfford] = useState<boolean>(true);

  const [segment, setSegment] = useState<Segment>({ rules: [], match: "all" });

  const sms = useMemo(() => getSmsService(user?.username ?? user?.email ?? null), [user]);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        // Auto-update scheduled campaigns to 'sent' if their time has passed (if your service still local-only)
        const now = new Date();
        const existing = await getCampaigns();
        const maybeUpdated = existing.map((c): Campaign => {
          if (c.status === "scheduled" && c.scheduledFor && new Date(c.scheduledFor) <= now) {
            // NOTE: If you move to Supabase, do this in the DB or a job; we leave as-is for local demo parity
            return { ...c, status: "sent" };
          }
          return c;
        });
        setAllCampaigns(maybeUpdated);

        const list = await getCustomers();
        setCustomers(list);

        const fieldsResult = await Promise.resolve(getFields());
        const allFields = fieldsResult
          .filter((f: CustomField) => !f.archived && f.visibleOn.campaigns)
          .sort((a: CustomField, b: CustomField) => a.order - b.order);
        setFields(allFields);

        const balance = await creditsService.getBalance();
        setCreditsBalance(balance);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Keep credits estimate + canAfford up to date
  const filteredBySegment = useMemo(() => {
    if (segment.rules.length === 0) return customers;
    return customers.filter((c) => matchesSegment(c, segment, fields));
  }, [customers, segment, fields]);

  const recipients = useMemo(
    () =>
      filteredBySegment
        .filter((c) => selectedIds.includes(c.id))
        .map((c) => normalizePhone(c.phone))
        .filter(Boolean),
    [filteredBySegment, selectedIds]
  );

  const segments = Math.max(1, Math.ceil(message.length / 160));

  useEffect(() => {
    let mounted = true;

    // estimate credits is sync in your stub, but we still guard like it's async-safe
    const estimate = sms.estimateCredits(message, recipients.length);
    setCreditsEstimate(estimate);

    (async () => {
      try {
        const afford = await creditsService.canAfford(estimate);
        if (mounted) setCanAfford(afford);
        const balance = await creditsService.getBalance();
        if (mounted) setCreditsBalance(balance);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sms, message, recipients.length]);

  const toggleRecipient = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onSave = async () => {
    if (!name.trim()) {
      alert("Campaign name is required.");
      return;
    }
    if (!message.trim()) {
      alert("Message is required.");
      return;
    }
    if (recipients.length === 0) {
      alert("Select at least one recipient.");
      return;
    }

    const balance = await creditsService.getBalance();
    if (balance < creditsEstimate) {
      alert(`Not enough credits. Need ${creditsEstimate}, have ${balance}.`);
      return;
    }

    setSaving(true);
    try {
      const status: Campaign["status"] = scheduleDate ? "scheduled" : "draft";
      const newCampaign: Campaign = {
        id: uuid(),
        name,
        message,
        recipients,
        status,
        createdAt: new Date().toISOString(),
        scheduledFor: scheduleDate || undefined,
      };

      if (status === "scheduled" && newCampaign.scheduledFor) {
        await sms.scheduleBulk(recipients, message, newCampaign.scheduledFor);
      }

      // Deduct credits (await DB)
      const deductRes = await creditsService.deduct(creditsEstimate);
      if (!deductRes.ok) {
        alert(deductRes.message ?? "Failed to deduct credits.");
        return;
      }

      await addCampaign(newCampaign);

      // Refresh list and balance
      const updated = await getCampaigns();
      setAllCampaigns(updated);
      const newBal = await creditsService.getBalance();
      setCreditsBalance(newBal);

      // Reset form
      setName("");
      setMessage("");
      setSelectedIds([]);
      setScheduleDate("");
      setSegment({ rules: [], match: "all" });

      alert("Campaign saved.");
    } catch (e) {
      console.error(e);
      alert("Failed to save campaign.");
    } finally {
      setSaving(false);
    }
  };

  const onTestSend = async () => {
    if (!message.trim()) {
      alert("Enter a message first.");
      return;
    }
    const to = prompt("Enter a phone number to test-send to:");
    if (!to) return;
    const normalized = normalizePhone(to);
    if (!normalized) {
      alert("Invalid phone number.");
      return;
    }

    const testCost = sms.estimateCredits(message, 1);
    const afford = await creditsService.canAfford(testCost);
    if (!afford) {
      const bal = await creditsService.getBalance();
      alert(`Not enough credits for test send. Need ${testCost}, have ${bal}.`);
      return;
    }

    await sms.sendTest(normalized, message);
  };

  // convenience: select all filtered customers
  const toggleSelectAllFiltered = () => {
    const ids = filteredBySegment.map((c) => c.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const filteredAllSelected =
    filteredBySegment.length > 0 && filteredBySegment.every((c) => selectedIds.includes(c.id));

  return (
    <PageShell faintFlag>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">New Campaign</h1>
            <p className="text-sm text-gray-600">
              Create and schedule an SMS campaign. Credits estimated per recipient.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTestSend}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Test Send
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className={`px-3 py-2 text-sm border rounded ${
                saving ? "bg-gray-300" : "hover:bg-gray-50"
              }`}
            >
              <FiSave className="inline-block mr-1" />
              {saving ? "Saving..." : "Save Campaign"}
            </button>
          </div>
        </div>

        {/* Builder */}
        <section className="p-4 bg-white rounded-md shadow border space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Campaign Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded w-full px-2 py-1"
              placeholder="Spring Promo Blast"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-1">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border rounded w-full px-2 py-1 h-28"
              placeholder="Write your message..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length} chars, ~{segments} SMS segment{segments !== 1 ? "s" : ""}.
            </p>
          </div>

          {/* Segment Builder */}
          <div>
            <SegmentBuilder fields={fields} segment={segment} onChange={setSegment} />
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium mb-1">
                Recipients ({selectedIds.length} of {filteredBySegment.length} filtered)
              </label>
              <button
                onClick={toggleSelectAllFiltered}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
              >
                {filteredAllSelected ? "Unselect All" : "Select All"}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border rounded p-3 space-y-1 text-sm">
              {loading ? (
                <div className="text-gray-400">Loading customers…</div>
              ) : filteredBySegment.length === 0 ? (
                <div className="text-gray-400">No customers match the current filters.</div>
              ) : (
                filteredBySegment.map((c) => (
                  <label key={c.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleRecipient(c.id)}
                    />
                    <span>
                      {c.name} – {formatPhone(c.phone)}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium mb-1">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              If empty, this campaign is saved as a draft (no immediate send in this demo).
            </p>
          </div>

          {/* Credits */}
          <div className="text-sm text-gray-700">
            Estimated Credits (total):{" "}
            <span className={`font-semibold ${!canAfford ? "text-red-600" : ""}`}>
              {creditsEstimate}
            </span>{" "}
            | Available: <span className="font-semibold">{creditsBalance}</span>
          </div>
        </section>

        {/* Existing campaigns snapshot */}
        <section className="p-4 bg-white rounded-md shadow border">
          <h2 className="text-lg font-medium mb-3">Your Campaigns</h2>
          {allCampaigns.length === 0 ? (
            <p className="text-sm text-gray-500">No campaigns yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Name</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Recipients</th>
                    <th className="py-2">Schedule</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {allCampaigns.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2 capitalize">{c.status}</td>
                      <td className="py-2">{c.recipients.length}</td>
                      <td className="py-2">
                        {c.scheduledFor ? new Date(c.scheduledFor).toLocaleString() : "—"}
                      </td>
                      <td className="py-2">
                        {new Date(c.createdAt).toLocaleDateString()}{" "}
                        {new Date(c.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

// ------------------------------------------------------------------------------------
// Rule Engine
// ------------------------------------------------------------------------------------

function matchesSegment(customer: Customer, segment: Segment, fields: CustomField[]): boolean {
  if (segment.match === "any") {
    return segment.rules.some((r) => matchesRule(customer, r, fields));
  }
  return segment.rules.every((r) => matchesRule(customer, r, fields));
}

function matchesRule(customer: Customer, rule: SegmentRule, _fields: CustomField[]): boolean {
  const value = customer[rule.fieldKey];

  switch (rule.operator) {
    case "equals":
      return String(value ?? "").toLowerCase() === String(rule.value ?? "").toLowerCase();
    case "contains":
      return String(value ?? "")
        .toLowerCase()
        .includes(String(rule.value ?? "").toLowerCase());
    case "greaterThan":
      return Number(value) > Number(rule.value);
    case "lessThan":
      return Number(value) < Number(rule.value);
    case "isTrue":
      return Boolean(value) === true;
    case "isFalse":
      return Boolean(value) === false;
    default:
      return false;
  }
}
