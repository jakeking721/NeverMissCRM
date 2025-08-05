// src/components/SmsModal.tsx
// ------------------------------------------------------------------------------------
// Single-recipient SMS modal
// - Props: { customer, onClose }
// - Uses smsService + creditsService
// - Estimates credits and deducts on send
//
// NOTE: Your previous modal supported bulk send with isOpen/onSend/customers.
// This one is intentionally simplified to match how you're rendering it now:
//   {showSmsModal && smsTarget && <SmsModal customer={smsTarget} onClose={onCloseSms} />}
//
// If you still need a bulk-send modal elsewhere, let me know and I’ll ship a
// second component (SmsBulkModal) so both flows coexist cleanly.
// ------------------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getSmsService } from "../services/smsService";
import { creditsService } from "../services/creditsService";
import { Customer as BaseCustomer } from "../utils/auth";

type AnyValue = string | number | boolean | null | undefined;
type Customer = BaseCustomer & Record<string, AnyValue>;

type Props = {
  customer: Customer;
  onClose: () => void;
};

export default function SmsModal({ customer, onClose }: Props) {
  const { user } = useAuth();
  const sms = useMemo(() => getSmsService(user?.username ?? user?.email ?? null), [user]);

  const [message, setMessage] = useState("");
  const [canAfford, setCanAfford] = useState(true);
  const [balance, setBalance] = useState(0);

  const creditsNeeded = useMemo(() => {
    return sms.estimateCredits(message, 1);
  }, [sms, message]);

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
    const phone = customer.phone ? String(customer.phone) : "";
    if (!/^\+?\d{10,15}$/.test(phone)) {
      alert("Invalid phone number.");
      return;
    }
    if (!canAfford) {
      alert(`Not enough credits. You need ${creditsNeeded} but have ${balance}.`);
      return;
    }

    await sms.sendBulk([phone], message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Send SMS</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:underline">
            Cancel
          </button>
        </div>

        <div className="mb-3 text-sm text-gray-700">
          <div>
            <span className="font-medium">To:</span> {customer.name ?? "Unknown"} (
            {customer.phone ?? "No phone"})
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Credits required: <strong>{creditsNeeded}</strong> | Available:{" "}
            <strong>{balance}</strong>
          </div>
        </div>

        <textarea
          className="w-full border rounded-md p-2 h-28 resize-none text-sm"
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onSend}
            disabled={!message.trim() || !canAfford}
            className={`px-4 py-2 text-sm rounded-md text-white ${
              !message.trim() || !canAfford
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
