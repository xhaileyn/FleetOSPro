export type CustomerStatus     = 'Active' | 'Inactive' | 'Prospect';
export type CustomerType       = 'Company' | 'Individual';
export type ComplianceStatus   = 'Compliant' | 'Pending Review' | 'Flagged';

export interface ContactPerson {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  primary: boolean;
}

export interface Customer {
  id: string;
  cid?: number;               // numeric customer ID (auto-increment PK from DB)
  tenantId: string;           // scoped to tenant
  parentId: string | null;    // null = top-level company
  name: string;
  type: CustomerType;
  status: CustomerStatus;
  industry: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  creditLimit: number;        // KES
  complianceStatus: ComplianceStatus;
  complianceNotes: string;
  vehiclesAssigned: number;
  activeContracts: number;
  contacts: ContactPerson[];
  notes: string;
  createdAt: string;
  accountManager: string;
}

/* ── Seed data — scoped to ACME Logistics (tenantId '1') ─────────── */

/** Populated by customersStore on app load from PostgreSQL. */
export const CUSTOMERS: Customer[] = [];

export function getCustomerById(id: string): Customer | undefined {
  return CUSTOMERS.find(c => c.id === id);
}

export function getChildren(parentId: string): Customer[] {
  return CUSTOMERS.filter(c => c.parentId === parentId);
}

export function getParents(): Customer[] {
  return CUSTOMERS.filter(c => c.parentId === null);
}

export function getCustomersByTenant(tenantId: string): Customer[] {
  return CUSTOMERS.filter(c => c.tenantId === tenantId);
}
