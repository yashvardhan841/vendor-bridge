import { useState, useEffect } from 'react';

// --- TypeScript Interfaces ---

export interface Vendor {
  id: string;
  name: string;
  category: string;
  gstNumber: string;
  email: string;
  phone: string;
  rating: number; // 1.0 to 5.0 stars
  status: 'Compliant' | 'Pending Review' | 'Suspended';
}

export interface RFQ {
  id: string;
  title: string;
  description: string;
  itemName: string;
  quantity: number;
  created: string;
  due: string; // deadline
  assignedVendors: string[]; // array of vendor names (e.g. Apex Solutions Corp)
  dept: string;
  count: number;
  status: 'Draft' | 'Published' | 'Closed';
}

export interface Quotation {
  id: string;
  rfqId: string;
  vendor: string;
  amount: string;
  leadTime: string;
  notes: string; // new
  compatibility: string;
  status: 'Under Review' | 'Declined' | 'Accepted' | 'Pending Approval';
  isBestValue: boolean;
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  value: string;
  issued: string;
  delivery: 'Pending' | 'Shipped' | 'Delivered';
  billing: 'Paid' | 'Unpaid';
  quoteId?: string;
  rfqId?: string;
  itemName?: string;
  quantity?: number;
  description?: string;
}

export interface Invoice {
  id: string;
  poId: string;
  vendor: string;
  subtotal?: string;
  tax?: string;
  amount: string; // Total Amount
  date: string;
  due: string;
  status: 'Paid' | 'Processing' | 'Overdue' | 'Disputed';
}

export interface ActivityLog {
  id: string;
  user: string;
  role: string;
  action: string;
  details: string;
  time: string;
  category: 'security' | 'transaction' | 'procurement' | 'system';
}

export interface ApprovalItem {
  id: string;
  type: 'Purchase Order' | 'Vendor Signup' | 'Contract Clause' | 'Quotation';
  target: string;
  requestor: string;
  value: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
  quoteId?: string;
}

// --- Database Schema ---

interface DatabaseSchema {
  vendors: Vendor[];
  rfqs: RFQ[];
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  activityLogs: ActivityLog[];
  approvals: ApprovalItem[];
}

const STORAGE_KEY = 'vendor_bridge_db';
const DB_UPDATE_EVENT = 'vendor_bridge_db_update';

// --- Seeder Data ---

const initialVendors: Vendor[] = [
  { 
    id: 'VB-2026-001', 
    name: 'Apex Solutions Corp', 
    category: 'Raw Materials', 
    gstNumber: '27AAPCA8822A1Z5',
    email: 'portal@apexsolutions.com',
    phone: '+1 (555) 019-2834',
    rating: 4.7,
    status: 'Compliant'
  },
  { 
    id: 'VB-2026-002', 
    name: 'Vertex Logistics Ltd', 
    category: 'Logistics', 
    gstNumber: '27AAPCV4411A1Z9',
    email: 'support@vertexlogistics.com',
    phone: '+1 (555) 024-9988',
    rating: 4.4,
    status: 'Compliant'
  },
  { 
    id: 'VB-2026-003', 
    name: 'Nova Technology Systems', 
    category: 'IT & Software', 
    gstNumber: '27AAPCN1122A1Z1',
    email: 'sales@novatech.io',
    phone: '+1 (555) 039-4411',
    rating: 4.0,
    status: 'Pending Review'
  },
  { 
    id: 'VB-2026-004', 
    name: 'Titan Group S.A.', 
    category: 'Heavy Machinery', 
    gstNumber: '27AAPCT9988A1Z3',
    email: 'contact@titangroup.com',
    phone: '+1 (555) 088-3322',
    rating: 4.6,
    status: 'Compliant'
  },
  { 
    id: 'VB-2026-005', 
    name: 'Quantum Energy Partners', 
    category: 'Utilities', 
    gstNumber: '27AAPCQ1234A1Z7',
    email: 'helpdesk@quantumenergy.com',
    phone: '+1 (555) 044-8855',
    rating: 3.1,
    status: 'Suspended'
  },
];

const initialRFQs: RFQ[] = [
  { 
    id: 'RFQ-2026-089', 
    title: 'Industrial Grade Cast Aluminum Castings', 
    description: 'Procurement of CNC milled castings for plant assembly line expansion.',
    itemName: 'Aluminum Castings Grade A',
    quantity: 250,
    dept: 'Production Machinery', 
    created: '2026-06-01', 
    due: '2026-06-15', 
    count: 3, 
    status: 'Published',
    assignedVendors: ['Apex Solutions Corp', 'Vertex Logistics Ltd', 'Nova Technology Systems']
  },
  { 
    id: 'RFQ-2026-090', 
    title: 'Data Center Hardware Expansion (Fiber Channels)', 
    description: 'Upgrade network speed and redundancy in Server Room B.',
    itemName: '10Gbps Fiber Optic Transceivers',
    quantity: 50,
    dept: 'Information Technology', 
    created: '2026-06-03', 
    due: '2026-06-25', 
    count: 1, 
    status: 'Published',
    assignedVendors: ['Nova Technology Systems']
  },
  { 
    id: 'RFQ-2026-091', 
    title: 'High-Temperature Silicone Sealants', 
    description: 'Procurement of weather-resistant industrial sealants.',
    itemName: 'Silicone Sealant Tube 300ml',
    quantity: 120,
    dept: 'Chemical Process Division', 
    created: '2026-06-05', 
    due: '2026-06-12', 
    count: 0, 
    status: 'Draft',
    assignedVendors: ['Apex Solutions Corp', 'Titan Group S.A.']
  },
  { 
    id: 'RFQ-2026-062', 
    title: 'Facility HVAC Overhaul & Ducting Maintenance', 
    description: 'Quarterly review and maintenance of administrative block cooling towers.',
    itemName: 'HVAC Air Filter Units',
    quantity: 15,
    dept: 'Facilities & Logistics', 
    created: '2026-05-10', 
    due: '2026-05-28', 
    count: 6, 
    status: 'Closed',
    assignedVendors: ['Apex Solutions Corp', 'Titan Group S.A.', 'Vertex Logistics Ltd']
  },
];

const initialQuotations: Quotation[] = [
  { id: 'QTN-2026-771', rfqId: 'RFQ-2026-089', vendor: 'Apex Solutions Corp', amount: '$42,500', leadTime: '5 days', notes: 'Using certified Grade A aluminum castings. Standard freight included.', compatibility: '98%', status: 'Under Review', isBestValue: true },
  { id: 'QTN-2026-772', rfqId: 'RFQ-2026-089', vendor: 'Vertex Logistics Ltd', amount: '$46,000', leadTime: '3 days', notes: 'Express supply route option enabled. Rapid customs clearance handled.', compatibility: '92%', status: 'Under Review', isBestValue: false },
  { id: 'QTN-2026-773', rfqId: 'RFQ-2026-089', vendor: 'Nova Technology Systems', amount: '$49,800', leadTime: '8 days', notes: 'Includes premium surface polishing and QA verification certificates.', compatibility: '85%', status: 'Declined', isBestValue: false },
  { id: 'QTN-2026-612', rfqId: 'RFQ-2026-062', vendor: 'Titan Group S.A.', amount: '$180,000', leadTime: '15 days', notes: 'Full service contract and replacement parts warranty for 24 months.', compatibility: '95%', status: 'Accepted', isBestValue: true },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  { id: 'PO-2026-455', vendor: 'Apex Solutions Corp', value: '$125,000', issued: '2026-06-05', delivery: 'Pending', billing: 'Unpaid' },
  { id: 'PO-2026-441', vendor: 'Vertex Logistics Ltd', value: '$12,400', issued: '2026-05-28', delivery: 'Shipped', billing: 'Paid' },
  { id: 'PO-2026-439', vendor: 'Titan Group S.A.', value: '$180,000', issued: '2026-05-15', delivery: 'Delivered', billing: 'Paid' },
  { id: 'PO-2026-412', vendor: 'Nova Technology Systems', value: '$8,900', issued: '2026-04-30', delivery: 'Delivered', billing: 'Paid' },
];

const initialInvoices: Invoice[] = [
  { id: 'INV-2026-8822', poId: 'PO-2026-441', vendor: 'Vertex Logistics Ltd', amount: '$12,400', date: '2026-06-02', due: '2026-07-02', status: 'Paid' },
  { id: 'INV-2026-8823', poId: 'PO-2026-455', vendor: 'Apex Solutions Corp', amount: '$125,000', date: '2026-06-05', due: '2026-07-05', status: 'Processing' },
  { id: 'INV-2026-8790', poId: 'PO-2026-412', vendor: 'Nova Technology Systems', amount: '$8,900', date: '2026-05-15', due: '2026-06-15', status: 'Overdue' },
  { id: 'INV-2026-8750', poId: 'PO-2026-439', vendor: 'Titan Group S.A.', amount: '$180,000', date: '2026-05-18', due: '2026-06-18', status: 'Disputed' },
];

const initialActivityLogs: ActivityLog[] = [
  { id: 'LOG-44911', user: 'Sarah Connor', role: 'Admin', action: 'Auth Gateway Security Revise', details: 'Updated API rate limits for External Vendor Portals.', time: '2026-06-06 09:12', category: 'security' },
  { id: 'LOG-44910', user: 'James Carter', role: 'Procurement Officer', action: 'RFQ Published', details: 'Published RFQ-2026-091 (Silicone Sealants) to public marketplace.', time: '2026-06-05 16:45', category: 'procurement' },
  { id: 'LOG-44909', user: 'Apex Solutions Corp', role: 'Vendor', action: 'Bid Proposal Submitted', details: 'Uploaded bid response QTN-2026-771 value $42,500.', time: '2026-06-05 11:20', category: 'transaction' },
  { id: 'LOG-44908', user: 'Elena Rostova', role: 'Manager', action: 'Workflow Approved', details: 'Released budget authorization for PO-2026-441 ($12,400).', time: '2026-06-04 14:15', category: 'transaction' },
  { id: 'LOG-44907', user: 'System Engine', role: 'System', action: 'Database Index Maintenance', details: 'Re-indexed transactions, RFQs and ledger tables in 4.1s.', time: '2026-06-04 02:00', category: 'system' },
  { id: 'LOG-44906', user: 'Nova Technology Systems', role: 'Vendor', action: 'Onboarding Document Upload', details: 'Uploaded renewed ISO 9001 compliance certificate PDF.', time: '2026-06-03 10:30', category: 'procurement' },
];

const initialApprovals: ApprovalItem[] = [
  { id: 'APR-2026-001', type: 'Purchase Order', target: 'PO-2026-455 (Raw Parts)', requestor: 'James Carter', value: '$125,000', date: '2026-06-05', status: 'Pending' },
  { id: 'APR-2026-002', type: 'Vendor Signup', target: 'Vertex Logistics Ltd', requestor: 'Sarah Connor', value: 'N/A', date: '2026-06-04', status: 'Pending' },
  { id: 'APR-2026-003', type: 'Purchase Order', target: 'PO-2026-458 (Consulting)', requestor: 'Elena Rostova', value: '$45,000', date: '2026-06-05', status: 'Pending' },
  { id: 'APR-2026-004', type: 'Contract Clause', target: 'Apex Indemnity Waiver v2', requestor: 'James Carter', value: 'N/A', date: '2026-06-02', status: 'Pending' },
];

// --- Core Helper Functions ---

const loadDb = (): DatabaseSchema => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const defaultDb: DatabaseSchema = {
      vendors: initialVendors,
      rfqs: initialRFQs,
      quotations: initialQuotations,
      purchaseOrders: initialPurchaseOrders,
      invoices: initialInvoices,
      activityLogs: initialActivityLogs,
      approvals: initialApprovals,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
    return defaultDb;
  }
  try {
    const db: DatabaseSchema = JSON.parse(data);
    
    // --- Data Schema Migration ---
    let migrated = false;
    
    // 1. Migrate Vendors
    db.vendors = db.vendors.map((v: any) => {
      if (!('gstNumber' in v)) {
        migrated = true;
        
        // Find seeder match or default
        const seederMatch = initialVendors.find(iv => iv.id === v.id);
        
        return {
          id: v.id,
          name: v.name,
          category: v.category,
          gstNumber: seederMatch ? seederMatch.gstNumber : '27AAPCA1234A1Z1',
          email: v.contact || (seederMatch ? seederMatch.email : 'contact@company.com'),
          phone: seederMatch ? seederMatch.phone : '+1 (555) 012-3456',
          rating: v.score ? Number((v.score / 20).toFixed(1)) : (seederMatch ? seederMatch.rating : 4.0),
          status: v.status || 'Compliant',
        } as Vendor;
      }
      return v;
    });

    // 2. Migrate RFQs
    db.rfqs = db.rfqs.map((rfq: any) => {
      if (!('description' in rfq)) {
        migrated = true;
        
        // Find seeder fallback or default
        const seederMatch = initialRFQs.find(r => r.id === rfq.id);
        
        return {
          ...rfq,
          description: seederMatch ? seederMatch.description : 'No description provided.',
          itemName: seederMatch ? seederMatch.itemName : 'Default Item Specification',
          quantity: seederMatch ? seederMatch.quantity : 100,
          assignedVendors: seederMatch ? seederMatch.assignedVendors : ['Apex Solutions Corp'],
          status: rfq.status === 'Active' ? 'Published' : rfq.status === 'Closed' ? 'Closed' : 'Draft',
        } as RFQ;
      }
      
      // Map legacy "Active" status to "Published"
      if (rfq.status === 'Active') {
        migrated = true;
        rfq.status = 'Published';
      }
      
      return rfq;
    });

    // 3. Migrate Quotations
    db.quotations = db.quotations.map((q: any) => {
      if (!('notes' in q)) {
        migrated = true;
        
        // Find seeder match or default
        const seederMatch = initialQuotations.find(iq => iq.id === q.id);
        
        return {
          ...q,
          notes: seederMatch ? seederMatch.notes : 'Standard bid proposal submission.',
        } as Quotation;
      }
      return q;
    });

    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }

    return db;
  } catch (e) {
    console.error('Failed to parse database, resetting to default', e);
    const defaultDb: DatabaseSchema = {
      vendors: initialVendors,
      rfqs: initialRFQs,
      quotations: initialQuotations,
      purchaseOrders: initialPurchaseOrders,
      invoices: initialInvoices,
      activityLogs: initialActivityLogs,
      approvals: initialApprovals,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
    return defaultDb;
  }
};

const saveDb = (db: DatabaseSchema) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  window.dispatchEvent(new Event(DB_UPDATE_EVENT));
};

// --- CRUD Operations ---

// 1. Vendors
export const getVendors = (): Vendor[] => loadDb().vendors;
export const addVendor = (vendor: Omit<Vendor, 'id'>): Vendor => {
  const db = loadDb();
  const maxId = db.vendors.reduce((max, item) => {
    const num = parseInt(item.id.replace('VB-2026-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextIdNum = maxId + 1;
  const newVendor: Vendor = {
    ...vendor,
    id: `VB-2026-${String(nextIdNum).padStart(3, '0')}`,
  };
  db.vendors.push(newVendor);
  saveDb(db);
  return newVendor;
};
export const updateVendor = (id: string, updates: Partial<Vendor>): Vendor => {
  const db = loadDb();
  const index = db.vendors.findIndex((v) => v.id === id);
  if (index === -1) throw new Error(`Vendor with ID ${id} not found.`);
  const updatedVendor = { ...db.vendors[index], ...updates };
  db.vendors[index] = updatedVendor;
  saveDb(db);
  return updatedVendor;
};
export const deleteVendor = (id: string): boolean => {
  const db = loadDb();
  const index = db.vendors.findIndex((v) => v.id === id);
  if (index === -1) return false;
  db.vendors.splice(index, 1);
  saveDb(db);
  return true;
};

// 2. RFQs
export const getRFQs = (): RFQ[] => loadDb().rfqs;
export const addRFQ = (rfq: Omit<RFQ, 'id' | 'count' | 'created'>): RFQ => {
  const db = loadDb();
  const maxId = db.rfqs.reduce((max, item) => {
    const num = parseInt(item.id.replace('RFQ-2026-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextIdNum = maxId + 1;
  const newRFQ: RFQ = {
    ...rfq,
    id: `RFQ-2026-${String(nextIdNum).padStart(3, '0')}`,
    count: 0,
    created: new Date().toISOString().split('T')[0],
  };
  db.rfqs.push(newRFQ);
  saveDb(db);
  return newRFQ;
};
export const updateRFQ = (id: string, updates: Partial<RFQ>): RFQ => {
  const db = loadDb();
  const index = db.rfqs.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(`RFQ with ID ${id} not found.`);
  const updatedRFQ = { ...db.rfqs[index], ...updates };
  db.rfqs[index] = updatedRFQ;
  saveDb(db);
  return updatedRFQ;
};
export const deleteRFQ = (id: string): boolean => {
  const db = loadDb();
  const index = db.rfqs.findIndex((r) => r.id === id);
  if (index === -1) return false;
  db.rfqs.splice(index, 1);
  
  // Also delete associated quotations
  db.quotations = db.quotations.filter(q => q.rfqId !== id);
  
  saveDb(db);
  return true;
};

// 3. Quotations
export const getQuotations = (): Quotation[] => loadDb().quotations;
export const addQuotation = (qtn: Omit<Quotation, 'id'>): Quotation => {
  const db = loadDb();
  const maxId = db.quotations.reduce((max, item) => {
    const num = parseInt(item.id.replace('QTN-2026-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextIdNum = maxId + 1;
  const newQtn: Quotation = {
    ...qtn,
    id: `QTN-2026-${String(nextIdNum).padStart(3, '0')}`,
  };
  db.quotations.push(newQtn);
  
  // Increment RFQ bid count
  const rfqIndex = db.rfqs.findIndex(r => r.id === qtn.rfqId);
  if (rfqIndex !== -1) {
    db.rfqs[rfqIndex].count += 1;
  }

  saveDb(db);
  return newQtn;
};
export const updateQuotation = (id: string, updates: Partial<Quotation>): Quotation => {
  const db = loadDb();
  const index = db.quotations.findIndex((q) => q.id === id);
  if (index === -1) throw new Error(`Quotation with ID ${id} not found.`);
  const updatedQtn = { ...db.quotations[index], ...updates };
  db.quotations[index] = updatedQtn;
  saveDb(db);
  return updatedQtn;
};

// 4. Purchase Orders
export const getPurchaseOrders = (): PurchaseOrder[] => loadDb().purchaseOrders;
export const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id' | 'issued'>): PurchaseOrder => {
  const db = loadDb();
  const maxId = db.purchaseOrders.reduce((max, item) => {
    const num = parseInt(item.id.replace('PO-2026-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextIdNum = maxId + 1;
  const newPO: PurchaseOrder = {
    ...po,
    id: `PO-2026-${String(nextIdNum).padStart(3, '0')}`,
    issued: new Date().toISOString().split('T')[0],
  };
  db.purchaseOrders.push(newPO);
  saveDb(db);
  return newPO;
};
export const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>): PurchaseOrder => {
  const db = loadDb();
  const index = db.purchaseOrders.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(`PO with ID ${id} not found.`);
  const updatedPO = { ...db.purchaseOrders[index], ...updates };
  db.purchaseOrders[index] = updatedPO;
  saveDb(db);
  return updatedPO;
};

// 5. Invoices
export const getInvoices = (): Invoice[] => loadDb().invoices;
export const addInvoice = (invoice: Omit<Invoice, 'id' | 'date'>): Invoice => {
  const db = loadDb();
  const maxId = db.invoices.reduce((max, item) => {
    const num = parseInt(item.id.replace('INV-2026-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextIdNum = maxId + 1;
  const newInvoice: Invoice = {
    ...invoice,
    id: `INV-2026-${String(nextIdNum).padStart(4, '0')}`,
    date: new Date().toISOString().split('T')[0],
  };
  db.invoices.push(newInvoice);
  saveDb(db);
  return newInvoice;
};
export const updateInvoice = (id: string, updates: Partial<Invoice>): Invoice => {
  const db = loadDb();
  const index = db.invoices.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(`Invoice with ID ${id} not found.`);
  const updatedInvoice = { ...db.invoices[index], ...updates };
  db.invoices[index] = updatedInvoice;
  saveDb(db);
  return updatedInvoice;
};

// 6. Activity Logs
export const getActivityLogs = (): ActivityLog[] => loadDb().activityLogs;
export const addActivityLog = (log: Omit<ActivityLog, 'id' | 'time'>): ActivityLog => {
  const db = loadDb();
  const maxId = db.activityLogs.reduce((max, item) => {
    const num = parseInt(item.id.replace('LOG-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 44900);
  const nextIdNum = maxId + 1;
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const newLog: ActivityLog = {
    ...log,
    id: `LOG-${nextIdNum}`,
    time: timeStr,
  };
  // Add to the front of logs list for recent display
  db.activityLogs.unshift(newLog);
  saveDb(db);
  return newLog;
};

// 7. Approvals
export const getApprovals = (): ApprovalItem[] => loadDb().approvals;
export const addApproval = (approval: Omit<ApprovalItem, 'id' | 'date' | 'status'>): ApprovalItem => {
  const db = loadDb();
  const maxId = db.approvals.reduce((max, item) => {
    const num = parseInt(item.id.replace('APR-2026-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextIdNum = maxId + 1;
  const newApproval: ApprovalItem = {
    ...approval,
    id: `APR-2026-${String(nextIdNum).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: 'Pending',
  };
  db.approvals.push(newApproval);
  saveDb(db);
  return newApproval;
};
export const updateApproval = (id: string, updates: Partial<ApprovalItem>): ApprovalItem => {
  const db = loadDb();
  const index = db.approvals.findIndex((a) => a.id === id);
  if (index === -1) throw new Error(`Approval Item with ID ${id} not found.`);
  const updatedApproval = { ...db.approvals[index], ...updates };
  db.approvals[index] = updatedApproval;
  saveDb(db);
  return updatedApproval;
};

// --- Custom Hooks for Reactive Components ---

function useDbData<T>(fetchFn: () => T): T {
  const [data, setData] = useState<T>(fetchFn);

  useEffect(() => {
    const handleUpdate = () => {
      setData(fetchFn());
    };
    window.addEventListener(DB_UPDATE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(DB_UPDATE_EVENT, handleUpdate);
    };
  }, [fetchFn]);

  return data;
}

export const useVendors = () => useDbData(getVendors);
export const useRFQs = () => useDbData(getRFQs);
export const useQuotations = () => useDbData(getQuotations);
export const usePurchaseOrders = () => useDbData(getPurchaseOrders);
export const useInvoices = () => useDbData(getInvoices);
export const useActivityLogs = () => useDbData(getActivityLogs);
export const useApprovals = () => useDbData(getApprovals);
