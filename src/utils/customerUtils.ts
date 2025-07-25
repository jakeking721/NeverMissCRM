export type Customer = {
  id: string;
  name: string;
  phone: string;
  notes?: string;
};

export function getCustomers(): Customer[] {
  const data = localStorage.getItem("customers");
  return data ? JSON.parse(data) : [];
}

export function saveCustomers(customers: Customer[]) {
  localStorage.setItem("customers", JSON.stringify(customers));
}
