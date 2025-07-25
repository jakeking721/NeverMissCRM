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

import React, { useMemo, useState } from "react";
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

  const creditsNeeded = useMemo(() => {
    // 1 recipient
    return sms.estimateCredits(message, 1);
  }, [sms, message]);

  const canAfford = creditsService.canAfford(creditsNeeded);

  const onSend = async () => {
    if (!message.trim()) {
      alert("Please enter a message.");
      return;
    }
    if (!canAfford) {
      alert(
        `Not enough credits. You need ${creditsNeeded} but have ${creditsService.getBalance()}.`
      );
      return;
    }

    const res = await sms.sendBulk([customer.phone ?? ""], message); // local fake impl
    if (res.success) {
      creditsService.deduct(creditsNeeded);
      alert(`Message queued. Deducted ${creditsNeeded} credits.`);
      onClose();
    } else {
      alert("Failed to send (demo).");
    }
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
            <strong>{creditsService.getBalance()}</strong>
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

        {/* TODO: Add phone validation, template variables, segment estimates */}
      </div>
    </div>
  );
}
