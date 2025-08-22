import React, { useEffect, useRef, useState } from "react";
import { EllipsisVertical } from "lucide-react";

interface ActionItem {
  label: string;
  onClick: () => void;
}

interface Props {
  items: ActionItem[];
}

export default function ActionsDropdown({ items }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring"
      >
        <EllipsisVertical className="w-5 h-5" />
        <span className="sr-only">Actions</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
