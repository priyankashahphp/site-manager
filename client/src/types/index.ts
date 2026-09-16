export type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_ENGINEER"
  | "SITE_SUPERVISOR"
  | "STORE_MANAGER"
  | "ACCOUNTANT"
  | "PURCHASE_MANAGER"
  | "VENDOR"
  | "CONTRACTOR"
  | "LABOR";

export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  company?: { id: string; name: string };
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: ProjectStatus;
  projectManagerId?: string | null;
  projectManager?: { id: string; name: string } | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: string | number | null;
  address?: string | null;
  createdAt: string;
  _count?: { sites: number };
}

export interface Site {
  id: string;
  projectId: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  _count?: { buildings: number };
  buildings?: Building[];
}

export interface Building {
  id: string;
  siteId: string;
  name: string;
  floors?: Floor[];
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  levelOrder: number;
  units?: Unit[];
}

export interface Unit {
  id: string;
  floorId: string;
  name: string;
  areaSqft?: number | null;
  unitType?: string | null;
  status: string;
}

export type WorkPackageStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
export type RequirementStatus = "PLANNED" | "ALLOCATED" | "FULFILLED";
export type MaterialRequirementStatus = "PLANNED" | "ORDERED" | "PARTIALLY_FULFILLED" | "FULFILLED";

export interface ProjectRequirement {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  createdAt: string;
}

export interface WorkPackage {
  id: string;
  projectId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status: WorkPackageStatus;
  createdAt: string;
  _count?: {
    activities: number;
    boqItems: number;
    materialRequirements: number;
    laborRequirements: number;
    equipmentRequirements: number;
  };
  activities?: Activity[];
  boqItems?: BoqItem[];
  materialRequirements?: MaterialRequirement[];
  laborRequirements?: LaborRequirement[];
  equipmentRequirements?: EquipmentRequirement[];
}

export interface Activity {
  id: string;
  workPackageId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status: WorkPackageStatus;
  percentComplete: number;
}

export interface BoqItem {
  id: string;
  workPackageId: string;
  itemCode?: string | null;
  description: string;
  unit: string;
  quantity: number;
  rate: string | number;
}

export interface MaterialRequirement {
  id: string;
  workPackageId: string;
  materialId?: string | null;
  materialName: string;
  unit: string;
  quantity: number;
  neededBy?: string | null;
  status: MaterialRequirementStatus;
}

export interface LaborRequirement {
  id: string;
  workPackageId: string;
  skill: string;
  headcount: number;
  fromDate?: string | null;
  toDate?: string | null;
  status: RequirementStatus;
}

export interface EquipmentRequirement {
  id: string;
  workPackageId: string;
  equipmentType: string;
  count: number;
  fromDate?: string | null;
  toDate?: string | null;
  status: RequirementStatus;
}

// ---- Vendor Management -----------------------------------------------------

export type QuotationStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type PoStatus = "DRAFT" | "SENT" | "ACKNOWLEDGED" | "FULFILLED" | "CANCELLED";
export type BillStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface Vendor {
  id: string;
  name: string;
  category?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  createdAt: string;
  _count?: { purchaseOrders: number; bills: number };
  quotations?: VendorQuotation[];
  contracts?: VendorContract[];
  purchaseOrders?: PurchaseOrder[];
  bills?: VendorBill[];
}

export interface VendorQuotation {
  id: string;
  vendorId: string;
  title: string;
  amount: string | number;
  status: QuotationStatus;
  createdAt: string;
}

export interface VendorContract {
  id: string;
  vendorId: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  value?: string | number | null;
}

export interface PurchaseOrder {
  id: string;
  projectId: string;
  vendorId: string;
  vendor?: { id: string; name: string };
  poNumber: string;
  status: PoStatus;
  totalAmount: string | number;
  createdAt: string;
  bills?: VendorBill[];
}

export interface VendorBill {
  id: string;
  vendorId: string;
  purchaseOrderId?: string | null;
  billNumber: string;
  amount: string | number;
  status: BillStatus;
  createdAt: string;
  payments?: VendorPayment[];
}

export interface VendorPayment {
  id: string;
  billId: string;
  amount: string | number;
  paidAt: string;
  method?: string | null;
}

// ---- Material / Stock -----------------------------------------------------

export type StockMovementType = "INWARD" | "OUTWARD" | "TRANSFER" | "ADJUSTMENT" | "CONSUMPTION";

export interface MaterialCategory {
  id: string;
  name: string;
  _count?: { materials: number };
}

export interface Material {
  id: string;
  categoryId: string;
  category?: { id: string; name: string };
  name: string;
  unit: string;
  reorderLevel: number;
  balance?: number;
  lowStock?: boolean;
}

export interface StockBalanceRow {
  materialId: string;
  name: string;
  unit: string;
  category: string;
  reorderLevel: number;
  balance: number;
  lowStock: boolean;
}

export interface StockMovement {
  id: string;
  siteId: string;
  materialId: string;
  material?: { id: string; name: string; unit: string };
  type: StockMovementType;
  quantity: number;
  rate?: string | number | null;
  note?: string | null;
  createdAt: string;
}

// ---- Labor Management -------------------------------------------------------

export type LaborPaymentType = "WAGE" | "ADVANCE" | "OVERTIME";

export interface Contractor {
  id: string;
  name: string;
  phone?: string | null;
  _count?: { laborGroups: number };
}

export interface LaborGroup {
  id: string;
  name: string;
  contractorId?: string | null;
  contractor?: { id: string; name: string } | null;
  _count?: { laborers: number };
}

export interface Labor {
  id: string;
  name: string;
  phone?: string | null;
  dailyWage: string | number;
  skill?: string | null;
  laborGroupId?: string | null;
  laborGroup?: { id: string; name: string } | null;
  payments?: LaborPayment[];
  attendance?: Attendance[];
}

export interface Attendance {
  id: string;
  laborId: string;
  siteId: string;
  date: string;
  present: boolean;
  overtimeHours: number;
  labor?: { id: string; name: string; skill?: string | null; dailyWage?: string | number };
}

export interface LaborPayment {
  id: string;
  laborId: string;
  amount: string | number;
  type: LaborPaymentType;
  paidAt: string;
}

// ---- Site Work --------------------------------------------------------------

export interface DailySiteDiary {
  id: string;
  siteId: string;
  date: string;
  weather?: string | null;
  notes?: string | null;
  createdBy?: { id: string; name: string };
  progress?: DailyProgressEntry[];
  _count?: { progress: number };
}

export interface DailyProgressEntry {
  id: string;
  diaryId: string;
  activityId?: string | null;
  activity?: { id: string; name: string } | null;
  description: string;
  percentComplete: number;
}

export interface SitePhoto {
  id: string;
  siteId: string;
  url: string;
  caption?: string | null;
  takenAt: string;
}

export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface SiteIssue {
  id: string;
  siteId: string;
  title: string;
  description?: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  createdAt: string;
}

export interface SiteDayView {
  date: string;
  diary: DailySiteDiary | null;
  attendance: Attendance[];
  materialConsumed: StockMovement[];
  equipmentUsage: EquipmentUsage[];
  photos: SitePhoto[];
  openIssues: SiteIssue[];
}

// ---- Equipment ----------------------------------------------------------

export type EquipmentOwnership = "OWNED" | "RENTED";

export interface Equipment {
  id: string;
  name: string;
  type?: string | null;
  ownership: EquipmentOwnership;
  _count?: { usage: number; maintenance: number };
  usage?: EquipmentUsage[];
  maintenance?: EquipmentMaintenance[];
}

export interface EquipmentUsage {
  id: string;
  equipmentId: string;
  siteId: string;
  equipment?: { id: string; name: string; ownership?: EquipmentOwnership };
  site?: { id: string; name: string };
  date: string;
  hoursUsed: number;
  fuelUsed?: number | null;
  rentalCost?: string | number | null;
}

export interface EquipmentMaintenance {
  id: string;
  equipmentId: string;
  date: string;
  description: string;
  cost?: string | number | null;
}

// ---- Finance ------------------------------------------------------------

export type ExpenseCategory = "PURCHASE" | "LABOR" | "VENDOR_PAYMENT" | "PETTY_CASH" | "ADVANCE" | "OTHER";

export interface Expense {
  id: string;
  projectId: string;
  category: ExpenseCategory;
  amount: string | number;
  note?: string | null;
  incurredAt: string;
}

export interface BudgetLineRow {
  id: string;
  category: string;
  plannedAmount: string | number;
  actualAmount: number;
  variance: number;
}

export interface ProjectFinanceSummary {
  projectId: string;
  projectName: string;
  budget: number | null;
  totalSpent: number;
  variance: number | null;
  percentUsed: number | null;
  byCategory: Record<string, number>;
}

export interface PortfolioFinanceRow {
  projectId: string;
  projectName: string;
  projectCode: string;
  status: ProjectStatus;
  budget: number | null;
  totalSpent: number;
  variance: number | null;
}
