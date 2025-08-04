import React from "react";

export interface DragEndEvent {
  active: { id: string };
  over: { id: string } | null;
}

export function DndContext({ children }: { children: React.ReactNode; onDragEnd?: (e: DragEndEvent) => void; }) {
  return <div>{children}</div>;
}

export function closestCenter() {
  return null;
}
