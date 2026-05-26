import axios from "axios";
import { API_BASE_URL } from "@/environment";
import type { IReceiptData, IReceiptTransaction } from "./printReceipt";

export async function enrichIPDDoctorForReceipt(
  ipd: IIpdAppointmentDetail
): Promise<IIpdAppointmentDetail> {
  if (!API_BASE_URL) return ipd;
  if (ipd.doctor?.medicalLicenseNo?.trim()) return ipd;
  const doctorRef = String(ipd.doctor?._id || ipd.doctorId || "").trim();
  if (!doctorRef) return ipd;
  try {
    const res = await axios.get(`${API_BASE_URL}/hospital/doctors/${doctorRef}`);
    const d = res.data?.data?.doctor as
      | {
          _id?: string;
          doctorId?: string;
          name?: string;
          department?: string;
          designation?: string;
          medicalLicenseNo?: string;
        }
      | undefined;
    if (!d) return ipd;
    const cur = ipd.doctor;
    return {
      ...ipd,
      doctor: {
        _id: d._id ?? cur?._id ?? doctorRef,
        doctorId: d.doctorId ?? cur?.doctorId,
        name: cur?.name?.trim() || d.name || "",
        department: cur?.department ?? d.department,
        designation: cur?.designation ?? d.designation,
        medicalLicenseNo: d.medicalLicenseNo ?? cur?.medicalLicenseNo,
      },
    };
  } catch {
    return ipd;
  }
}

export interface IIpdPatient {
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

export interface IIpdDoctor {
  _id: string;
  doctorId?: string;
  name: string;
  department?: string;
  designation?: string;
  medicalLicenseNo?: string;
}

export interface IIpdProcedure {
  procedureId: string;
  procedureName?: string;
  category?: string;
  price?: number;
  units?: number;
  unitPrice?: number;
  isDialysis?: boolean;
  dialysisSessionId?: string;
}

export interface IIpdDoctorVisit {
  doctorId: string;
  doctorName?: string;
  days: number;
  chargePerDay?: number;
  price: number;
}

export interface IIpdTransaction {
  _id: string;
  transactionId: string;
  amount: number;
  paymentMode: string;
  transactionDate: string;
  createdAt: string;
}

export interface IIpdBedSummary {
  _id?: string;
  bedNumber?: string;
  bedCode?: string;
  ward?: { _id?: string; name?: string; chargePerDay?: number };
}

export interface IIpdBillingChargeSummary {
  type?: string;
  procedureId?: string;
  procedureName?: string;
  price?: number;
  units?: number;
  totalCharge?: number;
  charge?: number;
}

export interface IIpdAppointmentDetail {
  _id: string;
  ipdId: string;
  receiptId?: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  bedId?: string;
  procedures?: IIpdProcedure[];
  doctorVisits?: IIpdDoctorVisit[];
  billingCharges?: IIpdBillingChargeSummary[];
  procedureChargesTotal?: number;
  doctorVisitCharges?: boolean;
  doctorChargesAmount?: number;
  bedChargesTotal?: number;
  subtotal?: number;
  discount?: number;
  totalPrice?: number;
  appointmentDate?: string;
  admissionDate?: string;
  reason?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  amountPaid?: number;
  paymentStatus?: string;
  notes?: string;
  mlc?: boolean;
  isMlc?: boolean;
  doctor?: IIpdDoctor;
  patient?: IIpdPatient;
  bed?: IIpdBedSummary;
  transactions?: IIpdTransaction[];
}

export const buildIPDReceiptData = (
  ipd: IIpdAppointmentDetail,
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

  if (ipd.procedures && ipd.procedures.length > 0) {
    ipd.procedures.forEach((proc, index) => {
      const procAmount = proc.price ?? 0;
      if (procAmount > 0) {
        charges.push({
          _id: `${ipd._id}-proc-${index}`,
          transactionId: "",
          transactionType: proc.procedureName || "Procedure",
          amount: procAmount,
          paymentMode: "",
          transactionDate: ipd.appointmentDate || ipd.createdAt || "",
          createdAt: ipd.createdAt ?? "",
        });
      }
    });
  } else {
    const procTotal = ipd.procedureChargesTotal ?? 0;
    if (procTotal > 0) {
      charges.push({
        _id: `${ipd._id}-proc`,
        transactionId: "",
        transactionType: "Procedure Charges",
        amount: procTotal,
        paymentMode: "",
        transactionDate: ipd.appointmentDate || ipd.createdAt || "",
        createdAt: ipd.createdAt ?? "",
      });
    }
  }

  const docTotal = ipd.doctorChargesAmount ?? 0;
  if (docTotal > 0) {
    charges.push({
      _id: `${ipd._id}-doc`,
      transactionId: "",
      transactionType: "Doctor Visit Charges",
      amount: docTotal,
      paymentMode: "",
      transactionDate: ipd.appointmentDate || ipd.createdAt || "",
      createdAt: ipd.createdAt ?? "",
    });
  }

  return {
    printTitle: "IPD Summary",
    visitId: ipd.ipdId,
    appointmentId: ipd.appointmentId,
    visitDate: ipd.appointmentDate,
    visitTime: undefined,
    visitType: "IPD",
    appointmentType: "IPD",
    status: ipd.status,
    patientName: ipd.patient?.name,
    patientTitle: ipd.patient?.title,
    mrd: ipd.patient?.mrd,
    age: formatAgeForReceipt(ipd.patient?.age, ipd.patient?.months, ipd.patient?.days),
    gender: ipd.patient?.gender,
    phone: ipd.patient?.phone,
    address: ipd.patient?.address?.trim() || undefined,
    doctorName: ipd.doctor?.name,
    doctorDepartment: ipd.doctor?.department,
    medicalLicenseNo: ipd.doctor?.medicalLicenseNo,
    receiptId: ipd.receiptId,
    transactions: charges,
    totalAmount: ipd.subtotal ?? ipd.totalPrice ?? 0,
    discount: ipd.discount ?? 0,
    dueAmount,
    paidAmount: ipd.amountPaid ?? 0,
  };
};
