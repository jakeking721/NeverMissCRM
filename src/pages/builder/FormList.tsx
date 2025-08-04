import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchForms } from "@/services/forms";

export default function FormList() {
  const [forms, setForms] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchForms().then(setForms).catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate("/builder/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Form
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forms.map((f) => (
          <div
            key={f.id}
            className="border p-4 rounded cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/builder/${f.id}`)}
          >
            <h3 className="font-semibold">{f.slug || "Untitled"}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
