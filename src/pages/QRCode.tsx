// src/pages/QRCode.tsx
import React, { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react"; // <-- named export
import PageShell from "../components/PageShell";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

export default function QRCodePage() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  const identifier = user.username ?? user.email ?? user.id ?? "anonymous";
  const qrValue = `${window.location.origin}/u/${encodeURIComponent(identifier)}`;

  return (
    <PageShell faintFlag>
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="bg-white/95 p-8 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-extrabold text-blue-900 mb-4">Your QR Code</h1>
          <p className="text-gray-500 text-sm mb-6">
            Scan this QR code to view your public link (or use it for future business tools).
          </p>

          <div className="bg-white p-4 rounded-xl border shadow inline-block">
            <QRCodeSVG value={qrValue} size={200} />
          </div>

          <p className="text-xs text-gray-400 mt-4 break-all">{qrValue}</p>
        </div>
      </div>
    </PageShell>
  );
}
