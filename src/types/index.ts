export type CmsRole =
  | "PRESIDENT"
  | "VICE_PRESIDENT"
  | "TREASURER"
  | "VICE_TREASURER"
  | "SECRETARY";

export type TaskStatus = "PENDING" | "SUBMITTED" | "GRADED";
export type TransactionType = "INCOME" | "EXPENSE";

export interface User {
  id: string;
  email?: string | null;
  name: string;
  image?: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
  submissions?: TaskSubmission[];
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId: string;
  status: TaskStatus;
  fileUrl: string | null;
  submittedAt: Date | null;
  task?: Task;
  user?: User;
}

export interface Schedule {
  id: string;
  title: string;
  date: Date;
  location: string;
  type: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  invoiceUrl: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface CashPayment {
  id: string;
  userId: string;
  amount: number;
  month: string;
  paidAt: Date;
  user?: User;
}

export interface MemberArrears {
  userId: string;
  userName: string;
  userEmail: string;
  totalPaid: number;
  totalExpected: number;
  arrears: number;
  months: string[];

  unpaidDateDetails?: Array<{
    id: string;
    date: string;
    formattedDate: string;
    amount: number;
    description: string | null;
  }>;
  allPaymentDates?: Array<{
    id: string;
    date: string;
    formattedDate: string;
    amount: number;
    description: string | null;
  }>;
  schedules?: Array<{
    id: string;
    date: string;
    formattedDate: string;
    amount: number;
    description: string | null;
  }>;
  paymentByDate?: Record<
    string,
    {
      date: string;
      formattedDate: string;
      amount: number;
      scheduleDescription: string | null;
      paid: boolean;
      paymentAmount: number;
      transactionDescription: string | null;
      createdBy: string | null;
    }
  >;
  unpaidDates?: string[];
  unpaidCount?: number;
  totalExpectedCount?: number;
  isFullyPaid?: boolean;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

export const CMS_ROLE_HIERARCHY: Record<CmsRole, number> = {
  SECRETARY: 1,
  VICE_TREASURER: 2,
  TREASURER: 3,
  VICE_PRESIDENT: 4,
  PRESIDENT: 5,
};

export const CMS_ROLES: CmsRole[] = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "TREASURER",
  "VICE_TREASURER",
  "SECRETARY",
];

export const FINANCE_ROLES: CmsRole[] = [
  "TREASURER",
  "VICE_TREASURER",
];