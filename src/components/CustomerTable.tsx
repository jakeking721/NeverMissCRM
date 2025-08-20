// src/components/CustomerTable.tsx
import React from "react";
import type { Customer } from "../utils/auth";
import { formatPhone } from "@/utils/phone";

interface CustomerTableProps {
  customers: Customer[];
  columns?: Array<{ key: keyof Customer; label: string }>;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  pageSize?: number;
}

const DEFAULT_COLUMNS = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "phone", label: "Phone" },
  { key: "zipCode", label: "Zip Code" },
  { key: "signupDate", label: "Signup Date" },
];

export default function CustomerTable({
  customers,
  columns = DEFAULT_COLUMNS,
  onDelete,
  onEdit,
  pageSize = 25,
}: CustomerTableProps) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(customers.length / pageSize);

  // Paginate customers
  const paginated = customers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="border rounded-xl overflow-x-auto bg-white shadow">
      <table className="w-full text-left min-w-[600px]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key as string} className="py-2 px-3 font-semibold bg-blue-50">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="py-2 px-3"></th>}
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-6 text-gray-400">
                No customers found.
              </td>
            </tr>
          ) : (
            paginated.map((c) => (
              <tr
                key={c.id}
                className={c.isDemo ? "bg-blue-50 text-gray-400 italic" : "hover:bg-blue-50"}
              >
                {columns.map((col) => (
                  <td key={col.key as string} className="py-2 px-3">
                    {col.key === "phone"
                      ? formatPhone(c.phone)
                      : String(c[col.key] ?? "")}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="py-2 px-3 flex gap-2">
                    {onEdit && (
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => onEdit(c.id)}
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && !c.isDemo && (
                      <button
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => onDelete(c.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-blue-100 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-blue-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
