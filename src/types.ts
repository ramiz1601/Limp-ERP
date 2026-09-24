export type VehiclePlateType = 'Limo' | 'Private';

export type VehicleOwnership = 'Company Owned' | 'Driver Financed';

export type VehicleStatus =
  | 'Available'
  | 'On Rent'
  | 'Assigned'
  | 'Maintenance'
  | 'Accident'
  | 'Inactive'
  | 'Sold'
  | 'Reserved';

export interface Vehicle {
  id: string;
  plate: string;
  plateType: VehiclePlateType;
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  currentMileage: number;
  fuelType: string;
  ownership: VehicleOwnership;
  status: VehicleStatus;
  currentDriverId?: string;
  currentDriverName?: string;
  purchasePrice?: number;
  istimaraExpiry?: string;
  insuranceExpiry?: string;
  insurancePolicyNumber?: string;
  insuranceCompany?: string;
  dailyRent?: number;
  monthlyRent?: number;
  istimaraFileUrl?: string;
  insuranceFileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DriverType = 'Company Driver' | 'Outside/NOC Driver';

export type DriverStatus = 'Active' | 'Inactive' | 'Blocked';

export interface DriverDocumentAttachment {
  id: string;
  name: string;
  type:
    | 'QID'
    | 'Driving License'
    | 'NOC'
    | 'Passport'
    | 'Contract'
    | 'Medical'
    | 'Police Clearance'
    | 'Visa'
    | 'Other';
  number?: string;
  expiry?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface Driver {
  id: string;
  driverIdCode?: string;
  name: string;
  driverType: DriverType;
  mobile: string;
  qid: string;
  qidExpiry: string;
  drivingLicense: string;
  drivingLicenseExpiry: string;
  noc: string;
  nocExpiry: string;
  passport?: string;
  passportExpiry?: string;
  status: DriverStatus;
  documentUrl?: string;
  documentsList?: DriverDocumentAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  type: string;
  startDate: string;
  endDate?: string;
  startMileage: number;
  endMileage?: number;
  rent: number;
  status: 'Active' | 'Completed';
  lastRentPaidDate?: string;
  lastRentPaidMonth?: string;
  totalRentPaid?: number;
  createdAt?: string;
}

export interface HandoverRecord {
  id: string;
  type: 'Handover' | 'Return';
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  assignmentId?: string;
  contractId?: string;
  date: string;
  mileage: number;
  fuelLevel: string;
  condition?: string;
  penalty?: number;
  penaltyReason?: string;
  newDamage?: string;
  istimaraCard?: boolean;
  spareTyre?: boolean;
  jackTools?: boolean;
  acCooling?: boolean;
  cleanliness?: string;
  inspectorName?: string;
  inspector?: string;
  notes?: string;
  scratches?: string[];
  createdAt?: string;
}

export type ContractStatus = 'Active' | 'Completed' | 'Terminated' | 'Pending';

export interface Contract {
  id: string;
  contractNo: string;
  startDate: string;
  endDate: string;
  driverId: string;
  driverName: string;
  driverQid: string;
  driverMobile: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  currentMileage: number;
  monthlyAmount: number;
  securityDeposit: number;
  status: 'Active' | 'Completed' | 'Terminated' | 'Pending';
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentType =
  | 'Vehicle Rent'
  | 'Rent'
  | 'Security Deposit'
  | 'Installment'
  | 'Fine / Violation'
  | 'Maintenance Charge'
  | 'Other Income'
  | 'Other';
export type PaymentMethod = 'Bank Transfer' | 'Cash' | 'Card' | 'Cheque' | 'Other';

export interface Payment {
  id: string;
  date: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
  status: 'Completed' | 'Pending';
  contractId?: string;
  installmentId?: string;
  assignmentId?: string;
  monthYear?: string;
  reference?: string;
  notes?: string;
  createdAt?: string;
}

export type FinancingRecord = Financing;

export interface Financing {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  vehiclePrice?: number;
  downPayment: number;
  financedAmount: number;
  monthlyInstallment: number;
  numberOfInstallments: number;
  startDate: string;
  status: 'Active' | 'Completed' | 'Overdue';
  createdAt?: string;
}

export type InstallmentStatus = 'Paid' | 'Overdue' | 'Partially Paid' | 'Upcoming';

export interface Installment {
  id: string;
  financingId: string;
  installmentNumber: number;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  dueDate: string;
  amount: number;
  paid: number;
  remaining: number;
  status: InstallmentStatus;
  createdAt?: string;
}

export type IncomeCategory =
  | 'Vehicle Rent'
  | 'Rental'
  | 'Driver Installments'
  | 'Financing'
  | 'Security Deposit'
  | 'Penalty'
  | 'Fine Recovery'
  | 'Other Income'
  | 'Other'
  | string;

export type IncomeRecord = Income;

export interface Income {
  id: string;
  date: string;
  category: IncomeCategory;
  amount: number;
  paymentMethod?: PaymentMethod;
  vehicleId?: string;
  vehiclePlate?: string;
  driverId?: string;
  driverName?: string;
  description?: string;
  notes?: string;
  referenceId?: string;
  createdAt?: string;
}

export type ExpenseCategory =
  | 'Vehicle Maintenance'
  | 'Maintenance'
  | 'Vehicle Repairs'
  | 'Fuel'
  | 'Insurance'
  | 'Istimara/Registration'
  | 'Salik/Tolls'
  | 'Staff/Payroll'
  | 'Salaries'
  | 'Office Rent'
  | 'Office/General'
  | 'Utilities'
  | 'Fines'
  | 'Car Wash'
  | 'Parts'
  | 'Administrative Expenses'
  | 'Other Expenses'
  | 'Other'
  | string;

export type ExpenseRecord = Expense;

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod?: PaymentMethod;
  vehicleId?: string;
  vehiclePlate?: string;
  driverId?: string;
  driverName?: string;
  employeeId?: string;
  employeeName?: string;
  vendor?: string;
  monthYear?: string;
  description?: string;
  notes?: string;
  createdAt?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  mileage: number;
  type: string;
  garage: string;
  cost: number;
  status: 'Completed' | 'In Progress' | 'Scheduled' | string;
  next?: string;
  description?: string;
  notes?: string;
  createdAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  position?: string;
  designation?: string;
  department: string;
  mobile: string;
  qid?: string;
  qidExpiry: string;
  salary: number;
  status: 'Active' | 'On Leave' | 'Terminated' | string;
  createdAt?: string;
}

export type DocumentStatus = 'Expired' | 'Expiring' | 'Valid';

export interface DocumentRecord {
  id: string;
  type: string;
  entity: string;
  entityId?: string;
  number: string;
  expiry: string;
  fileUrl?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  date: string;
  user: string;
  action: string;
  reference: string;
  entity?: string;
  createdAt?: string;
}

export interface SystemSettings {
  companyName?: string;
  companySubtitle?: string;
  companyLogoUrl?: string;
  companyPhone?: string;
  address?: string;
  currency: string;
  timezone: string;
  warning1Days: number;
  warning2Days: number;
  warning3Days?: number;
  documentExpiryWarningDays?: number;
  paymentMethods?: string[];
  securityLoginName?: string;
  securityCode?: string;
  requireSecurityLogin?: boolean;
}
