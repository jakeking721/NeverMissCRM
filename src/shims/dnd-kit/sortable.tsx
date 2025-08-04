import React from "react";

export function SortableContext({ children }: { children: React.ReactNode; items: any[]; strategy?: any; }) {
  return <div>{children}</div>;
}

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export const verticalListSortingStrategy = {};

export function useSortable({ id }: { id: string }) {
  return {
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
  } as any;
}
