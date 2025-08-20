// src/components/SmsBulkModal.tsx
// ------------------------------------------------------------------------------------
// Bulk SMS modal
// - Lets the user send one SMS message to N selected customers
// - Enforces credit checks using creditsService
// - Uses smsService (fake/local for now) to "send"
// - Future-proofed for Twilio chunking/rate limits
//
// Future work:
// - Server-side credit enforcement
// - Chunking, rate limiting & retry (Twilio / provider limits)
// - Template variables
// ------------------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getSmsService } from "../services/smsService";
import { creditsService } from "../services/creditsService";
import { Customer as BaseCustomer } from "../utils/auth";
import { formatPhone, normalizePhone } from "@/utils/phone";

type AnyValue = string | number | boolean | null | undefined;
type Customer = BaseCustomer & Record<string, AnyValue>;

type SmsBulkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[]; // the *selected* customers passed in
};

export default function SmsBulkModal({ isOpen, onClose, customers }: SmsBulkModalProps) {
  const { user } = useAuth();
  const sms = useMemo(() => getSmsService(user?.username ?? user?.email ?? null), [user]);

  const [message, setMessage] = useState("");
  const [canAfford, setCanAfford] = useState(true);
  const [balance, setBalance] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const creditsNeeded = useMemo(() => {
    return sms.estimateCredits(message, customers.length);
  }, [sms, message, customers.length]);

  useEffect(() => {
    let active = true;
    (async () => {
      const afford = await creditsService.canAfford(creditsNeeded);
      if (active) setCanAfford(afford);
      const b = await creditsService.getBalance();
      if (active) setBalance(b);
    })();
    return () => {
      active = false;
    };
  }, [creditsNeeded]);

  const onSend = async () => {
    if (!message.trim()) {
      alert("Please enter a message.");
      return;
    }
    if (customers.length === 0) {
      alert("No recipients selected.");
      return;
    }
    if (!canAfford) {
      alert(`Not enough credits. You need ${creditsNeeded} but have ${balance}.`);
      return;
    }

    const phones = Array.from(
      new Set(customers.map((c) => normalizePhone(c.phone)).filter(Boolean) as string[]),
    );

    if (phones.length === 0) {
      alert("No valid phone numbers.");
      return;
    }

    await sms.sendBulk(phones, message);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Send SMS to {customers.length} recipient{customers.length !== 1 ? "s" : ""}
          </h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:underline">
            Cancel
          </button>
        </div>

        <div className="mb-3 text-xs text-gray-600">
          Credits required: <strong>{creditsNeeded}</strong> | Available: <strong>{balance}</strong>
        </div>

        <textarea
          className="w-full border rounded-md p-2 h-32 resize-none text-sm"
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {customers.length > 0 && (
          <div className="mt-3 mb-2 text-xs text-gray-500">
            <div>Preview recipients:</div>
            <ul className="list-disc ml-5">
              {(showAll ? customers : customers.slice(0, 5)).map((c) => (
                <li key={c.id}>
                  {(c.firstName || "") + " " + (c.lastName || "").trim() || "Unknown"} (
                    {formatPhone(c.phone)}
                  )
                </li>
              ))}
            </ul>
            {customers.length > 5 && !showAll && (
              <button onClick={() => setShowAll(true)} className="text-blue-600 underline">
                Show all
              </button>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onSend}
            disabled={!message.trim() || !canAfford || customers.length === 0}
            className={`px-4 py-2 text-sm rounded-md text-white ${
              !message.trim() || !canAfford || customers.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
