import type { IReceiptData, IReceiptTransaction } from "./printReceipt";

export interface IDaycarePatient {
  _id: string;
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  mrd?: string;
  age?: number;
  months?: number;
  days?: number;
  gender?: string;
  bloodGroup?: string;
  address?: string;
}

export interface IDaycareDoctor {
  _id: string;
  doctorId?: string;
  name: string;
  department?: string;
  designation?: string;
}

export interface IDaycareProcedure {
  procedureId: string;
  procedureName?: string;
  price?: number;
  isDialysis?: boolean;
  dialysisSessionId?: string;
}

export interface IDaycareTransaction {
  _id: string;
  transactionId: string;
  amount: number;
  paymentMode: string;
  transactionDate: string;
  createdAt: string;
}

export interface IDaycareAppointmentDetail {
  _id: string;
  daycareId: string;
  receiptId?: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  bedChargesType?: string;
  bedChargesHours?: number;
  bedChargesTotal?: number;
  daycareChargesType?: string;
  daycareChargesHours?: number;
  daycareChargesTotal?: number;
  procedures?: IDaycareProcedure[];
  procedureChargesTotal?: number;
  doctorVisitCharges?: boolean;
  doctorChargesAmount?: number;
  subtotal?: number;
  discount?: number;
  totalPrice?: number;
  appointmentDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  amountPaid?: number;
  paymentStatus?: string;
  doctor?: IDaycareDoctor;
  patient?: IDaycarePatient;
  transactions?: IDaycareTransaction[];
}

export const buildDaycareReceiptData = (
  daycare: IDaycareAppointmentDetail,
  dueAmount: number
): IReceiptData => {
  const formatAgeForReceipt = (
    years?: number | null,
    months?: number | null,
    days?: number | null
  ): string | undefined => {
    const y = years != null ? Number(years) : undefined;
    if (y != null && Number.isFinite(y)) {
      if (y === 0) {
        const m = months != null ? Number(months) : 0;
        if (m > 0) return `${m} ${m === 1 ? "Month" : "Months"}`;
        if (days != null) return `${days} ${Number(days) === 1 ? "Day" : "Days"}`;
        return undefined;
      }
      return `${y} ${y === 1 ? "Year" : "Years"}`;
    }

    const m = months != null ? Number(months) : 0;
    if (m > 0) return `${m} ${m === 1 ? "Month" : "Months"}`;
    if (days != null) return `${days} ${Number(days) === 1 ? "Day" : "Days"}`;
    return undefined;
  };

  const charges: IReceiptTransaction[] = [];

  const bedTotal = daycare.daycareChargesTotal ?? daycare.bedChargesTotal ?? 0;
  if (bedTotal > 0) {
    charges.push({
      _id: `${daycare._id}-bed`,
      transactionId: "",
      transactionType: `Daycare Charges (${daycare.daycareChargesType ?? daycare.bedChargesType ?? "N/A"})`,
      amount: bedTotal,
      paymentMode: "",
      transactionDate: daycare.appointmentDate || daycare.createdAt || "",
      createdAt: daycare.createdAt ?? "",
    });
  }

  if (daycare.procedures && daycare.procedures.length > 0) {
    daycare.procedures.forEach((proc, index) => {
      const procAmount = proc.price ?? 0;
      if (procAmount > 0) {
        charges.push({
          _id: `${daycare._id}-proc-${index}`,
          transactionId: "",
          transactionType: proc.procedureName || "Procedure",
          amount: procAmount,
          paymentMode: "",
          transactionDate: daycare.appointmentDate || daycare.createdAt || "",
          createdAt: daycare.createdAt ?? "",
        });
      }
    });
  } else {
    const procTotal = daycare.procedureChargesTotal ?? 0;
    if (procTotal > 0) {
      charges.push({
        _id: `${daycare._id}-proc`,
        transactionId: "",
        transactionType: "Procedure Charges",
        amount: procTotal,
        paymentMode: "",
        transactionDate: daycare.appointmentDate || daycare.createdAt || "",
        createdAt: daycare.createdAt ?? "",
      });
    }
  }

  const docTotal = daycare.doctorChargesAmount ?? 0;
  if (daycare.doctorVisitCharges && docTotal > 0) {
    charges.push({
      _id: `${daycare._id}-doc`,
      transactionId: "",
      transactionType: "Doctor Visit Charges",
      amount: docTotal,
      paymentMode: "",
      transactionDate: daycare.appointmentDate || daycare.createdAt || "",
      createdAt: daycare.createdAt ?? "",
    });
  }

  return {
    visitId: daycare.daycareId,
    appointmentId: daycare.appointmentId,
    visitDate: daycare.appointmentDate,
    visitTime: undefined,
    visitType: "Day Care",
    appointmentType: "Day Care",
    status: daycare.status,
    patientName: daycare.patient?.name,
    patientTitle: daycare.patient?.title,
    mrd: daycare.patient?.mrd,
    age: formatAgeForReceipt(daycare.patient?.age, daycare.patient?.months, daycare.patient?.days),
    gender: daycare.patient?.gender,
    phone: daycare.patient?.phone,
    address: daycare.patient?.address?.trim() || undefined,
    doctorId: daycare.doctor?.doctorId?.trim() || daycare.doctorId,
    doctorName: daycare.doctor?.name,
    doctorDepartment: daycare.doctor?.department,
    receiptId: daycare.receiptId,
    transactions: charges,
    totalAmount: daycare.subtotal ?? daycare.totalPrice ?? 0,
    discount: daycare.discount ?? 0,
    dueAmount,
    paidAmount: daycare.amountPaid ?? 0,
  };
};
