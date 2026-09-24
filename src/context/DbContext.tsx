import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, cleanFirestoreData } from '../firebase';
import {
  Vehicle,
  Driver,
  Assignment,
  HandoverRecord,
  Contract,
  Payment,
  Financing,
  Installment,
  Income,
  Expense,
  MaintenanceRecord,
  Employee,
  DocumentRecord,
  AuditLog,
  SystemSettings,
} from '../types';
import { DEMO_VEHICLES, DEMO_DRIVERS, DEMO_EMPLOYEES } from '../data/seedData';
import { useAuth } from './AuthContext';

interface DbContextType {
  vehicles: Vehicle[];
  drivers: Driver[];
  assignments: Assignment[];
  handovers: HandoverRecord[];
  contracts: Contract[];
  payments: Payment[];
  financing: Financing[];
  installments: Installment[];
  income: Income[];
  expenses: Expense[];
  maintenance: MaintenanceRecord[];
  employees: Employee[];
  documents: DocumentRecord[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  loading: boolean;
  error: string | null;

  // CRUD actions
  addVehicle: (data: Omit<Vehicle, 'id'>) => Promise<string>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  addDriver: (data: Omit<Driver, 'id'>) => Promise<string>;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  addAssignment: (data: Omit<Assignment, 'id'>) => Promise<string>;
  updateAssignment: (id: string, data: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;

  addHandover: (data: Omit<HandoverRecord, 'id'>) => Promise<string>;
  deleteHandover: (id: string) => Promise<void>;

  addContract: (data: Omit<Contract, 'id'>) => Promise<string>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;

  addPayment: (data: Omit<Payment, 'id'>) => Promise<string>;
  deletePayment: (id: string) => Promise<void>;

  addFinancing: (data: Omit<Financing, 'id'>) => Promise<string | undefined>;
  deleteFinancing: (id: string) => Promise<void>;
  payInstallment: (installmentId: string, paidAmount: number, method: string) => Promise<void>;
  addInstallment: (data: Omit<Installment, 'id'>) => Promise<string | undefined>;
  updateInstallment: (id: string, data: Partial<Installment>) => Promise<void>;
  deleteInstallment: (id: string) => Promise<void>;

  addIncome: (data: Omit<Income, 'id'>) => Promise<string>;
  deleteIncome: (id: string) => Promise<void>;
  addIncomeRecord: (data: Omit<Income, 'id'>) => Promise<string>;
  deleteIncomeRecord: (id: string) => Promise<void>;

  addExpense: (data: Omit<Expense, 'id'>) => Promise<string>;
  deleteExpense: (id: string) => Promise<void>;
  addExpenseRecord: (data: Omit<Expense, 'id'>) => Promise<string>;
  deleteExpenseRecord: (id: string) => Promise<void>;

  addMaintenance: (data: Omit<MaintenanceRecord, 'id'>) => Promise<string>;
  updateMaintenance: (id: string, data: Partial<MaintenanceRecord>) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;

  addEmployee: (data: Omit<Employee, 'id'>) => Promise<string>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  addDocumentRecord: (data: Omit<DocumentRecord, 'id'>) => Promise<string>;
  deleteDocumentRecord: (id: string) => Promise<void>;

  updateSettings: (data: Partial<SystemSettings>) => Promise<void>;
  logAudit: (action: string, reference: string) => Promise<void>;

  seedDemoData: () => Promise<void>;
  seedDefaultEmployees: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
  companyName: 'Prince Limousine & Car Rental',
  companySubtitle: 'Fleet & Mobility ERP',
  companyLogoUrl: '/prince-logo.png',
  companyPhone: '70543888',
  address: 'Doha, State of Qatar',
  currency: 'QAR',
  timezone: 'Asia/Qatar',
  warning1Days: 30,
  warning2Days: 14,
  warning3Days: 7,
  documentExpiryWarningDays: 30,
  paymentMethods: ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other'],
  securityLoginName: 'admin',
  securityCode: '7054',
  requireSecurityLogin: true,
};

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [financing, setFinancing] = useState<Financing[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubs: (() => void)[] = [];

    // Helper for collections
    const bindCollection = <T extends { id?: string }>(
      colName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      try {
        const unsubscribe = onSnapshot(
          collection(db, colName),
          (snapshot) => {
            const list: T[] = [];
            const seenIds = new Set<string>();
            snapshot.forEach((docSnap) => {
              if (!seenIds.has(docSnap.id)) {
                seenIds.add(docSnap.id);
                list.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
              }
            });
            setter(list);
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, colName);
          }
        );
        unsubs.push(unsubscribe);
      } catch (err) {
        console.error(`Error binding ${colName}:`, err);
      }
    };

    bindCollection<Vehicle>('vehicles', setVehicles);
    bindCollection<Driver>('drivers', setDrivers);
    bindCollection<Assignment>('assignments', setAssignments);
    bindCollection<HandoverRecord>('handovers', setHandovers);
    bindCollection<Contract>('contracts', setContracts);
    bindCollection<Payment>('payments', setPayments);
    bindCollection<Financing>('financing', setFinancing);
    bindCollection<Installment>('installments', setInstallments);
    bindCollection<Income>('income', setIncome);
    bindCollection<Expense>('expenses', setExpenses);
    bindCollection<MaintenanceRecord>('maintenance', setMaintenance);
    bindCollection<Employee>('employees', setEmployees);
    bindCollection<DocumentRecord>('documents', setDocuments);
    bindCollection<AuditLog>('auditLogs', setAuditLogs);

    // Settings
    try {
      const unsubSettings = onSnapshot(
        doc(db, 'settings', 'global'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<SystemSettings>;
            const companyName =
              !data.companyName || data.companyName === 'Qatar Limo' || data.companyName === 'FleetERP'
                ? 'Prince Limousine & Car Rental'
                : data.companyName;
            const companySubtitle = data.companySubtitle || 'Fleet & Mobility ERP';
            const companyLogoUrl =
              data.companyLogoUrl || '/prince-logo.svg';

            setSettings({
              ...defaultSettings,
              ...data,
              companyName,
              companySubtitle,
              companyLogoUrl,
            } as SystemSettings);
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, 'settings/global');
        }
      );
      unsubs.push(unsubSettings);
    } catch (err) {
      console.error('Error binding settings:', err);
    }

    setLoading(false);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Audit Logging
  const logAudit = async (action: string, reference: string) => {
    try {
      const userStr = currentUser?.displayName || currentUser?.email || 'Admin';
      await addDoc(collection(db, 'auditLogs'), {
        date: new Date().toISOString(),
        user: userStr,
        action,
        reference,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not write audit log:', err);
    }
  };

  // Vehicles
  const addVehicle = async (data: Omit<Vehicle, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'vehicles'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      await logAudit('Created vehicle', `${data.make} ${data.model} (${data.plate})`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'vehicles');
    }
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    try {
      await updateDoc(doc(db, 'vehicles', id), cleanFirestoreData({
        ...data,
        updatedAt: new Date().toISOString(),
      }));
      await logAudit('Updated vehicle', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`);
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id));
      await logAudit('Deleted vehicle', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vehicles/${id}`);
    }
  };

  // Drivers
  const addDriver = async (data: Omit<Driver, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'drivers'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      // Also register document expiries in documents collection if present
      if (data.qid && data.qidExpiry) {
        await addDoc(collection(db, 'documents'), cleanFirestoreData({
          type: 'QID',
          entity: 'Driver',
          entityId: docRef.id,
          number: data.qid,
          expiry: data.qidExpiry,
          createdAt: new Date().toISOString(),
        }));
      }
      if (data.drivingLicense && data.drivingLicenseExpiry) {
        await addDoc(collection(db, 'documents'), cleanFirestoreData({
          type: 'Driving License',
          entity: 'Driver',
          entityId: docRef.id,
          number: data.drivingLicense,
          expiry: data.drivingLicenseExpiry,
          createdAt: new Date().toISOString(),
        }));
      }
      if (data.noc && data.nocExpiry) {
        await addDoc(collection(db, 'documents'), cleanFirestoreData({
          type: 'NOC',
          entity: 'Driver',
          entityId: docRef.id,
          number: data.noc,
          expiry: data.nocExpiry,
          createdAt: new Date().toISOString(),
        }));
      }
      if (data.passport && data.passportExpiry) {
        await addDoc(collection(db, 'documents'), cleanFirestoreData({
          type: 'Passport',
          entity: 'Driver',
          entityId: docRef.id,
          number: data.passport,
          expiry: data.passportExpiry,
          createdAt: new Date().toISOString(),
        }));
      }

      // Also register any attached files in the documents collection
      if (data.documentsList && data.documentsList.length > 0) {
        for (const docItem of data.documentsList) {
          if (docItem.fileUrl) {
            await addDoc(collection(db, 'documents'), cleanFirestoreData({
              type: docItem.type,
              entity: 'Driver',
              entityId: docRef.id,
              number: docItem.number || data.qid || '',
              expiry: docItem.expiry || '',
              fileUrl: docItem.fileUrl,
              createdAt: new Date().toISOString(),
            }));
          }
        }
      }
      await logAudit('Created driver', `${data.name} (QID: ${data.qid})`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'drivers');
    }
  };

  const updateDriver = async (id: string, data: Partial<Driver>) => {
    try {
      await updateDoc(doc(db, 'drivers', id), cleanFirestoreData({
        ...data,
        updatedAt: new Date().toISOString(),
      }));
      await logAudit('Updated driver', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `drivers/${id}`);
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'drivers', id));
      await logAudit('Deleted driver', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `drivers/${id}`);
    }
  };

  // Assignments
  const addAssignment = async (data: Omit<Assignment, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'assignments'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
      }));
      const newAsg = { id: docRef.id, ...data, createdAt: new Date().toISOString() } as Assignment;
      setAssignments((prev) => [newAsg, ...prev.filter((a) => a.id !== newAsg.id)]);
      // Update vehicle status to On Rent and assign driver
      await updateDoc(doc(db, 'vehicles', data.vehicleId), cleanFirestoreData({
        status: 'On Rent',
        currentDriverId: data.driverId,
        currentDriverName: data.driverName,
        updatedAt: new Date().toISOString(),
      }));
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.vehicleId
            ? { ...v, status: 'On Rent', currentDriverId: data.driverId, currentDriverName: data.driverName }
            : v
        )
      );
      await logAudit(
        'Vehicle assignment',
        `Assigned ${data.vehiclePlate} to ${data.driverName}`
      );
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'assignments');
    }
  };

  const updateAssignment = async (id: string, data: Partial<Assignment>) => {
    try {
      setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
      await updateDoc(doc(db, 'assignments', id), cleanFirestoreData(data));
      await logAudit('Updated assignment', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `assignments/${id}`);
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      await deleteDoc(doc(db, 'assignments', id));
      await logAudit('Deleted assignment', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `assignments/${id}`);
    }
  };

  // Handover / Return
  const addHandover = async (data: Omit<HandoverRecord, 'id'>) => {
    try {
      const cleanedData = cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
      });
      const docRef = await addDoc(collection(db, 'handovers'), cleanedData);

      // If it's a Return, update vehicle status and update assignment status if linked
      if (data.type === 'Return') {
        await updateDoc(doc(db, 'vehicles', data.vehicleId), cleanFirestoreData({
          status: 'Available',
          currentDriverId: '',
          currentDriverName: '',
          currentMileage: data.mileage,
          updatedAt: new Date().toISOString(),
        }));

        if (data.assignmentId && data.assignmentId.trim() !== '') {
          await updateDoc(doc(db, 'assignments', data.assignmentId), cleanFirestoreData({
            status: 'Completed',
            endDate: data.date,
            endMileage: data.mileage,
          }));
        } else {
          // If no specific assignmentId passed, complete any active assignment for this vehicle
          const activeAsg = assignments.find(
            (a) => a.vehicleId === data.vehicleId && a.status === 'Active'
          );
          if (activeAsg) {
            await updateDoc(doc(db, 'assignments', activeAsg.id), cleanFirestoreData({
              status: 'Completed',
              endDate: data.date,
              endMileage: data.mileage,
            }));
          }
        }

        // If penalty exists, record income
        if (data.penalty && data.penalty > 0) {
          await addDoc(collection(db, 'income'), cleanFirestoreData({
            date: data.date,
            category: 'Penalty',
            amount: data.penalty,
            paymentMethod: 'Cash',
            vehicleId: data.vehicleId,
            vehiclePlate: data.vehiclePlate,
            driverId: data.driverId,
            driverName: data.driverName,
            description: `Vehicle return penalty for ${data.vehiclePlate}${
              data.penaltyReason ? ` (${data.penaltyReason})` : ''
            }`,
            createdAt: new Date().toISOString(),
          }));
        }
        await logAudit(
          'Vehicle return',
          `Vehicle ${data.vehiclePlate} returned by ${data.driverName}`
        );
      } else {
        // Handover
        await updateDoc(doc(db, 'vehicles', data.vehicleId), cleanFirestoreData({
          status: 'On Rent',
          currentDriverId: data.driverId,
          currentDriverName: data.driverName,
          currentMileage: data.mileage,
          updatedAt: new Date().toISOString(),
        }));

        // Ensure an active assignment exists so return/mileage tracking recognizes it
        const existingAsg = assignments.find(
          (a) =>
            a.vehicleId === data.vehicleId &&
            a.driverId === data.driverId &&
            a.status === 'Active'
        );
        if (!existingAsg) {
          await addDoc(collection(db, 'assignments'), cleanFirestoreData({
            vehicleId: data.vehicleId,
            vehiclePlate: data.vehiclePlate,
            driverId: data.driverId,
            driverName: data.driverName,
            type: 'Handover Assignment',
            startDate: data.date,
            startMileage: data.mileage,
            rent: 0,
            status: 'Active',
            createdAt: new Date().toISOString(),
          }));
        }

        await logAudit(
          'Vehicle handover',
          `Vehicle ${data.vehiclePlate} handed over to ${data.driverName}`
        );
      }

      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'handovers');
    }
  };

  const deleteHandover = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'handovers', id));
      await logAudit('Deleted handover record', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `handovers/${id}`);
    }
  };

  // Contracts
  const addContract = async (data: Omit<Contract, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'contracts'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Update vehicle status & mileage
      await updateDoc(doc(db, 'vehicles', data.vehicleId), cleanFirestoreData({
        status: 'On Rent',
        currentDriverId: data.driverId,
        currentDriverName: data.driverName,
        currentMileage: data.currentMileage,
        updatedAt: new Date().toISOString(),
      }));

      // Create linked assignment
      await addDoc(collection(db, 'assignments'), cleanFirestoreData({
        vehicleId: data.vehicleId,
        vehiclePlate: data.vehiclePlate,
        driverId: data.driverId,
        driverName: data.driverName,
        type: 'Rental Contract',
        startDate: data.startDate,
        endDate: data.endDate,
        startMileage: data.currentMileage,
        rent: data.monthlyAmount,
        status: 'Active',
        createdAt: new Date().toISOString(),
      }));

      // If security deposit > 0, record income
      if (data.securityDeposit > 0) {
        await addDoc(collection(db, 'income'), cleanFirestoreData({
          date: data.startDate,
          category: 'Security Deposit',
          amount: data.securityDeposit,
          paymentMethod: 'Cash',
          vehicleId: data.vehicleId,
          vehiclePlate: data.vehiclePlate,
          driverId: data.driverId,
          driverName: data.driverName,
          description: `Security deposit for Contract ${data.contractNo}`,
          referenceId: docRef.id,
          createdAt: new Date().toISOString(),
        }));
      }

      await logAudit(
        'Created contract',
        `Contract ${data.contractNo} for ${data.driverName} (${data.vehiclePlate})`
      );
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'contracts');
    }
  };

  const updateContract = async (id: string, data: Partial<Contract>) => {
    try {
      await updateDoc(doc(db, 'contracts', id), cleanFirestoreData({
        ...data,
        updatedAt: new Date().toISOString(),
      }));
      await logAudit('Updated contract', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `contracts/${id}`);
    }
  };

  const deleteContract = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contracts', id));
      await logAudit('Deleted contract', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `contracts/${id}`);
    }
  };

  // Payments
  const addPayment = async (data: Omit<Payment, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'payments'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
      }));
      const newPayment = {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString(),
      } as Payment;
      setPayments((prev) => [newPayment, ...prev.filter((p) => p.id !== newPayment.id)]);

      // Automatically mirror in Income collection
      let incomeCategory: any = 'Other Income';
      const pType = String(data.type);
      if (pType === 'Vehicle Rent' || pType === 'Rent') incomeCategory = 'Vehicle Rent';
      else if (pType === 'Installment') incomeCategory = 'Driver Installments';
      else if (pType.includes('Fine') || pType.includes('Violation')) incomeCategory = 'Fine Recovery';
      else if (pType.includes('Deposit')) incomeCategory = 'Security Deposit';

      const incomeData = {
        date: data.date,
        category: incomeCategory,
        amount: data.amount,
        paymentMethod: data.method,
        vehicleId: data.vehicleId || '',
        vehiclePlate: data.vehiclePlate || '',
        driverId: data.driverId || '',
        driverName: data.driverName || '',
        description: `Payment [${data.type}] received from ${data.driverName || 'Driver'}`,
        referenceId: docRef.id,
        createdAt: new Date().toISOString(),
      };
      const incRef = await addDoc(collection(db, 'income'), cleanFirestoreData(incomeData));
      setIncome((prev) => [{ id: incRef.id, ...incomeData } as Income, ...prev.filter((i) => i.id !== incRef.id)]);

      await logAudit(
        'Recorded payment',
        `QAR ${data.amount} from ${data.driverName} (${data.type})`
      );
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'payments');
    }
  };

  const deletePayment = async (id: string) => {
    try {
      setPayments((prev) => prev.filter((p) => p.id !== id));
      await deleteDoc(doc(db, 'payments', id));
      await logAudit('Deleted payment', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `payments/${id}`);
    }
  };

  // Financing
  const addFinancing = async (data: Omit<Financing, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'financing'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
      }));

      // Generate individual installment schedule
      const count = data.numberOfInstallments;
      const startDate = new Date(data.startDate);

      for (let i = 1; i <= count; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        await addDoc(collection(db, 'installments'), cleanFirestoreData({
          financingId: docRef.id,
          installmentNumber: i,
          vehicleId: data.vehicleId,
          vehiclePlate: data.vehiclePlate,
          driverId: data.driverId,
          driverName: data.driverName,
          dueDate: dueDate.toISOString().split('T')[0],
          amount: data.monthlyInstallment,
          paid: 0,
          remaining: data.monthlyInstallment,
          status: 'Upcoming',
          createdAt: new Date().toISOString(),
        }));
      }

      await logAudit(
        'Recorded financing',
        `Financing for ${data.vehiclePlate} (${count} installments)`
      );
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'financing');
    }
  };

  const deleteFinancing = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'financing', id));
      // Cascade delete child installments to avoid orphaned schedules
      const childInsts = installments.filter((i) => i.financingId === id);
      for (const inst of childInsts) {
        try {
          await deleteDoc(doc(db, 'installments', inst.id));
        } catch (subErr) {
          console.warn('Could not delete child installment:', inst.id, subErr);
        }
      }
      await logAudit('Deleted financing plan', `Financing ID: ${id} and associated installments`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `financing/${id}`);
    }
  };

  const addInstallment = async (data: Omit<Installment, 'id'>) => {
    try {
      const docRef = await addDoc(
        collection(db, 'installments'),
        cleanFirestoreData({
          ...data,
          createdAt: new Date().toISOString(),
        })
      );
      await logAudit(
        'Created installment',
        `Installment #${data.installmentNumber} for ${data.vehiclePlate}`
      );
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'installments');
    }
  };

  const updateInstallment = async (id: string, data: Partial<Installment>) => {
    try {
      await updateDoc(doc(db, 'installments', id), cleanFirestoreData(data));
      await logAudit('Updated installment', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `installments/${id}`);
    }
  };

  const deleteInstallment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'installments', id));
      await logAudit('Deleted installment', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `installments/${id}`);
    }
  };

  const payInstallment = async (
    installmentId: string,
    paidAmount: number,
    method: string
  ) => {
    try {
      const inst = installments.find((i) => i.id === installmentId);
      if (!inst) throw new Error('Installment not found');

      const newPaid = inst.paid + paidAmount;
      const newRemaining = Math.max(0, inst.amount - newPaid);
      const newStatus = newRemaining === 0 ? 'Paid' : 'Partially Paid';

      setInstallments((prev) =>
        prev.map((i) =>
          i.id === installmentId
            ? { ...i, paid: newPaid, remaining: newRemaining, status: newStatus }
            : i
        )
      );

      await updateDoc(doc(db, 'installments', installmentId), cleanFirestoreData({
        paid: newPaid,
        remaining: newRemaining,
        status: newStatus,
      }));

      // Also record payment and income
      await addPayment({
        date: new Date().toISOString().split('T')[0],
        driverId: inst.driverId,
        driverName: inst.driverName,
        vehicleId: inst.vehicleId,
        vehiclePlate: inst.vehiclePlate,
        type: 'Installment',
        amount: paidAmount,
        method: method as any,
        status: 'Completed',
        installmentId,
      });

      await logAudit(
        'Recorded installment payment',
        `Installment #${inst.installmentNumber} for ${inst.vehiclePlate}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `installments/${installmentId}`);
    }
  };

  // Income
  const addIncome = async (data: Omit<Income, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'income'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
      }));
      const newInc = { id: docRef.id, ...data, createdAt: new Date().toISOString() } as Income;
      setIncome((prev) => [newInc, ...prev.filter((i) => i.id !== newInc.id)]);
      await logAudit('Recorded income', `QAR ${data.amount} - ${data.category}`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'income');
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      setIncome((prev) => prev.filter((i) => i.id !== id));
      await deleteDoc(doc(db, 'income', id));
      await logAudit('Deleted income', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `income/${id}`);
    }
  };

  // Expense
  const addExpense = async (data: Omit<Expense, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'expenses'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
      }));
      const newExp = { id: docRef.id, ...data, createdAt: new Date().toISOString() } as Expense;
      setExpenses((prev) => [newExp, ...prev.filter((e) => e.id !== newExp.id)]);
      await logAudit('Recorded expense', `QAR ${data.amount} - ${data.category}`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'expenses');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      await deleteDoc(doc(db, 'expenses', id));
      await logAudit('Deleted expense', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
    }
  };

  // Maintenance
  const addMaintenance = async (data: Omit<MaintenanceRecord, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'maintenance'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
      }));

      // Record as expense automatically
      if (data.cost > 0) {
        await addDoc(collection(db, 'expenses'), cleanFirestoreData({
          date: data.date,
          category: 'Vehicle Maintenance',
          amount: data.cost,
          paymentMethod: 'Bank Transfer',
          vendor: data.garage,
          vehicleId: data.vehicleId,
          vehiclePlate: data.vehiclePlate,
          description: `Maintenance (${data.type}) at ${data.garage}`,
          createdAt: new Date().toISOString(),
        }));
      }

      await logAudit('Scheduled maintenance', `Vehicle ${data.vehiclePlate} (${data.type})`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'maintenance');
    }
  };

  const updateMaintenance = async (id: string, data: Partial<MaintenanceRecord>) => {
    try {
      await updateDoc(doc(db, 'maintenance', id), cleanFirestoreData(data));
      await logAudit('Updated maintenance', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `maintenance/${id}`);
    }
  };

  const deleteMaintenance = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'maintenance', id));
      await logAudit('Deleted maintenance', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `maintenance/${id}`);
    }
  };

  // Employees
  const addEmployee = async (data: Omit<Employee, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'employees'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
      }));
      if (data.qidExpiry) {
        await addDoc(collection(db, 'documents'), cleanFirestoreData({
          type: 'QID',
          entity: 'Employee',
          entityId: docRef.id,
          number: data.mobile || 'EMP',
          expiry: data.qidExpiry,
          createdAt: new Date().toISOString(),
        }));
      }
      await logAudit('Added employee', `${data.name} (${data.position})`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'employees');
    }
  };

  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    try {
      await updateDoc(doc(db, 'employees', id), cleanFirestoreData(data));
      await logAudit('Updated employee', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `employees/${id}`);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
      await logAudit('Deleted employee', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `employees/${id}`);
    }
  };

  // Documents
  const addDocumentRecord = async (data: Omit<DocumentRecord, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'documents'), cleanFirestoreData({
        ...data,
        createdAt: new Date().toISOString(),
      }));
      await logAudit('Uploaded document', `${data.type} for ${data.entity}`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'documents');
    }
  };

  const deleteDocumentRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'documents', id));
      await logAudit('Deleted document', `ID: ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `documents/${id}`);
    }
  };

  // Settings
  const updateSettings = async (data: Partial<SystemSettings>) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), cleanFirestoreData(data), { merge: true });
      await logAudit('Updated system settings', 'Settings updated');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  const seedDemoData = async () => {
    try {
      // 1. Vehicles
      const vIdMap: Record<string, string> = {};
      for (const veh of DEMO_VEHICLES) {
        const docRef = await addDoc(collection(db, 'vehicles'), {
          ...veh,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        vIdMap[veh.plate] = docRef.id;
      }

      // 2. Drivers
      const dIdMap: Record<string, string> = {};
      for (const drv of DEMO_DRIVERS) {
        const docRef = await addDoc(collection(db, 'drivers'), {
          ...drv,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        dIdMap[drv.name] = docRef.id;
      }

      // 3. Employees
      for (const emp of DEMO_EMPLOYEES) {
        await addDoc(collection(db, 'employees'), {
          ...emp,
          createdAt: new Date().toISOString(),
        });
      }

      // 4. Contracts, Assignments, Handovers
      const camryId = vIdMap['54321-LIMO'];
      const alsvinId = vIdMap['78910-LIMO'];
      const lexusId = vIdMap['12345-LIMO'];
      const tariqId = dIdMap['Mohammad Tariq'];
      const rashidId = dIdMap['Rashid Ali'];
      const ahmedId = dIdMap['Ahmed Farooq'];

      if (camryId && tariqId) {
        await addDoc(collection(db, 'contracts'), {
          contractNo: 'QA-LIMO-2026-001',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          driverId: tariqId,
          driverName: 'Mohammad Tariq',
          driverQid: '29258601923',
          driverMobile: '+974 5512 8492',
          vehicleId: camryId,
          vehiclePlate: '54321-LIMO',
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry Hybrid GLX',
          vehicleYear: 2024,
          vehicleColor: 'Pearl White',
          currentMileage: 18450,
          monthlyAmount: 2600,
          securityDeposit: 1500,
          status: 'Active',
          createdAt: new Date().toISOString(),
        });

        await addDoc(collection(db, 'assignments'), {
          vehicleId: camryId,
          vehiclePlate: '54321-LIMO',
          driverId: tariqId,
          driverName: 'Mohammad Tariq',
          type: 'Monthly Rental',
          startDate: '2026-01-01',
          startMileage: 12000,
          rent: 2600,
          status: 'Active',
          createdAt: new Date().toISOString(),
        });

        await addDoc(collection(db, 'handovers'), {
          type: 'Handover',
          vehicleId: camryId,
          vehiclePlate: '54321-LIMO',
          driverId: tariqId,
          driverName: 'Mohammad Tariq',
          date: '2026-01-01',
          mileage: 12000,
          fuelLevel: 'Full Tank',
          condition: 'Showroom clean, valid Istimara card & emergency kit in trunk.',
          createdAt: new Date().toISOString(),
        });
      }

      if (alsvinId && rashidId) {
        await addDoc(collection(db, 'contracts'), {
          contractNo: 'QA-LIMO-2026-002',
          startDate: '2026-02-01',
          endDate: '2027-01-31',
          driverId: rashidId,
          driverName: 'Rashid Ali',
          driverQid: '28858604921',
          driverMobile: '+974 6634 1928',
          vehicleId: alsvinId,
          vehiclePlate: '78910-LIMO',
          vehicleMake: 'Changan',
          vehicleModel: 'Alsvin 1.5L DCT',
          vehicleYear: 2023,
          vehicleColor: 'Silver Metallic',
          currentMileage: 34200,
          monthlyAmount: 2100,
          securityDeposit: 1000,
          status: 'Active',
          createdAt: new Date().toISOString(),
        });

        await addDoc(collection(db, 'assignments'), {
          vehicleId: alsvinId,
          vehiclePlate: '78910-LIMO',
          driverId: rashidId,
          driverName: 'Rashid Ali',
          type: 'Rent to Own',
          startDate: '2026-02-01',
          startMileage: 25000,
          rent: 2100,
          status: 'Active',
          createdAt: new Date().toISOString(),
        });

        await addDoc(collection(db, 'handovers'), {
          type: 'Handover',
          vehicleId: alsvinId,
          vehiclePlate: '78910-LIMO',
          driverId: rashidId,
          driverName: 'Rashid Ali',
          date: '2026-02-01',
          mileage: 25000,
          fuelLevel: 'Full Tank',
          condition: 'Clean interior, minor front bumper gravel chips.',
          createdAt: new Date().toISOString(),
        });

        const fRef = await addDoc(collection(db, 'financing'), {
          vehicleId: alsvinId,
          vehiclePlate: '78910-LIMO',
          driverId: rashidId,
          driverName: 'Rashid Ali',
          vehiclePrice: 48000,
          downPayment: 5000,
          financedAmount: 43000,
          monthlyInstallment: 2000,
          numberOfInstallments: 24,
          startDate: '2026-02-01',
          status: 'Active',
          createdAt: new Date().toISOString(),
        });

        for (let i = 1; i <= 24; i++) {
          const d = new Date(2026, 1 + i, 1);
          const isPaid = i <= 2;
          await addDoc(collection(db, 'installments'), {
            financingId: fRef.id,
            installmentNumber: i,
            vehicleId: alsvinId,
            vehiclePlate: '78910-LIMO',
            driverId: rashidId,
            driverName: 'Rashid Ali',
            dueDate: d.toISOString().split('T')[0],
            amount: 2000,
            paid: isPaid ? 2000 : 0,
            remaining: isPaid ? 0 : 2000,
            status: isPaid ? 'Paid' : 'Upcoming',
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (lexusId && ahmedId) {
        await addDoc(collection(db, 'contracts'), {
          contractNo: 'QA-LIMO-2026-003',
          startDate: '2026-03-01',
          endDate: '2027-02-28',
          driverId: ahmedId,
          driverName: 'Ahmed Farooq',
          driverQid: '29558603819',
          driverMobile: '+974 7729 4810',
          vehicleId: lexusId,
          vehiclePlate: '12345-LIMO',
          vehicleMake: 'Lexus',
          vehicleModel: 'ES 350 Luxury',
          vehicleYear: 2024,
          vehicleColor: 'Onyx Black',
          currentMileage: 12100,
          monthlyAmount: 5500,
          securityDeposit: 3000,
          status: 'Active',
          createdAt: new Date().toISOString(),
        });

        await addDoc(collection(db, 'assignments'), {
          vehicleId: lexusId,
          vehiclePlate: '12345-LIMO',
          driverId: ahmedId,
          driverName: 'Ahmed Farooq',
          type: 'VIP Executive',
          startDate: '2026-03-01',
          startMileage: 8500,
          rent: 5500,
          status: 'Active',
          createdAt: new Date().toISOString(),
        });

        await addDoc(collection(db, 'handovers'), {
          type: 'Handover',
          vehicleId: lexusId,
          vehiclePlate: '12345-LIMO',
          driverId: ahmedId,
          driverName: 'Ahmed Farooq',
          date: '2026-03-01',
          mileage: 8500,
          fuelLevel: 'Full Tank',
          condition: 'Pristine VIP condition, ceramic tint & leather treatment intact.',
          createdAt: new Date().toISOString(),
        });
      }

      // Payments & Incomes
      const samplePayments = [
        {
          date: '2026-03-01',
          driverId: tariqId || '',
          driverName: 'Mohammad Tariq',
          vehicleId: camryId || '',
          vehiclePlate: '54321-LIMO',
          type: 'Vehicle Rent' as const,
          amount: 2600,
          method: 'Bank Transfer' as const,
          status: 'Completed' as const,
          reference: 'QNB-TRF-90214',
          notes: 'March 2026 vehicle monthly rent',
        },
        {
          date: '2026-03-02',
          driverId: rashidId || '',
          driverName: 'Rashid Ali',
          vehicleId: alsvinId || '',
          vehiclePlate: '78910-LIMO',
          type: 'Installment' as const,
          amount: 2000,
          method: 'Cash' as const,
          status: 'Completed' as const,
          reference: 'REC-00291',
          notes: 'Installment #2 payment',
        },
        {
          date: '2026-03-03',
          driverId: ahmedId || '',
          driverName: 'Ahmed Farooq',
          vehicleId: lexusId || '',
          vehiclePlate: '12345-LIMO',
          type: 'Vehicle Rent' as const,
          amount: 5500,
          method: 'Card' as const,
          status: 'Completed' as const,
          reference: 'POS-AUTH-44910',
          notes: 'March 2026 VIP limousine rental',
        },
      ];

      for (const p of samplePayments) {
        await addDoc(collection(db, 'payments'), {
          ...p,
          createdAt: new Date().toISOString(),
        });
        await addDoc(collection(db, 'income'), {
          date: p.date,
          category: p.type === 'Installment' ? 'Driver Installments' : 'Vehicle Rent',
          amount: p.amount,
          paymentMethod: p.method,
          vehicleId: p.vehicleId,
          vehiclePlate: p.vehiclePlate,
          driverId: p.driverId,
          driverName: p.driverName,
          description: p.notes,
          referenceId: p.reference,
          createdAt: new Date().toISOString(),
        });
      }

      // Sample Expenses
      const sampleExpenses = [
        {
          date: '2026-03-02',
          category: 'Vehicle Maintenance' as const,
          amount: 650,
          paymentMethod: 'Bank Transfer' as const,
          vehiclePlate: '54321-LIMO',
          vendor: 'Teyseer Motors Salwa',
          description: '15,000 km periodic maintenance & synthetic oil filter replacement',
        },
        {
          date: '2026-03-04',
          category: 'Salik/Tolls' as const,
          amount: 180,
          paymentMethod: 'Card' as const,
          vendor: 'Mwani / Expressway Gate',
          description: 'Fleet Salik recharge',
        },
        {
          date: '2026-03-05',
          category: 'Vehicle Repairs' as const,
          amount: 850,
          paymentMethod: 'Cash' as const,
          vehiclePlate: '44556-LIMO',
          vendor: 'Industrial Area Auto Clinic',
          description: 'Front brake discs and pads overhaul',
        },
      ];

      for (const exp of sampleExpenses) {
        await addDoc(collection(db, 'expenses'), {
          ...exp,
          createdAt: new Date().toISOString(),
        });
      }

      // Maintenance
      await addDoc(collection(db, 'maintenance'), {
        vehicleId: camryId || '',
        vehiclePlate: '54321-LIMO',
        date: '2026-03-02',
        mileage: 18450,
        type: 'Routine Oil & Filter Service',
        garage: 'Teyseer Motors Salwa',
        cost: 650,
        status: 'Completed',
        next: '2026-06-02',
        description: 'Synthetic 0W-20 engine oil, OEM oil filter, AC filter cleaned',
        createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'maintenance'), {
        vehicleId: vIdMap['44556-LIMO'] || '',
        vehiclePlate: '44556-LIMO',
        date: '2026-03-05',
        mileage: 49800,
        type: 'Brake System Servicing',
        garage: 'Industrial Area Auto Clinic',
        cost: 850,
        status: 'In Progress',
        next: '2026-03-08',
        description: 'Brake pads replacement and rotor machining',
        createdAt: new Date().toISOString(),
      });

      // Documents
      await addDoc(collection(db, 'documents'), {
        type: 'Vehicle Istimara',
        entity: '54321-LIMO (Camry)',
        number: 'IST-54321-QA',
        expiry: '2026-11-15',
        createdAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'documents'), {
        type: 'Vehicle Istimara',
        entity: '44556-LIMO (HiAce)',
        number: 'IST-44556-QA',
        expiry: '2026-09-28',
        createdAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'documents'), {
        type: 'Limousine Operating Permit',
        entity: 'Prince Limousine Fleet Permit',
        number: 'MOTC-LIMO-00412',
        expiry: '2026-12-31',
        createdAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'documents'), {
        type: 'Driver QID',
        entity: 'Rashid Ali',
        number: '28858604921',
        expiry: '2026-10-18',
        createdAt: new Date().toISOString(),
      });

      await logAudit('Initialized Demo Data', 'Populated realistic Qatar limousine fleet records');
    } catch (err) {
      console.error('Error seeding demo data:', err);
      throw err;
    }
  };

  const seedDefaultEmployees = async () => {
    try {
      const addedList: Employee[] = [];
      for (const emp of DEMO_EMPLOYEES) {
        const docRef = await addDoc(collection(db, 'employees'), cleanFirestoreData({
          ...emp,
          createdAt: new Date().toISOString(),
        }));
        addedList.push({ id: docRef.id, ...emp } as Employee);
      }
      setEmployees((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const filteredNew = addedList.filter((e) => !existingIds.has(e.id));
        return [...prev, ...filteredNew];
      });
      await logAudit('Loaded Staff Roster', `Added ${DEMO_EMPLOYEES.length} staff members to payroll roster`);
    } catch (err) {
      console.error('Error seeding default employees:', err);
      throw err;
    }
  };

  const clearAllData = async () => {
    try {
      for (const v of vehicles) await deleteDoc(doc(db, 'vehicles', v.id)).catch(() => {});
      for (const d of drivers) await deleteDoc(doc(db, 'drivers', d.id)).catch(() => {});
      for (const a of assignments) await deleteDoc(doc(db, 'assignments', a.id)).catch(() => {});
      for (const h of handovers) await deleteDoc(doc(db, 'handovers', h.id)).catch(() => {});
      for (const c of contracts) await deleteDoc(doc(db, 'contracts', c.id)).catch(() => {});
      for (const p of payments) await deleteDoc(doc(db, 'payments', p.id)).catch(() => {});
      for (const f of financing) await deleteDoc(doc(db, 'financing', f.id)).catch(() => {});
      for (const inst of installments) await deleteDoc(doc(db, 'installments', inst.id)).catch(() => {});
      for (const i of income) await deleteDoc(doc(db, 'income', i.id)).catch(() => {});
      for (const e of expenses) await deleteDoc(doc(db, 'expenses', e.id)).catch(() => {});
      for (const m of maintenance) await deleteDoc(doc(db, 'maintenance', m.id)).catch(() => {});
      for (const emp of employees) await deleteDoc(doc(db, 'employees', emp.id)).catch(() => {});
      for (const docRec of documents) await deleteDoc(doc(db, 'documents', docRec.id)).catch(() => {});
      for (const log of auditLogs) await deleteDoc(doc(db, 'auditLogs', log.id)).catch(() => {});
      await logAudit('Cleared Fleet Data', 'Deleted current records from database');
    } catch (err) {
      console.error('Error clearing data:', err);
      throw err;
    }
  };

  return (
    <DbContext.Provider
      value={{
        vehicles,
        drivers,
        assignments,
        handovers,
        contracts,
        payments,
        financing,
        installments,
        income,
        expenses,
        maintenance,
        employees,
        documents,
        auditLogs,
        settings,
        loading,
        error,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addDriver,
        updateDriver,
        deleteDriver,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        addHandover,
        deleteHandover,
        addContract,
        updateContract,
        deleteContract,
        addPayment,
        deletePayment,
        addFinancing,
        deleteFinancing,
        payInstallment,
        addInstallment,
        updateInstallment,
        deleteInstallment,
        addIncome,
        deleteIncome,
        addIncomeRecord: addIncome,
        deleteIncomeRecord: deleteIncome,
        addExpense,
        deleteExpense,
        addExpenseRecord: addExpense,
        deleteExpenseRecord: deleteExpense,
        addMaintenance,
        updateMaintenance,
        deleteMaintenance,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addDocumentRecord,
        deleteDocumentRecord,
        updateSettings,
        logAudit,
        seedDemoData,
        seedDefaultEmployees,
        clearAllData,
      }}
    >
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (!context) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
};
