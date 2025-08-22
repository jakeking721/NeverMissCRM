import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { getQrBaseUrl } from "@/utils/url";

interface Props {
  isOpen: boolean;
  url: string;
  onClose: () => void;
}

export default function QrModal({ isOpen, url, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullUrl = url.startsWith("http")
    ? url
    : `${getQrBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "qr-code.png";
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">QR Code</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:underline">
            Close
          </button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <QRCodeCanvas value={fullUrl} size={180} ref={canvasRef as any} />
          <input
            type="text"
            readOnly
            value={fullUrl}
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <div className="flex flex-col sm:flex-row w-full gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 px-4 py-2 text-sm rounded-md border hover:bg-gray-50"
            >
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
