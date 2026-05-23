"use client";


import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { all_routes } from "../../../../routes/all_routes";
import {
  Title,
  Gender,
  Visit_Type,
  Blood_Group,
  Marital_Status,
  Appointment_Type,
} from "@/core/common/selectOption";
import CommonSelect, { Option } from "@/core/common/common-select/commonSelect";
import { DatePicker, TimePicker } from "antd";
import Modals from "./modals/modals";
import Link from "next/link";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import {
  formatPatientPhoneForApi,
  validateIndianMobilePhone,
} from "@/core/utils/formatPatientPhoneForApi";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import IpdBedSelectionStep from "@/components/pages/clinic-modules/ipd-appointments/ipd-bed-selection/IpdBedSelectionStep";
import {
  fetchIpdBedBlockView,
  fetchIpdWardOptions,
  type IIpdWardOption,
} from "@/components/pages/clinic-modules/ipd-appointments/ipd-bed-selection/fetchIpdBedBlockView";
import type {
  IIpdBed,
  IIpdBedBlockViewData,
} from "@/components/pages/clinic-modules/ipd-appointments/ipd-bed-selection/ipdBedTypes";
import { getIpdDoctorVisitingCharge } from "@/components/pages/clinic-modules/ipd-appointments/ipdDoctorVisitingCharge";
import IpdAddDoctorVisitsField from "@/components/pages/clinic-modules/ipd-appointments/IpdAddDoctorVisitsField";
import {
  addIpdDoctorVisitRow,
  buildIpdDoctorBillingCharges,
  calcIpdDoctorChargesTotalWithConsulting,
  decrementIpdDoctorVisitDays,
  incrementIpdDoctorVisitDays,
  removeIpdDoctorVisitRow,
  type IIpdDoctorVisitRow,
} from "@/components/pages/clinic-modules/ipd-appointments/ipdDoctorVisitRows";
import IpdAddProceduresField from "@/components/pages/clinic-modules/ipd-appointments/IpdAddProceduresField";
import IpdFormStepIndicator from "@/components/pages/clinic-modules/ipd-appointments/IpdFormStepIndicator";
import IpdAdmissionSummarySidebar, {
  resolveIpdBedSummary,
  type IIpdSummaryBed,
} from "@/components/pages/clinic-modules/ipd-appointments/IpdAdmissionSummarySidebar";
import IpdMlcFields, {
  emptyIpdMlcData,
  type IIpdMlcData,
} from "@/components/pages/clinic-modules/ipd-appointments/IpdMlcFields";
import IpdPatientCompactUpload from "@/components/pages/clinic-modules/ipd-appointments/IpdPatientCompactUpload";
import { getPatientMaritalStatus } from "@/core/utils/patientMaritalStatus";
import type { IIpdProcedureRow } from "@/components/pages/clinic-modules/ipd-appointments/IpdProceduresTable";
import {
  addIpdProcedureRow,
  calcIpdProceduresTotal,
  decrementIpdProcedureUnits,
  incrementIpdProcedureUnits,
  removeIpdProcedureRow,
} from "@/components/pages/clinic-modules/ipd-appointments/ipdProcedureRows";

interface IVisitTypeCharge {
  visitType?: string;
  appointmentType?: string;
  charge: number;
  /** @deprecated use visitType + appointmentType */
  type?: string;
}

interface IWeeklyScheduleDay {
  dayOfWeek: string;
  mr?: boolean;
  slots?: unknown[];
}

interface IDoctor {
  _id: string;
  name: string;
  department?: string;
  sessions?: string[];
  visitTypes?: IVisitTypeCharge[];
  weeklySchedule?: IWeeklyScheduleDay[];
}

interface IPatient {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  title?: string;
  gender?: string;
  dob?: string;
  age?: number;
  months?: number;
  days?: number;
  bloodGroup?: string;
  maritalStatus?: string;
  maritialStatus?: string;
  drugSensitivity?: string;
  occupation?: string;
  address?: string;
  companyName?: string;
  division?: string;
  emergencyContacts?: Array<{
    name: string;
    number: string;
  }>;
  aadharNo?: string;
  aadharS3Url?: string;
  imageUrl?: string;
  ayushmanCardNo?: string;
}

type IIpdBillingCharge =
  | { type: "procedure"; procedureId: string; units: number }
  | { type: "doctor"; doctorId: string; units: number };

interface IIpdCreatePayload {
  patientId?: string;
  patientData?: {
    title: string;
    name: string;
    phone: string;
    age: number;
    months: number;
    days: number;
    gender: string;
    bloodGroup?: string;
    address?: string;
    maritalStatus?: string;
    occupation?: string;
    drugSensitivity?: string;
    aadharNo?: string;
    aadharS3Url?: string;
    imageUrl?: string;
    ayushmanCardNo?: string;
  };
  doctorId: string;
  bedId: string;
  admissionDate: string;
  reason: string;
  billingCharges: IIpdBillingCharge[];
  isMLC?: boolean;
  mlc?: IIpdMlcData;
  transaction?: {
    transactionType: "Payment";
    amount: number;
    paymentMode: string;
  };
}

const NewAppointmentComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Patient form state
  const [phone, setPhone] = useState<string>("");
  const [title, setTitle] = useState<Option | null>(Title[0] || null);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [gender, setGender] = useState<Option | null>(Gender[0] || null);
  const [dob, setDob] = useState<any>(null);
  const [ageYears, setAgeYears] = useState<string>("");
  const [ageMonths, setAgeMonths] = useState<string>("");
  const [ageDays, setAgeDays] = useState<string>("");
  const [bloodGroup, setBloodGroup] = useState<Option | null>(Blood_Group[0] || null);
  const [address, setAddress] = useState<string>("");
  const [aadharNo, setAadharNo] = useState<string>("");
  const [ayushmanNo, setAyushmanNo] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [patientSearchResults, setPatientSearchResults] = useState<IPatient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState<boolean>(false);
  const [searchingPatients, setSearchingPatients] = useState<boolean>(false);

  // Appointment form state
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<Option[]>([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState<boolean>(false);
  const doctorSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Option | null>(null);
  const [visitType, setVisitType] = useState<Option | null>(Visit_Type.find(v => v.value === "New") || Visit_Type[0] || null);
  const [appointmentType, setAppointmentType] = useState<string>("OPD");
  const [visitDate, setVisitDate] = useState<any>(dayjs());
  const [visitTime, setVisitTime] = useState<any>(dayjs());
  const [sessionSlot, setSessionSlot] = useState<Option | null>(null);
  const [reason, setReason] = useState<string>("");

  // Attendant details
  const [attendantName, setAttendantName] = useState<string>("");
  const [attendantRelation, setAttendantRelation] = useState<string>("");

  // Tab: OPD | Daycare | IPD (separate forms)
  const tabParam = searchParams?.get("tab")?.toLowerCase();
  const [appointmentTab, setAppointmentTab] = useState<"OPD" | "Daycare" | "IPD">(
    tabParam === "daycare" ? "Daycare" : tabParam === "ipd" ? "IPD" : "OPD"
  );

  // Daycare form state (separate from OPD)
  const [daycarePhone, setDaycarePhone] = useState<string>("");
  const [daycareTitle, setDaycareTitle] = useState<Option | null>(Title[0] || null);
  const [daycareName, setDaycareName] = useState<string>("");
  const [daycareEmail, setDaycareEmail] = useState<string>("");
  const [daycareGender, setDaycareGender] = useState<Option | null>(Gender[0] || null);
  const [daycareDob, setDaycareDob] = useState<any>(null);
  const [daycareAgeYears, setDaycareAgeYears] = useState<string>("");
  const [daycareAgeMonths, setDaycareAgeMonths] = useState<string>("");
  const [daycareAgeDays, setDaycareAgeDays] = useState<string>("");
  const [daycareBloodGroup, setDaycareBloodGroup] = useState<Option | null>(Blood_Group[0] || null);
  const [daycareAddress, setDaycareAddress] = useState<string>("");
  const [daycareAadharNo, setDaycareAadharNo] = useState<string>("");
  const [daycareAyushmanNo, setDaycareAyushmanNo] = useState<string>("");
  const [daycareSelectedPatient, setDaycareSelectedPatient] = useState<IPatient | null>(null);
  const [daycarePatientSearchResults, setDaycarePatientSearchResults] = useState<IPatient[]>([]);
  const [daycareShowPatientDropdown, setDaycareShowPatientDropdown] = useState<boolean>(false);
  const [daycareSearchingPatients, setDaycareSearchingPatients] = useState<boolean>(false);
  const [daycareSelectedDoctor, setDaycareSelectedDoctor] = useState<Option | null>(null);
  const [daycareVisitType, setDaycareVisitType] = useState<Option | null>(Visit_Type.find(v => v.value === "New") || Visit_Type[0] || null);
  const [daycareAppointmentType, setDaycareAppointmentType] = useState<string>("Day Care");
  const [daycareVisitDate, setDaycareVisitDate] = useState<any>(dayjs());
  const [daycareVisitTime, setDaycareVisitTime] = useState<any>(dayjs());
  const [daycareSessionSlot, setDaycareSessionSlot] = useState<Option | null>(null);
  const [daycareReason, setDaycareReason] = useState<string>("");
  const [daycareAttendantName, setDaycareAttendantName] = useState<string>("");
  const [daycareAttendantRelation, setDaycareAttendantRelation] = useState<string>("");
  const [daycareBedChargesType, setDaycareBedChargesType] = useState<Option | null>(null);
  const [daycareBedChargesHours, setDaycareBedChargesHours] = useState<number>(1);
  const [daycareCustomRate, setDaycareCustomRate] = useState<number>(0);
  const [daycareDoctorVisitCharges, setDaycareDoctorVisitCharges] = useState<"Yes" | "No">("No");
  const [daycareAddedProcedures, setDaycareAddedProcedures] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [daycareAddProcedureSelect, setDaycareAddProcedureSelect] = useState<Option | null>(null);
  const daycareBedChargesOptions: Option[] = [
    { value: "none", label: "None" },
    { value: "private", label: "Private (200/hr)" },
    { value: "semi", label: "Semi-Private (150/hr)" },
    { value: "general", label: "General (100/hr)" },
    { value: "custom", label: "Custom" },
  ];
  const [daycareProceduresOptions, setDaycareProceduresOptions] = useState<Option[]>([]);
  const [daycareProceduresLoading, setDaycareProceduresLoading] = useState(false);
  const [daycareProcedurePriceById, setDaycareProcedurePriceById] = useState<Record<string, number>>({});
  const [daycarePaymentMode, setDaycarePaymentMode] = useState<string>("Cash");
  const [daycareTotal, setDaycareTotal] = useState<number>(0);
  const [daycareDiscount, setDaycareDiscount] = useState<number>(0);
  const [daycareAmountReceived, setDaycareAmountReceived] = useState<number>(0);
  const [daycareLoading, setDaycareLoading] = useState<boolean>(false);
  const [daycareError, setDaycareError] = useState<string>("");
  const [daycareShowDiscountPasswordDialog, setDaycareShowDiscountPasswordDialog] = useState<boolean>(false);
  const [daycareDiscountPassword, setDaycareDiscountPassword] = useState<string>("");
  const [daycareDiscountPasswordError, setDaycareDiscountPasswordError] = useState<string>("");
  const daycareBedChargesAmount: Record<string, number> = { none: 0, private: 200, semi: 150, general: 100 };
  const isDaycareCustomCharges = daycareBedChargesType?.value === "custom";
  const daycareBedChargesRate = daycareBedChargesType?.value && !isDaycareCustomCharges
    ? (daycareBedChargesAmount[daycareBedChargesType.value] ?? 0)
    : 0;
  const daycareBedCharges = isDaycareCustomCharges
    ? Math.max(0, Number(daycareCustomRate) || 0)
    : daycareBedChargesRate * (daycareBedChargesHours > 0 ? daycareBedChargesHours : 1);
  const daycareProceduresCharges = daycareAddedProcedures.reduce((sum, p) => sum + p.price, 0);
  const daycareDocVisitCharges = daycareDoctorVisitCharges === "Yes" ? daycareTotal : 0;
  const daycareSubtotal = daycareBedCharges + daycareProceduresCharges + daycareDocVisitCharges;
  const daycareBalance = daycareSubtotal - (daycareDiscount || 0) - (daycareAmountReceived || 0);

  // IPD form state (like Daycare, without daycare/bed charges or hours)
  const [ipdPhone, setIpdPhone] = useState<string>("");
  const [ipdTitle, setIpdTitle] = useState<Option | null>(Title[0] || null);
  const [ipdName, setIpdName] = useState<string>("");
  const [ipdEmail, setIpdEmail] = useState<string>("");
  const [ipdGender, setIpdGender] = useState<Option | null>(Gender[0] || null);
  const [ipdDob, setIpdDob] = useState<any>(null);
  const [ipdAgeYears, setIpdAgeYears] = useState<string>("");
  const [ipdAgeMonths, setIpdAgeMonths] = useState<string>("");
  const [ipdAgeDays, setIpdAgeDays] = useState<string>("");
  const [ipdBloodGroup, setIpdBloodGroup] = useState<Option | null>(Blood_Group[0] || null);
  const [ipdAddress, setIpdAddress] = useState<string>("");
  const [ipdAadharNo, setIpdAadharNo] = useState<string>("");
  const [ipdPhotoFile, setIpdPhotoFile] = useState<File | null>(null);
  const [ipdAadharFile, setIpdAadharFile] = useState<File | null>(null);
  const [ipdPatientPhotoUrl, setIpdPatientPhotoUrl] = useState<string>("");
  const [ipdPatientAadharDocUrl, setIpdPatientAadharDocUrl] = useState<string>("");
  const [ipdAyushmanNo, setIpdAyushmanNo] = useState<string>("");
  const [ipdAttendantName, setIpdAttendantName] = useState<string>("");
  const [ipdAttendantRelation, setIpdAttendantRelation] = useState<string>("");
  const [ipdMaritalStatus, setIpdMaritalStatus] = useState<Option | null>(Marital_Status[0] || null);
  const [ipdDrugSensitivity, setIpdDrugSensitivity] = useState<string>("");
  const [ipdOccupation, setIpdOccupation] = useState<string>("");
  const [ipdSelectedPatient, setIpdSelectedPatient] = useState<IPatient | null>(null);
  const [ipdPatientSearchResults, setIpdPatientSearchResults] = useState<IPatient[]>([]);
  const [ipdShowPatientDropdown, setIpdShowPatientDropdown] = useState<boolean>(false);
  const [ipdSearchingPatients, setIpdSearchingPatients] = useState<boolean>(false);
  const [ipdSelectedDoctor, setIpdSelectedDoctor] = useState<Option | null>(null);
  const [ipdAddVisitingDoctorSelect, setIpdAddVisitingDoctorSelect] = useState<Option | null>(null);
  const [ipdMlc, setIpdMlc] = useState(false);
  const [ipdMlcData, setIpdMlcData] = useState<IIpdMlcData>(emptyIpdMlcData);
  const [ipdNotes, setIpdNotes] = useState("");
  const [ipdAddedProcedures, setIpdAddedProcedures] = useState<IIpdProcedureRow[]>([]);
  const [ipdAddProcedureSelect, setIpdAddProcedureSelect] = useState<Option | null>(null);
  const [ipdProceduresOptions, setIpdProceduresOptions] = useState<Option[]>([]);
  const [ipdProceduresLoading, setIpdProceduresLoading] = useState(false);
  const [ipdProcedurePriceById, setIpdProcedurePriceById] = useState<Record<string, number>>({});
  const [ipdPaymentMode, setIpdPaymentMode] = useState<string>("Cash");
  const [ipdDiscount, setIpdDiscount] = useState<number>(0);
  const [ipdAmountReceived, setIpdAmountReceived] = useState<number>(0);
  const [ipdLoading, setIpdLoading] = useState<boolean>(false);
  const [ipdError, setIpdError] = useState<string>("");
  const [ipdShowDiscountPasswordDialog, setIpdShowDiscountPasswordDialog] = useState<boolean>(false);
  const [ipdDiscountPassword, setIpdDiscountPassword] = useState<string>("");
  const [ipdDiscountPasswordError, setIpdDiscountPasswordError] = useState<string>("");
  const [ipdDoctorVisits, setIpdDoctorVisits] = useState<IIpdDoctorVisitRow[]>([]);
  const ipdProceduresCharges = calcIpdProceduresTotal(ipdAddedProcedures);
  const [ipdFormStep, setIpdFormStep] = useState<1 | 2 | 3>(1);
  const [ipdBedBlockData, setIpdBedBlockData] = useState<IIpdBedBlockViewData | null>(null);
  const [ipdBedsLoading, setIpdBedsLoading] = useState(false);
  const [ipdBedsError, setIpdBedsError] = useState<string>("");
  const [ipdWardOptions, setIpdWardOptions] = useState<IIpdWardOption[]>([]);
  const [ipdWardsLoading, setIpdWardsLoading] = useState(false);
  const [ipdSelectedWardFilterId, setIpdSelectedWardFilterId] = useState<string | null>(null);
  const [ipdSelectedBedId, setIpdSelectedBedId] = useState<string | null>(null);
  const [ipdSelectedBed, setIpdSelectedBed] = useState<IIpdBed | null>(null);
  const [ipdBedSummarySnapshot, setIpdBedSummarySnapshot] = useState<IIpdSummaryBed | null>(
    null
  );
  const ipdSummaryDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === ipdSelectedDoctor?.value),
    [doctors, ipdSelectedDoctor?.value]
  );
  const ipdConsultingDoctorCharge = getIpdDoctorVisitingCharge(ipdSummaryDoctor?.visitTypes);
  const ipdDoctorChargesTotal = calcIpdDoctorChargesTotalWithConsulting(
    ipdDoctorVisits,
    ipdConsultingDoctorCharge,
    ipdSelectedDoctor?.value
  );
  const ipdSubtotal = ipdProceduresCharges + ipdDoctorChargesTotal;
  const ipdBalance = ipdSubtotal - (ipdDiscount || 0) - (ipdAmountReceived || 0);
  const ipdSummaryBed = useMemo(() => {
    const resolved = resolveIpdBedSummary(
      ipdBedBlockData,
      ipdSelectedBedId,
      ipdSelectedBed?.bedCode,
      ipdWardOptions
    );
    if (resolved.wardName || resolved.ratePerDay != null) return resolved;
    return ipdBedSummarySnapshot ?? resolved;
  }, [
    ipdBedBlockData,
    ipdSelectedBedId,
    ipdSelectedBed?.bedCode,
    ipdWardOptions,
    ipdBedSummarySnapshot,
  ]);
  const ipdSummaryPackageLabel = useMemo(() => {
    const labels = ipdAddedProcedures.map((procedure) => procedure.name).filter(Boolean);
    return labels.length ? labels.join(", ") : undefined;
  }, [ipdAddedProcedures]);

  // Payment form state
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [total, setTotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showDiscountPasswordDialog, setShowDiscountPasswordDialog] = useState<boolean>(false);
  const [discountPassword, setDiscountPassword] = useState<string>("");
  const [discountPasswordError, setDiscountPasswordError] = useState<string>("");

  // Calculate final amount and balance
  const finalAmount = total - discount;
  const balance = finalAmount - amountReceived;

  // MR option is disabled when doctor has mr: false for the selected visit day
  const isMrDisabledForSelectedDay = useMemo(() => {
    if (!selectedDoctor?.value || !visitDate) return true;
    const doctor = doctors.find((d) => d._id === selectedDoctor.value);
    if (!doctor?.weeklySchedule?.length) return true;
    const dayName = dayjs.isDayjs(visitDate)
      ? visitDate.format("dddd")
      : dayjs(visitDate).format("dddd");
    if (!dayName) return true;
    const daySchedule = doctor.weeklySchedule.find((d) => d.dayOfWeek === dayName);
    return daySchedule?.mr !== true;
  }, [selectedDoctor?.value, visitDate, doctors]);
  const isMrVisitSelected = visitType?.value === "MR";
  const isPaymentModeDisabledForMr = isMrVisitSelected;

  // When MR is disabled for the selected day and currently selected, switch to New
  useEffect(() => {
    if (visitType?.value === "MR" && isMrDisabledForSelectedDay) {
      const newOpt = Visit_Type.find((v) => v.value === "New") || Visit_Type[0];
      if (newOpt) setVisitType(newOpt);
    }
  }, [isMrDisabledForSelectedDay, visitType?.value]);

  useEffect(() => {
    if (isMrVisitSelected && paymentMode === "Card") {
      setPaymentMode("Cash");
    }
  }, [isMrVisitSelected, paymentMode]);

  const fetchDoctorsWithSearch = useCallback(async (search: string) => {
    if (!API_BASE_URL) return;
    setDoctorSearchLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 20 };
      if (search.trim()) params.search = search.trim();
      const response = await axios.get(`${API_BASE_URL}/hospital/doctors`, { params });

      if (response.data?.code === 200 && response.data?.data?.doctors) {
        const doctorsList: IDoctor[] = response.data.data.doctors;
        setDoctorOptions(
          doctorsList.map((doctor: IDoctor) => ({
            value: doctor._id,
            label: doctor.department ? `${doctor.name} (${doctor.department})` : doctor.name,
          }))
        );
        setDoctors((prev) => {
          const selectedId = selectedDoctor?.value;
          if (selectedId && !doctorsList.some((d) => d._id === selectedId)) {
            const existing = prev.find((d) => d._id === selectedId);
            if (existing) return [existing, ...doctorsList];
          }
          return doctorsList;
        });
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setDoctorSearchLoading(false);
    }
  }, [selectedDoctor?.value]);

  // Fetch doctors once on mount (initial list)
  useEffect(() => {
    fetchDoctorsWithSearch("");
  }, []);

  const handleDoctorInputChange = useCallback(
    (value: string) => {
      if (doctorSearchDebounceRef.current) {
        clearTimeout(doctorSearchDebounceRef.current);
        doctorSearchDebounceRef.current = null;
      }
      doctorSearchDebounceRef.current = setTimeout(() => {
        fetchDoctorsWithSearch(value);
      }, 300);
    },
    [fetchDoctorsWithSearch]
  );

  // Session options from selected doctor only; empty until doctor is selected
  const sessionOptions = useMemo(() => {
    if (!selectedDoctor?.value) return [];
    const doctor = doctors.find((d) => d._id === selectedDoctor.value);
    const sessions = doctor?.sessions;
    if (!sessions?.length) return [];
    return sessions.map((s) => ({ value: s, label: s }));
  }, [selectedDoctor, doctors]);

  const daycareSessionOptions = useMemo(() => {
    if (!daycareSelectedDoctor?.value) return [];
    const doctor = doctors.find((d) => d._id === daycareSelectedDoctor.value);
    const sessions = doctor?.sessions;
    if (!sessions?.length) return [];
    return sessions.map((s) => ({ value: s, label: s }));
  }, [daycareSelectedDoctor, doctors]);

  const daycareIsMrDisabledForSelectedDay = useMemo(() => {
    if (!daycareSelectedDoctor?.value || !daycareVisitDate) return true;
    const doctor = doctors.find((d) => d._id === daycareSelectedDoctor.value);
    if (!doctor?.weeklySchedule?.length) return true;
    const dayName = dayjs.isDayjs(daycareVisitDate) ? daycareVisitDate.format("dddd") : dayjs(daycareVisitDate).format("dddd");
    const daySchedule = doctor.weeklySchedule.find((d) => d.dayOfWeek === dayName);
    return daySchedule?.mr !== true;
  }, [daycareSelectedDoctor?.value, daycareVisitDate, doctors]);

  const handleDoctorChange = useCallback((option: Option | null) => {
    setSelectedDoctor(option);
    setSessionSlot(null);
    setTotal(0);
  }, []);

  const handleTitleChange = useCallback((option: Option | null) => {
    setTitle(option);
    if (!option?.value) return;
    if (option.value === "Mr." || option.value === "Master") {
      const male = Gender.find((g) => g.value === "Male");
      if (male) setGender(male);
    } else if (option.value === "Mrs." || option.value === "Ms.") {
      const female = Gender.find((g) => g.value === "Female");
      if (female) setGender(female);
    } else if (option.value === "Dr." || option.value === "Prof." || option.value === "Baby") {
      setGender(Gender.find((g) => g.value === "Select") ?? Gender[0]);
    }
  }, []);

  // Set total from doctor's visitTypes (new shape: visitType, appointmentType, charge)
  const updateTotalFromDoctorCharge = useCallback(() => {
    if (!selectedDoctor?.value) {
      setTotal(0);
      return;
    }
    const doctor = doctors.find((d) => d._id === selectedDoctor.value);
    const visitTypes = doctor?.visitTypes;
    if (!visitTypes?.length) {
      setTotal(0);
      return;
    }
    const selectedVisit = visitType?.value && visitType.value !== "Select" ? visitType.value : null;
    const aptTypeNorm = (v: string) => (v || "").toLowerCase().replace(/\s/g, "");

    let match = visitTypes.find((vt: IVisitTypeCharge) => {
      if (vt.visitType != null && vt.appointmentType != null) {
        if (appointmentType === "Day Care") {
          return vt.visitType === "New" && (vt.appointmentType === "Day care" || vt.appointmentType === "Day Care");
        }
        return (vt.appointmentType === "OPD" || aptTypeNorm(vt.appointmentType) === "opd") && vt.visitType === selectedVisit;
      }
      if (vt.type != null) {
        if (appointmentType === "Day Care") return vt.type === "Day Care";
        return vt.type === (selectedVisit || "New") || (selectedVisit === "New" && vt.type === "OPD");
      }
      return false;
    });

    if (!match && selectedVisit === "New" && appointmentType !== "Day Care") {
      match = visitTypes.find((vt: IVisitTypeCharge) => vt.appointmentType === "OPD" && vt.visitType === "New");
    }
    setTotal(match?.charge ?? 0);
  }, [selectedDoctor, visitType, appointmentType, doctors]);

  useEffect(() => {
    updateTotalFromDoctorCharge();
  }, [updateTotalFromDoctorCharge]);

  const handleDaycareAddProcedure = useCallback((option: Option | null) => {
    if (!option?.value) return;
    // Only allow procedures coming from fetched list (prevents dummy/wrong ids)
    if (daycareProcedurePriceById[option.value] == null) return;
    const price = daycareProcedurePriceById[option.value] ?? 0;
    setDaycareAddedProcedures((prev) => {
      if (prev.some((p) => p.id === option.value)) return prev;
      return [...prev, { id: option.value, name: option.label, price }];
    });
    setDaycareAddProcedureSelect(null);
  }, [daycareProcedurePriceById]);
  const handleDaycareRemoveProcedure = useCallback((id: string) => {
    setDaycareAddedProcedures((prev) => prev.filter((p) => p.id !== id));
  }, []);
  const handleDaycareDoctorChange = useCallback((option: Option | null) => {
    setDaycareSelectedDoctor(option);
    setDaycareSessionSlot(null);
    setDaycareTotal(0);
  }, []);

  const updateDaycareTotalFromDoctorCharge = useCallback(() => {
    if (!daycareSelectedDoctor?.value) {
      setDaycareTotal(0);
      return;
    }
    const doctor = doctors.find((d) => d._id === daycareSelectedDoctor.value);
    const visitTypes = doctor?.visitTypes;
    if (!visitTypes?.length) {
      setDaycareTotal(0);
      return;
    }
    const selectedVisit = daycareVisitType?.value && daycareVisitType.value !== "Select" ? daycareVisitType.value : null;
    const aptTypeNorm = (v: string) => (v || "").toLowerCase().replace(/\s/g, "");
    let match = visitTypes.find((vt: IVisitTypeCharge) => {
      if (vt.visitType != null && vt.appointmentType != null) {
        return vt.visitType === "New" && (vt.appointmentType === "Day care" || vt.appointmentType === "Day Care");
      }
      if (vt.type != null) return vt.type === "Day Care";
      return false;
    });
    setDaycareTotal(match?.charge ?? 0);
  }, [daycareSelectedDoctor, daycareVisitType, doctors]);

  useEffect(() => {
    updateDaycareTotalFromDoctorCharge();
  }, [updateDaycareTotalFromDoctorCharge]);

  // Fetch procedures for Daycare (used for procedureIds)
  useEffect(() => {
    const fetchProcedures = async () => {
      if (!API_BASE_URL) return;
      try {
        setDaycareProceduresLoading(true);
        const res = await axios.get(`${API_BASE_URL}/hospital/procedures`, {
          params: { limit: 50 },
        });
        if (res.data?.code === 200 && Array.isArray(res.data?.data?.procedures)) {
          const list = res.data.data.procedures as Array<{
            _id: string;
            procedureName?: string;
            price?: number;
            basePrice?: number;
          }>;
          setDaycareProceduresOptions(
            list.map((p) => ({
              value: p._id,
              label: p.procedureName ?? "—",
            }))
          );
          const priceMap: Record<string, number> = {};
          list.forEach((p) => {
            priceMap[p._id] = (p.price ?? p.basePrice ?? 0) as number;
          });
          setDaycareProcedurePriceById(priceMap);
        } else {
          setDaycareProceduresOptions([]);
          setDaycareProcedurePriceById({});
        }
      } catch {
        setDaycareProceduresOptions([]);
        setDaycareProcedurePriceById({});
      } finally {
        setDaycareProceduresLoading(false);
      }
    };
    fetchProcedures();
  }, []);

  // When Day Care is selected, set visit type to "New" and date to today
  useEffect(() => {
    if (appointmentType === "Day Care") {
      const newVisitType = Visit_Type.find((v) => v.value === "New");
      if (newVisitType && visitType?.value !== "New") {
        setVisitType(newVisitType);
      }
      // Always set date to today when Day Care is selected
      setVisitDate(dayjs());
    }
  }, [appointmentType, visitType]);

  const searchPatients = useCallback(async (searchText: string) => {
    try {
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is undefined");
        return;
      }

      // Search by name or phone number
      const searchQuery = searchText.trim();
      console.log("Searching patients with:", searchQuery);
      setSearchingPatients(true);
      
      const response = await axios.get(`${API_BASE_URL}/hospital/patients`, {
        params: { 
          limit: 20,
          page: 1,
          search: searchQuery
        }
      });

      console.log("Patients API response:", response.data);
      console.log("API URL called:", `${API_BASE_URL}/hospital/patients?limit=20&page=1&search=${searchQuery}`);

      if (response.data?.code === 200 && response.data?.data?.patients) {
        const patients = response.data.data.patients;
        console.log("Filtered patients:", patients);
        setPatientSearchResults(patients);
        setShowPatientDropdown(patients.length > 0 && !selectedPatient);
      } else {
        setPatientSearchResults([]);
        setShowPatientDropdown(false);
      }
    } catch (error) {
      // Swallow patient search errors to avoid noisy console AxiosError
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
    } finally {
      setSearchingPatients(false);
    }
  }, [selectedPatient]);

  // Search patients when phone/name changes
  useEffect(() => {
    if (!phone || phone.trim().length === 0) {
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      setSelectedPatient(null);
      return;
    }

    const searchTimeout = setTimeout(() => {
      const searchText = phone.trim();
      console.log("Search text changed:", searchText, "Length:", searchText.length);
      if (searchText.length >= 2) {
        console.log("Triggering search with", searchText.length, "characters");
        searchPatients(searchText);
      } else {
        setPatientSearchResults([]);
        setShowPatientDropdown(false);
        setSelectedPatient(null);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(searchTimeout);
  }, [phone, searchPatients]);

  const searchDaycarePatients = useCallback(async (searchText: string) => {
    try {
      if (!API_BASE_URL) return;
      const searchQuery = searchText.trim();
      setDaycareSearchingPatients(true);
      const response = await axios.get(`${API_BASE_URL}/hospital/patients`, {
        params: { limit: 20, page: 1, search: searchQuery },
      });
      if (response.data?.code === 200 && response.data?.data?.patients) {
        const patients = response.data.data.patients;
        setDaycarePatientSearchResults(patients);
        setDaycareShowPatientDropdown(patients.length > 0 && !daycareSelectedPatient);
      } else {
        setDaycarePatientSearchResults([]);
        setDaycareShowPatientDropdown(false);
      }
    } catch {
      setDaycarePatientSearchResults([]);
      setDaycareShowPatientDropdown(false);
    } finally {
      setDaycareSearchingPatients(false);
    }
  }, [daycareSelectedPatient]);

  useEffect(() => {
    if (!daycarePhone || daycarePhone.trim().length === 0) {
      setDaycarePatientSearchResults([]);
      setDaycareShowPatientDropdown(false);
      setDaycareSelectedPatient(null);
      return;
    }
    const t = setTimeout(() => {
      if (daycarePhone.trim().length >= 2) searchDaycarePatients(daycarePhone.trim());
      else {
        setDaycarePatientSearchResults([]);
        setDaycareShowPatientDropdown(false);
        setDaycareSelectedPatient(null);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [daycarePhone, searchDaycarePatients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.patient-search-container')) {
        setShowPatientDropdown(false);
      }
    };

    if (showPatientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPatientDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.daycare-patient-search-container')) {
        setDaycareShowPatientDropdown(false);
      }
    };
    if (daycareShowPatientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [daycareShowPatientDropdown]);

  const handleDobChange = (date: any) => {
    setDob(date);
    if (date) {
      const birthDate = dayjs.isDayjs(date) ? date.toDate() : new Date(date);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();
      let days = today.getDate() - birthDate.getDate();

      if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
      }

      if (months < 0) {
        years--;
        months += 12;
      }

      setAgeYears(years.toString());
      setAgeMonths(months.toString());
      setAgeDays(days.toString());
    } else {
      setAgeYears("");
      setAgeMonths("");
      setAgeDays("");
    }
  };

  const handlePatientSelect = async (patient: IPatient) => {
    setSelectedPatient(patient);
    setShowPatientDropdown(false);
    
    // Populate form fields
    setName(patient.name || "");
    setEmail(patient.email || "");
    setPhone(patient.phone || "");
    
    if (patient.title) {
      const titleOption = Title.find(t => t.value === patient.title);
      if (titleOption) setTitle(titleOption);
    }
    
    if (patient.gender) {
      const genderOption = Gender.find(g => g.value === patient.gender);
      if (genderOption) setGender(genderOption);
    }
    
    if (patient.bloodGroup) {
      const bloodGroupOption = Blood_Group.find(bg => bg.value === patient.bloodGroup);
      if (bloodGroupOption) setBloodGroup(bloodGroupOption);
    }
    
    if (patient.dob) {
      const dobDate = dayjs(patient.dob);
      setDob(dobDate);
      handleDobChange(dobDate);
    } else {
      if (patient.age != null) setAgeYears(String(patient.age));
      if (patient.months != null) setAgeMonths(String(patient.months));
      if (patient.days != null) setAgeDays(String(patient.days));
    }

    setCompanyName(patient.companyName ?? "");
    setDivision(patient.division ?? "");
    setAddress(patient.address || "");
    setAadharNo((patient as any).aadharNo || "");
    setAyushmanNo((patient as any).ayushmanCardNo || "");
  };

  const handleDaycarePatientSelect = async (patient: IPatient) => {
    setDaycareSelectedPatient(patient);
    setDaycareShowPatientDropdown(false);
    setDaycareName(patient.name || "");
    setDaycareEmail(patient.email || "");
    setDaycarePhone(patient.phone || "");
    if (patient.title) {
      const titleOption = Title.find((t) => t.value === patient.title);
      if (titleOption) setDaycareTitle(titleOption);
    }
    if (patient.gender) {
      const genderOption = Gender.find((g) => g.value === patient.gender);
      if (genderOption) setDaycareGender(genderOption);
    }
    if (patient.bloodGroup) {
      const bloodGroupOption = Blood_Group.find((bg) => bg.value === patient.bloodGroup);
      if (bloodGroupOption) setDaycareBloodGroup(bloodGroupOption);
    }
    if (patient.dob) {
      const dobDate = dayjs(patient.dob);
      setDaycareDob(dobDate);
      handleDaycareDobChange(dobDate);
    }
    if (patient.age) setDaycareAgeYears(patient.age.toString());
    setDaycareAddress(patient.address || "");
    setDaycareAadharNo((patient as any).aadharNo || "");
    setDaycareAyushmanNo((patient as any).ayushmanCardNo || "");
  };

  const handleDaycareDobChange = (date: any) => {
    setDaycareDob(date);
    if (date) {
      const birthDate = dayjs.isDayjs(date) ? date.toDate() : new Date(date);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();
      let days = today.getDate() - birthDate.getDate();
      if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      setDaycareAgeYears(years.toString());
      setDaycareAgeMonths(months.toString());
      setDaycareAgeDays(days.toString());
    } else {
      setDaycareAgeYears("");
      setDaycareAgeMonths("");
      setDaycareAgeDays("");
    }
  };

  const handleDaycareTitleChange = useCallback((option: Option | null) => {
    setDaycareTitle(option);
    if (!option?.value) return;
    if (option.value === "Mr." || option.value === "Master") {
      const male = Gender.find((g) => g.value === "Male");
      if (male) setDaycareGender(male);
    } else if (option.value === "Mrs." || option.value === "Ms.") {
      const female = Gender.find((g) => g.value === "Female");
      if (female) setDaycareGender(female);
    } else if (option.value === "Dr." || option.value === "Prof." || option.value === "Baby") {
      setDaycareGender(Gender.find((g) => g.value === "Select") ?? Gender[0]);
    }
  }, []);

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  const calculateAge = (): number => {
    if (ageYears) {
      return parseInt(ageYears, 10);
    }
    if (dob) {
      const birthDate = dayjs.isDayjs(dob) ? dob.toDate() : new Date(dob);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        years--;
      }
      return years;
    }
    return 0;
  };

  const parseAgeComponent = (s: string): number => {
    const t = s.trim();
    if (t === "") return 0;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && !Number.isNaN(n) ? Math.max(0, n) : 0;
  };

  const formatDob = (): string => {
    if (!dob) return "";
    if (dayjs.isDayjs(dob)) {
      return dob.format("YYYY-MM-DD");
    }
    return dayjs(dob).format("YYYY-MM-DD");
  };

  const formatVisitDate = (): string => {
    if (!visitDate) return "";
    if (dayjs.isDayjs(visitDate)) {
      return visitDate.format("YYYY-MM-DD");
    }
    return dayjs(visitDate).format("YYYY-MM-DD");
  };

  const formatVisitTime = (): string => {
    if (!visitTime) return "";
    if (dayjs.isDayjs(visitTime)) {
      return visitTime.format("HH:mm");
    }
    return dayjs(visitTime).format("HH:mm");
  };

  const calculateDaycareAge = (): number => {
    if (daycareAgeYears) return parseInt(daycareAgeYears, 10);
    if (daycareDob) {
      const birthDate = dayjs.isDayjs(daycareDob) ? daycareDob.toDate() : new Date(daycareDob);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) years--;
      return years;
    }
    return 0;
  };

  const formatDaycareDob = (): string => {
    if (!daycareDob) return "";
    return dayjs.isDayjs(daycareDob) ? daycareDob.format("YYYY-MM-DD") : dayjs(daycareDob).format("YYYY-MM-DD");
  };

  const formatDaycareVisitDate = (): string => {
    if (!daycareVisitDate) return "";
    return dayjs.isDayjs(daycareVisitDate) ? daycareVisitDate.format("YYYY-MM-DD") : dayjs(daycareVisitDate).format("YYYY-MM-DD");
  };

  const formatDaycareVisitTime = (): string => {
    if (!daycareVisitTime) return "";
    return dayjs.isDayjs(daycareVisitTime) ? daycareVisitTime.format("HH:mm") : dayjs(daycareVisitTime).format("HH:mm");
  };

  const doDaycareSubmit = async (discountPwd?: string) => {
    setDaycareError("");
    if (!API_BASE_URL) {
      setDaycareError("API configuration error. Please contact support.");
      return;
    }
    if (!daycareSelectedDoctor?.value || !daycareName.trim() || !daycarePhone) {
      setDaycareError("Please fill required fields: Doctor, Patient name, Phone.");
      return;
    }
    if (!daycareSelectedPatient?._id) {
      const daycarePhoneValidation = validateIndianMobilePhone(daycarePhone);
      if (!daycarePhoneValidation.valid) {
        setDaycareError(daycarePhoneValidation.message ?? "Invalid phone number.");
        return;
      }
    }
    setDaycareLoading(true);
    try {
      const bedChargesTypeLabel = daycareBedChargesType?.label?.split("(")[0]?.trim() ?? "";
      const daycareChargesFields =
        daycareBedChargesType?.value === "custom"
          ? {
              daycareChargesType: "Custom" as const,
              customDaycareRate: Math.max(0, Number(daycareCustomRate) || 0),
            }
          : {
              daycareChargesType: bedChargesTypeLabel || undefined,
              daycareChargesHours: daycareBedChargesHours || 1,
              bedChargesType: bedChargesTypeLabel || undefined,
              bedChargesHours: daycareBedChargesHours || 1,
              bedChargesRate: daycareBedChargesRate || 0,
            };
      const procedureIds = Array.from(
        new Set(
          daycareAddedProcedures
            .map((p) => p.id)
            .filter((id) => Boolean(id) && daycareProcedurePriceById[id] != null)
        )
      );
      const doctorVisitCharges = daycareDoctorVisitCharges === "Yes";
      const appointmentDate = formatDaycareVisitDate() || undefined;

      const addDaycareTransactionIfAmountReceived = async (visitId: string) => {
        const amount = Number(daycareAmountReceived) || 0;
        if (amount <= 0) return;
        await axios.post(`${API_BASE_URL}/hospital/transactions`, {
          visitId,
          transactionType: "Payment",
          amount,
          paymentMode: daycarePaymentMode,
        });
      };

      const daycareDiscountNum = Number(daycareDiscount) || 0;
      const daycareBasePayload: { discount: number; discountPassword?: string } = {
        discount: daycareDiscountNum,
      };
      const trimmedDaycareDiscountPwd = discountPwd?.trim() ?? "";
      if (daycareDiscountNum > 0 && trimmedDaycareDiscountPwd) {
        daycareBasePayload.discountPassword = trimmedDaycareDiscountPwd;
      }

      if (daycareSelectedPatient?._id) {
        const response = await axios.post(
          `${API_BASE_URL}/hospital/daycare-appointments`,
          {
            patientId: daycareSelectedPatient._id,
            doctorId: daycareSelectedDoctor.value,
            ...daycareChargesFields,
            procedureIds,
            doctorVisitCharges,
            appointmentDate,
            ...daycareBasePayload,
          }
        );
        const visitId =
          response?.data?.data?._id ??
          response?.data?.data?.daycareAppointment?._id ??
          response?.data?._id;
        if (visitId && daycareAmountReceived > 0) {
          try {
            await addDaycareTransactionIfAmountReceived(visitId);
          } catch (txErr) {
            console.error("Daycare created but transaction failed:", txErr);
          }
        }
      } else {
        // New patient: create daycare appointment with embedded patient
        const patientPayload = {
          title: daycareTitle?.value || "",
          name: daycareName.trim(),
          phone: formatPatientPhoneForApi(daycarePhone),
          email: daycareEmail || undefined,
          age: calculateDaycareAge(),
          gender: daycareGender?.value !== "Select" ? daycareGender?.value : "",
          bloodGroup: daycareBloodGroup?.value !== "Select" ? daycareBloodGroup?.value : undefined,
          address: daycareAddress || undefined,
          aadharNo: daycareAadharNo || undefined,
          ayushmanCardNo: daycareAyushmanNo || undefined,
        };

        const response = await axios.post(
          `${API_BASE_URL}/hospital/daycare-appointments/with-patient`,
          {
            patient: patientPayload,
            doctorId: daycareSelectedDoctor.value,
            ...daycareChargesFields,
            procedureIds,
            doctorVisitCharges,
            appointmentDate,
            ...daycareBasePayload,
          }
        );
        const visitId =
          response?.data?.data?._id ??
          response?.data?.data?.daycareAppointment?._id ??
          response?.data?._id;
        if (visitId && daycareAmountReceived > 0) {
          try {
            await addDaycareTransactionIfAmountReceived(visitId);
          } catch (txErr) {
            console.error("Daycare created but transaction failed:", txErr);
          }
        }
      }

      router.push(all_routes.daycareAppointments);
    } catch (err: any) {
      const daycareErrMessage =
        err?.response?.data?.message || "Failed to create Daycare appointment.";
      if (discountPwd !== undefined && (Number(daycareDiscount) || 0) > 0) {
        setDaycareDiscountPasswordError(String(daycareErrMessage));
        setDaycareShowDiscountPasswordDialog(true);
        setDaycareError("");
      } else {
        setDaycareError(daycareErrMessage);
      }
    } finally {
      setDaycareLoading(false);
    }
  };

  const handleDaycareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (daycareDiscount > 0) {
      setDaycareDiscountPassword("");
      setDaycareDiscountPasswordError("");
      setDaycareShowDiscountPasswordDialog(true);
      return;
    }
    void doDaycareSubmit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      if (!API_BASE_URL) {
        const errorMsg = "API configuration error. Please contact support.";
        setError(errorMsg);
        console.error("API_BASE_URL is undefined. Check .env.local file.");
        alert(errorMsg);
        return;
      }

      if (!selectedDoctor?.value) {
        const errorMsg = "Please select a doctor";
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      if (!name.trim()) {
        const errorMsg = "Please enter patient name";
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      if (!phone) {
        const errorMsg = "Please enter patient phone number";
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      if (!selectedPatient) {
        const phoneValidation = validateIndianMobilePhone(phone);
        if (!phoneValidation.valid) {
          const errorMsg = phoneValidation.message ?? "Invalid phone number.";
          setError(errorMsg);
          alert(errorMsg);
          return;
        }
      }

      if (!visitDate) {
        const errorMsg = "Please select visit date";
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      if (discount > 0) {
        setDiscountPassword("");
        setDiscountPasswordError("");
        setShowDiscountPasswordDialog(true);
        return;
      }

      doCreateAppointment(undefined);
    } catch (err) {
      setError("Validation failed.");
    }
  };

  const doCreateAppointment = async (discountPwd: string | undefined) => {
    if (!API_BASE_URL || !selectedDoctor?.value || !name.trim() || !phone || !visitDate) return;
    setLoading(true);
    setError("");
    try {
      const createTransactionIfAmountReceived = async (visitId: string) => {
        const amount = Number(amountReceived) || 0;
        if (amount <= 0) return;
        await axios.post(`${API_BASE_URL}/hospital/transactions`, {
          visitId,
          transactionType: "Payment",
          amount,
          paymentMode: paymentMode,
        });
      };

      const discountNum = Number(discount) || 0;
      const visitPayloadBase = {
        discount: discountNum,
        ...(discountNum > 0 && discountPwd !== undefined && discountPwd !== "" && { discountPassword: discountPwd }),
      };
      const sessionSlotValue =
        sessionSlot?.value && sessionSlot.value !== "Select"
          ? sessionSlot.value
          : undefined;

      if (selectedPatient) {
        const appointmentData = {
          patientId: selectedPatient._id,
          doctorId: selectedDoctor.value,
          visitType: visitType?.value !== "Select" ? visitType?.value : "",
          appointmentType: appointmentType,
          reason: reason || undefined,
          visitDate: formatVisitDate(),
          visitTime: visitTime ? formatVisitTime() : undefined,
          sessionSlot: sessionSlotValue,
          attendantName: attendantName || undefined,
          attendantRelation: attendantRelation || undefined,
          ...visitPayloadBase,
        };

        console.log("Submitting appointment for existing patient:", appointmentData);

        const response = await axios.post(`${API_BASE_URL}/hospital/visits`, appointmentData);
        const isSuccess = response.status >= 200 && response.status < 300;
        const hasSuccessCode = response.data?.code === 200;

        if (isSuccess || hasSuccessCode) {
          const visitId = response.data?.data?.visit?._id ?? response.data?.data?._id;
          if (visitId && amountReceived > 0) {
            try {
              await createTransactionIfAmountReceived(visitId);
            } catch (txErr) {
              console.error("Visit created but transaction failed:", txErr);
            }
          }
          router.push(all_routes.appointments);
          return;
        } else {
          const errorMsg = response.data?.message || "Failed to create appointment. Please try again.";
          if (discountPwd !== undefined && discount > 0) {
            setDiscountPasswordError(errorMsg);
            setShowDiscountPasswordDialog(true);
            setError("");
            return;
          }
          setError(errorMsg);
          console.error("Failed to create appointment:", response.data);
          alert(errorMsg);
          return;
        }
      }

      // For new patients, use /hospital/visits/with-patient endpoint
      const patientPayload: Record<string, unknown> = {
        title: title?.value || "",
        name: name.trim(),
        phone: formatPatientPhoneForApi(phone),
        email: email || undefined,
        age: calculateAge(),
        months: parseAgeComponent(ageMonths),
        days: parseAgeComponent(ageDays),
        gender: gender?.value !== "Select" ? gender?.value : "",
        bloodGroup: bloodGroup?.value !== "Select" ? bloodGroup?.value : undefined,
        address: address || undefined,
        aadharNo: aadharNo || undefined,
        ayushmanCardNo: ayushmanNo || undefined,
        ...(visitType?.value === "MR"
          ? {
              companyName: companyName.trim() || undefined,
              division: division.trim() || undefined,
            }
          : {}),
      };
      const formattedDob = formatDob();
      if (formattedDob) patientPayload.dob = formattedDob;

      const appointmentData = {
        patient: patientPayload,
        doctorId: selectedDoctor.value,
        visitType: visitType?.value !== "Select" ? visitType?.value : "",
        appointmentType: appointmentType,
        reason: reason || undefined,
        visitDate: formatVisitDate(),
        visitTime: formatVisitTime(),
        sessionSlot: sessionSlotValue,
        attendantName: attendantName || undefined,
        attendantRelation: attendantRelation || undefined,
        ...visitPayloadBase,
      };

      console.log("Submitting appointment for new patient:", appointmentData);

      const response = await axios.post(`${API_BASE_URL}/hospital/visits/with-patient`, appointmentData);
      const isSuccess = response.status >= 200 && response.status < 300;
      const hasSuccessCode = response.data?.code === 200;

      if (isSuccess || hasSuccessCode) {
        const visitId = response.data?.data?.visit?._id ?? response.data?.data?._id;
        if (visitId && amountReceived > 0) {
          try {
            await createTransactionIfAmountReceived(visitId);
          } catch (txErr) {
            console.error("Visit created but transaction failed:", txErr);
          }
        }
        router.push(all_routes.appointments);
      } else {
        const errorMsg = response.data?.message || "Failed to create appointment. Please try again.";
        if (discountPwd !== undefined && discount > 0) {
          setDiscountPasswordError(errorMsg);
          setShowDiscountPasswordDialog(true);
          setError("");
          return;
        }
        setError(errorMsg);
        console.error("Failed to create appointment:", response.data);
        alert(errorMsg);
      }
    } catch (error: any) {
      let errorMessage = "An error occurred while creating the appointment. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        const apiMessage = data?.message;
        
        if (status === 400) {
          errorMessage = apiMessage || "Invalid data provided. Please check all fields and try again.";
        } else if (status === 401) {
          errorMessage = apiMessage || "Unauthorized. Please login again.";
        } else if (status === 403) {
          errorMessage = apiMessage || "You don't have permission to perform this action.";
        } else if (status === 404) {
          errorMessage = apiMessage || "Resource not found. Please check the details and try again.";
        } else if (status === 409) {
          errorMessage = apiMessage || "Conflict: This appointment or patient already exists. Please check the details and try again.";
        } else if (status === 500) {
          errorMessage = apiMessage || "Server error occurred. Please try again later or contact support.";
        } else {
          errorMessage = apiMessage || `Error ${status}: ${data?.error || "An unexpected error occurred"}`;
        }

        // Log detailed error for debugging
        if (data?.errors) {
          console.error("Validation errors:", data.errors);
          const validationErrors = Object.entries(data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("\n");
          errorMessage += `\n\nValidation Errors:\n${validationErrors}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error("Network Error - No response received:", error.request);
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else {
        // Error setting up the request
        console.error("Error setting up request:", error.message);
        errorMessage = `Error: ${error.message}`;
      }

      setError(errorMessage);
      if (discountPwd !== undefined && discount > 0) {
        setDiscountPasswordError(errorMessage);
        setShowDiscountPasswordDialog(true);
        setError("");
      } else {
        setError(errorMessage);
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountPasswordConfirm = () => {
    if (!discountPassword.trim()) {
      setDiscountPasswordError("Please enter the discount password.");
      return;
    }
    setDiscountPasswordError("");
    doCreateAppointment(discountPassword.trim());
  };

  const handleDiscountPasswordCancel = () => {
    setShowDiscountPasswordDialog(false);
    setDiscountPassword("");
    setDiscountPasswordError("");
  };

  const handleDaycareDiscountPasswordConfirm = () => {
    if (!daycareDiscountPassword.trim()) {
      setDaycareDiscountPasswordError("Please enter the discount password.");
      return;
    }
    setDaycareDiscountPasswordError("");
    void doDaycareSubmit(daycareDiscountPassword.trim());
  };

  const handleDaycareDiscountPasswordCancel = () => {
    setDaycareShowDiscountPasswordDialog(false);
    setDaycareDiscountPassword("");
    setDaycareDiscountPasswordError("");
  };

  const handleIpdAddProcedure = useCallback((option: Option | null) => {
    if (!option?.value) return;
    if (ipdProcedurePriceById[option.value] == null) return;
    const price = ipdProcedurePriceById[option.value] ?? 0;
    setIpdAddedProcedures((prev) =>
      addIpdProcedureRow(prev, { id: option.value, name: option.label, price })
    );
    setIpdAddProcedureSelect(null);
  }, [ipdProcedurePriceById]);

  const handleIpdIncrementProcedureUnits = useCallback((id: string) => {
    setIpdAddedProcedures((prev) => incrementIpdProcedureUnits(prev, id));
  }, []);

  const handleIpdDecrementProcedureUnits = useCallback((id: string) => {
    setIpdAddedProcedures((prev) => decrementIpdProcedureUnits(prev, id));
  }, []);

  const handleIpdRemoveProcedure = useCallback((id: string) => {
    setIpdAddedProcedures((prev) => removeIpdProcedureRow(prev, id));
  }, []);

  const handleIpdDoctorChange = useCallback((option: Option | null) => {
    setIpdSelectedDoctor(option);
  }, []);

  const handleIpdAddVisitingDoctor = useCallback(
    (option: Option | null) => {
      if (!option?.value) return;
      const doctor = doctors.find((d) => d._id === option.value);
      const chargePerDay = getIpdDoctorVisitingCharge(doctor?.visitTypes);
      setIpdDoctorVisits((prev) =>
        addIpdDoctorVisitRow(prev, {
          doctorId: option.value,
          name: option.label ?? doctor?.name ?? "—",
          chargePerDay,
        })
      );
      setIpdAddVisitingDoctorSelect(null);
    },
    [doctors]
  );

  const handleIpdIncrementDoctorVisitDays = useCallback((doctorId: string) => {
    setIpdDoctorVisits((prev) => incrementIpdDoctorVisitDays(prev, doctorId));
  }, []);

  const handleIpdDecrementDoctorVisitDays = useCallback((doctorId: string) => {
    setIpdDoctorVisits((prev) => decrementIpdDoctorVisitDays(prev, doctorId));
  }, []);

  const handleIpdRemoveVisitingDoctor = useCallback((doctorId: string) => {
    setIpdDoctorVisits((prev) => removeIpdDoctorVisitRow(prev, doctorId));
  }, []);

  useEffect(() => {
    const fetchIpdProcedures = async () => {
      if (!API_BASE_URL) return;
      try {
        setIpdProceduresLoading(true);
        const res = await axios.get(`${API_BASE_URL}/hospital/procedures`, { params: { limit: 50 } });
        const list = res.data?.data?.procedures ?? res.data?.data ?? [];
        const arr = Array.isArray(list) ? list : [];
        setIpdProceduresOptions(
          arr.map((p: { _id: string; procedureName?: string }) => ({
            value: p._id,
            label: p.procedureName ?? "—",
          }))
        );
        const priceMap: Record<string, number> = {};
        arr.forEach((p: { _id: string; price?: number; basePrice?: number }) => {
          priceMap[p._id] = p.price ?? p.basePrice ?? 0;
        });
        setIpdProcedurePriceById(priceMap);
      } catch {
        setIpdProceduresOptions([]);
        setIpdProcedurePriceById({});
      } finally {
        setIpdProceduresLoading(false);
      }
    };
    if (appointmentTab === "IPD") void fetchIpdProcedures();
  }, [appointmentTab]);

  useEffect(() => {
    if (appointmentTab !== "IPD") {
      setIpdFormStep(1 as 1 | 2 | 3);
      setIpdSelectedBedId(null);
      setIpdSelectedBed(null);
      setIpdBedSummarySnapshot(null);
      setIpdBedBlockData(null);
      setIpdBedsError("");
      setIpdSelectedWardFilterId(null);
    }
  }, [appointmentTab]);

  const loadIpdWardOptions = useCallback(async () => {
    setIpdWardsLoading(true);
    try {
      const options = await fetchIpdWardOptions();
      setIpdWardOptions(options);
    } catch {
      setIpdWardOptions([]);
    } finally {
      setIpdWardsLoading(false);
    }
  }, []);

  const loadIpdBedBlockView = useCallback(async (wardId?: string | null) => {
    setIpdBedsLoading(true);
    setIpdBedsError("");
    try {
      const data = await fetchIpdBedBlockView(wardId);
      setIpdBedBlockData(data);
      if (!data?.wards?.length) {
        setIpdBedsError(
          wardId
            ? "No beds found for this ward."
            : "No beds found. Add beds in Administration → Beds."
        );
      }
    } catch {
      setIpdBedBlockData(null);
      setIpdBedsError("Could not load beds. Please try again.");
    } finally {
      setIpdBedsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (appointmentTab !== "IPD") return;
    void loadIpdWardOptions();
    void loadIpdBedBlockView(null);
  }, [appointmentTab, loadIpdWardOptions, loadIpdBedBlockView]);

  useEffect(() => {
    if (!ipdSelectedBedId) {
      setIpdBedSummarySnapshot(null);
      return;
    }
    const resolved = resolveIpdBedSummary(
      ipdBedBlockData,
      ipdSelectedBedId,
      ipdSelectedBed?.bedCode,
      ipdWardOptions
    );
    if (resolved.wardName || resolved.ratePerDay != null || resolved.bedCode) {
      setIpdBedSummarySnapshot(resolved);
    }
  }, [ipdBedBlockData, ipdSelectedBedId, ipdSelectedBed?.bedCode, ipdWardOptions]);

  const handleIpdWardFilterChange = useCallback(
    (wardId: string | null) => {
      setIpdSelectedWardFilterId(wardId);
      setIpdSelectedBedId(null);
      setIpdSelectedBed(null);
      setIpdBedSummarySnapshot(null);
      void loadIpdBedBlockView(wardId);
    },
    [loadIpdBedBlockView]
  );

  const validateIpdPatientStep = (): boolean => {
    setIpdError("");
    if (!ipdName.trim() || !ipdPhone) {
      setIpdError("Please fill required fields: Patient name, Phone.");
      return false;
    }
    if (!ipdSelectedPatient?._id) {
      const ipdPhoneValidation = validateIndianMobilePhone(ipdPhone);
      if (!ipdPhoneValidation.valid) {
        setIpdError(ipdPhoneValidation.message ?? "Invalid phone number.");
        return false;
      }
    }
    return true;
  };

  const validateIpdStep1 = (): boolean => {
    setIpdError("");
    if (!ipdSelectedDoctor?.value || !ipdName.trim() || !ipdPhone) {
      setIpdError("Please fill required fields: Doctor, Patient name, Phone.");
      return false;
    }
    if (!ipdSelectedPatient?._id) {
      const ipdPhoneValidation = validateIndianMobilePhone(ipdPhone);
      if (!ipdPhoneValidation.valid) {
        setIpdError(ipdPhoneValidation.message ?? "Invalid phone number.");
        return false;
      }
    }
    return true;
  };

  const handleIpdGoToIpdDetailsStep = () => {
    if (!validateIpdPatientStep()) return;
    setIpdFormStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleIpdGoToBedStep = async () => {
    if (!validateIpdStep1()) return;
    setIpdFormStep(3);
    setIpdSelectedWardFilterId(null);
    void loadIpdWardOptions();
    await loadIpdBedBlockView(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleIpdSelectBed = (bed: IIpdBed) => {
    setIpdSelectedBedId(bed._id);
    setIpdSelectedBed(bed);
    setIpdBedSummarySnapshot(
      resolveIpdBedSummary(ipdBedBlockData, bed._id, bed.bedCode, ipdWardOptions)
    );
    setIpdError("");
  };

  const searchIpdPatients = useCallback(async (searchText: string) => {
    try {
      if (!API_BASE_URL) return;
      setIpdSearchingPatients(true);
      const response = await axios.get(`${API_BASE_URL}/hospital/patients`, {
        params: { limit: 20, page: 1, search: searchText.trim() },
      });
      if (response.data?.code === 200 && response.data?.data?.patients) {
        const patients = response.data.data.patients;
        setIpdPatientSearchResults(patients);
        setIpdShowPatientDropdown(patients.length > 0 && !ipdSelectedPatient);
      } else {
        setIpdPatientSearchResults([]);
        setIpdShowPatientDropdown(false);
      }
    } catch {
      setIpdPatientSearchResults([]);
      setIpdShowPatientDropdown(false);
    } finally {
      setIpdSearchingPatients(false);
    }
  }, [ipdSelectedPatient]);

  useEffect(() => {
    if (!ipdPhone || ipdPhone.trim().length === 0) {
      setIpdPatientSearchResults([]);
      setIpdShowPatientDropdown(false);
      setIpdSelectedPatient(null);
      return;
    }
    const searchTimeout = setTimeout(() => {
      if (ipdPhone.trim().length >= 2) void searchIpdPatients(ipdPhone.trim());
      else {
        setIpdPatientSearchResults([]);
        setIpdShowPatientDropdown(false);
        setIpdSelectedPatient(null);
      }
    }, 500);
    return () => clearTimeout(searchTimeout);
  }, [ipdPhone, searchIpdPatients]);

  const handleIpdPatientSelect = async (patient: IPatient) => {
    setIpdSelectedPatient(patient);
    setIpdShowPatientDropdown(false);
    setIpdName(patient.name || "");
    setIpdEmail(patient.email || "");
    setIpdPhone(patient.phone || "");
    if (patient.title) {
      const titleOption = Title.find((t) => t.value === patient.title);
      if (titleOption) setIpdTitle(titleOption);
    }
    if (patient.gender) {
      const genderOption = Gender.find((g) => g.value === patient.gender);
      if (genderOption) setIpdGender(genderOption);
    }
    if (patient.bloodGroup) {
      const bloodGroupOption = Blood_Group.find((b) => b.value === patient.bloodGroup);
      if (bloodGroupOption) setIpdBloodGroup(bloodGroupOption);
    }
    if (patient.dob) {
      const dobDate = dayjs(patient.dob);
      setIpdDob(dobDate);
      handleIpdDobChange(dobDate);
    }
    if (patient.age != null) setIpdAgeYears(String(patient.age));
    if (patient.months != null) setIpdAgeMonths(String(patient.months));
    if (patient.days != null) setIpdAgeDays(String(patient.days));
    setIpdAddress(patient.address || "");
    setIpdAadharNo(patient.aadharNo || "");
    setIpdPhotoFile(null);
    setIpdAadharFile(null);
    setIpdPatientPhotoUrl(patient.imageUrl || "");
    setIpdPatientAadharDocUrl(patient.aadharS3Url || "");
    setIpdAyushmanNo(patient.ayushmanCardNo || "");
    const maritalStatusValue = getPatientMaritalStatus(patient);
    if (maritalStatusValue) {
      const maritalOption = Marital_Status.find((m) => m.value === maritalStatusValue);
      if (maritalOption) setIpdMaritalStatus(maritalOption);
    } else {
      setIpdMaritalStatus(Marital_Status[0] || null);
    }
    setIpdDrugSensitivity(patient.drugSensitivity || "");
    setIpdOccupation(patient.occupation || "");
  };

  const handleIpdDobChange = (date: unknown) => {
    setIpdDob(date);
    if (date) {
      const birthDate = dayjs.isDayjs(date) ? date.toDate() : new Date(date as string);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();
      let days = today.getDate() - birthDate.getDate();
      if (days < 0) {
        months--;
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      setIpdAgeYears(years.toString());
      setIpdAgeMonths(months.toString());
      setIpdAgeDays(days.toString());
    } else {
      setIpdAgeYears("");
      setIpdAgeMonths("");
      setIpdAgeDays("");
    }
  };

  const handleIpdTitleChange = useCallback((option: Option | null) => {
    setIpdTitle(option);
    if (!option?.value) return;
    if (option.value === "Mr." || option.value === "Master") {
      const male = Gender.find((g) => g.value === "Male");
      if (male) setIpdGender(male);
    } else if (option.value === "Mrs." || option.value === "Ms.") {
      const female = Gender.find((g) => g.value === "Female");
      if (female) setIpdGender(female);
    } else if (option.value === "Dr." || option.value === "Prof." || option.value === "Baby") {
      setIpdGender(Gender.find((g) => g.value === "Select") ?? Gender[0]);
    }
  }, []);

  const calculateIpdAge = (): number => {
    if (ipdAgeYears) return parseInt(ipdAgeYears, 10);
    if (ipdDob) {
      const birthDate = dayjs.isDayjs(ipdDob) ? ipdDob.toDate() : new Date(ipdDob);
      return dayjs().diff(dayjs(birthDate), "year");
    }
    return 0;
  };

  const formatIpdVisitDate = (): string => {
    return dayjs().format("YYYY-MM-DD");
  };

  const buildIpdCreatePayload = (): IIpdCreatePayload | null => {
    const doctorId = ipdSelectedDoctor?.value;
    const bedId = ipdSelectedBedId;
    if (!doctorId || !bedId) return null;

    const procedureCharges: IIpdBillingCharge[] = ipdAddedProcedures
      .filter((p) => p.id && ipdProcedurePriceById[p.id] != null && p.units > 0)
      .map((p) => ({
        type: "procedure",
        procedureId: p.id,
        units: p.units,
      }));
    const billingCharges = [
      ...procedureCharges,
      ...buildIpdDoctorBillingCharges(ipdDoctorVisits, doctorId),
    ];

    const payload: IIpdCreatePayload = {
      doctorId,
      bedId,
      admissionDate: formatIpdVisitDate(),
      reason: ipdNotes.trim(),
      billingCharges,
    };

    if (ipdSelectedPatient?._id) {
      payload.patientId = ipdSelectedPatient._id;
    } else {
      payload.patientData = {
        title: ipdTitle?.value && ipdTitle.value !== "Select" ? ipdTitle.value : "",
        name: ipdName.trim(),
        phone: formatPatientPhoneForApi(ipdPhone),
        age: calculateIpdAge(),
        months: parseAgeComponent(ipdAgeMonths),
        days: parseAgeComponent(ipdAgeDays),
        gender: ipdGender?.value !== "Select" ? ipdGender?.value ?? "" : "",
        ...(ipdBloodGroup?.value && ipdBloodGroup.value !== "Select"
          ? { bloodGroup: ipdBloodGroup.value }
          : {}),
        ...(ipdAddress.trim() ? { address: ipdAddress.trim() } : {}),
        ...(ipdMaritalStatus?.value && ipdMaritalStatus.value !== "Select"
          ? { maritalStatus: ipdMaritalStatus.value }
          : {}),
        ...(ipdOccupation.trim() ? { occupation: ipdOccupation.trim() } : {}),
        ...(ipdDrugSensitivity.trim() ? { drugSensitivity: ipdDrugSensitivity.trim() } : {}),
        ...(ipdAadharNo.trim() ? { aadharNo: ipdAadharNo.trim() } : {}),
        ...(ipdAyushmanNo.trim() ? { ayushmanCardNo: ipdAyushmanNo.trim() } : {}),
        ...(ipdPatientAadharDocUrl && !ipdAadharFile
          ? { aadharS3Url: ipdPatientAadharDocUrl }
          : {}),
        ...(ipdPatientPhotoUrl && !ipdPhotoFile ? { imageUrl: ipdPatientPhotoUrl } : {}),
      };
    }

    const amount = Number(ipdAmountReceived) || 0;
    if (amount > 0) {
      payload.transaction = {
        transactionType: "Payment",
        amount,
        paymentMode: ipdPaymentMode,
      };
    }

    payload.isMLC = ipdMlc;
    if (ipdMlc) {
      payload.mlc = {
        markOfIdentification: ipdMlcData.markOfIdentification.trim(),
        thanaName: ipdMlcData.thanaName.trim(),
        patientBroughtBy: ipdMlcData.patientBroughtBy.trim(),
        placeOfAccident: ipdMlcData.placeOfAccident.trim(),
      };
    }

    return payload;
  };

  const buildIpdMultipartBody = (payload: IIpdCreatePayload): FormData => {
    const formData = new FormData();
    formData.append("doctorId", payload.doctorId);
    formData.append("bedId", payload.bedId);
    formData.append("admissionDate", payload.admissionDate);
    formData.append("reason", payload.reason);
    formData.append("billingCharges", JSON.stringify(payload.billingCharges));
    if (payload.patientId) formData.append("patientId", payload.patientId);
    if (payload.patientData) formData.append("patientData", JSON.stringify(payload.patientData));
    if (payload.isMLC != null) formData.append("isMLC", String(payload.isMLC));
    if (payload.mlc) formData.append("mlc", JSON.stringify(payload.mlc));
    if (payload.transaction) formData.append("transaction", JSON.stringify(payload.transaction));
    if (ipdPhotoFile) formData.append("patientPhoto", ipdPhotoFile);
    if (ipdAadharFile) formData.append("aadharDocument", ipdAadharFile);
    return formData;
  };

  const handleIpdMlcToggle = (checked: boolean) => {
    setIpdMlc(checked);
    if (!checked) setIpdMlcData(emptyIpdMlcData());
  };

  const doIpdSubmit = async () => {
    setIpdError("");
    if (!API_BASE_URL) {
      setIpdError("API configuration error. Please contact support.");
      return;
    }
    if (!validateIpdStep1()) return;
    if (!ipdSelectedBedId) {
      setIpdError("Please select an available bed.");
      setIpdFormStep(3);
      return;
    }
    const doctorId = ipdSelectedDoctor?.value;
    if (!doctorId) {
      setIpdError("Please select a consulting doctor.");
      return;
    }
    const reason = ipdNotes.trim();
    if (!reason) {
      setIpdError("Please enter reason for admission in Notes.");
      setIpdFormStep(2);
      return;
    }

    const payload = buildIpdCreatePayload();
    if (!payload) {
      setIpdError("Please complete required IPD fields.");
      return;
    }

    setIpdLoading(true);
    try {
      const hasUploads = !!(ipdPhotoFile || ipdAadharFile);
      const response = hasUploads
        ? await axios.post(`${API_BASE_URL}/hospital/ipd`, buildIpdMultipartBody(payload), {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await axios.post(`${API_BASE_URL}/hospital/ipd`, payload);
      const ok = response?.status >= 200 && response?.status < 300;
      const codeOk = response?.data?.code === 200 || response?.data?.code === "200";
      if (!ok && !codeOk) {
        setIpdError(response?.data?.message ?? "Failed to create IPD admission.");
        return;
      }
      router.push(all_routes.ipdAppointments);
    } catch (err: unknown) {
      const ipdErrMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create IPD admission.";
      setIpdError(ipdErrMessage);
    } finally {
      setIpdLoading(false);
    }
  };

  const handleIpdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ipdFormStep === 1) {
      handleIpdGoToIpdDetailsStep();
      return;
    }
    if (ipdFormStep === 2) {
      void handleIpdGoToBedStep();
      return;
    }
    if (!ipdSelectedBedId) {
      setIpdError("Please select an available bed.");
      return;
    }
    void doIpdSubmit();
  };

  const handleIpdDiscountPasswordConfirm = () => {
    if (!ipdDiscountPassword.trim()) {
      setIpdDiscountPasswordError("Please enter the discount password.");
      return;
    }
    setIpdDiscountPasswordError("");
    void doIpdSubmit();
  };

  const handleIpdDiscountPasswordCancel = () => {
    setIpdShowDiscountPasswordDialog(false);
    setIpdDiscountPassword("");
    setIpdDiscountPasswordError("");
  };

  return (
    <>
      {/* OPD Discount password dialog */}
      {showDiscountPasswordDialog && (
        <div
          className="modal fade show d-block"
          id="discount-password-modal"
          tabIndex={-1}
          aria-labelledby="discount-password-label"
          aria-modal="true"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="discount-password-label">
                  Discount password
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleDiscountPasswordCancel}
                />
              </div>
              <div className="modal-body">
                <label htmlFor="discount-password-input" className="form-label">
                  Enter password to apply discount
                </label>
                {discountPasswordError ? (
                  <div className="alert alert-danger py-2 mb-2" role="alert">
                    {discountPasswordError}
                  </div>
                ) : null}
                <input
                  id="discount-password-input"
                  type="password"
                  className="form-control"
                  value={discountPassword}
                  onChange={(e) => setDiscountPassword(e.target.value)}
                  placeholder="Password"
                  onKeyDown={(e) => e.key === "Enter" && handleDiscountPasswordConfirm()}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={handleDiscountPasswordCancel}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleDiscountPasswordConfirm}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .page-wrapper input::placeholder,
          .page-wrapper textarea::placeholder {
            color: #000 !important;
            opacity: 1;
          }
          .page-wrapper input::-webkit-input-placeholder,
          .page-wrapper textarea::-webkit-input-placeholder {
            color: #000 !important;
          }
          .page-wrapper input::-moz-placeholder,
          .page-wrapper textarea::-moz-placeholder {
            color: #000 !important;
            opacity: 1;
          }
          .page-wrapper input:-ms-input-placeholder,
          .page-wrapper textarea:-ms-input-placeholder {
            color: #000 !important;
          }
          /* Darker borders and black text on form fields only (not section headings) */
          .page-wrapper .card .form-label,
          .page-wrapper .card .form-check-label,
          .page-wrapper .card .form-control,
          .page-wrapper .card .ant-picker,
          .page-wrapper .card .ant-picker-input > input,
          .page-wrapper .card input:not([type="radio"]):not([type="checkbox"]),
          .page-wrapper .card textarea,
          .page-wrapper .card .react-select__single-value {
            border-color: #000 !important;
            color: #000 !important;
          }
          .page-wrapper .card .ant-picker {
            border-color: #000 !important;
          }
          .page-wrapper .card h6.fw-bold.text-primary {
            color: #2E37A4 !important;
          }
          .page-wrapper .card .btn.btn-primary,
          .page-wrapper .card .btn.btn-primary:hover,
          .page-wrapper .card .btn.btn-primary:focus,
          .page-wrapper .card .btn.btn-primary:active,
          .page-wrapper .card .btn.btn-primary:disabled {
            color: #fff !important;
          }
          /* react-select menu lives inside .card; the rule above forces black text with !important
             and beats inline/emotion styles. Exceptions must be more specific (3+ classes). */
          .page-wrapper .card .react-select__menu .react-select__option--is-focused,
          .page-wrapper .card .react-select__menu .react-select__option--is-selected {
            color: #ffffff !important;
            background-color: #2e37a4 !important;
          }
          .page-wrapper .card .react-select__menu .react-select__option--is-focused *,
          .page-wrapper .card .react-select__menu .react-select__option--is-selected * {
            color: #ffffff !important;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          /* OPD / Daycare tabs reuse global nav-tabs styling from appointment list */
        `,
        }}
      />
      {/* IPD Discount password dialog */}
      {ipdShowDiscountPasswordDialog && (
        <div
          className="modal fade show d-block"
          id="ipd-discount-password-modal"
          tabIndex={-1}
          aria-labelledby="ipd-discount-password-label"
          aria-modal="true"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="ipd-discount-password-label">
                  Discount password
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleIpdDiscountPasswordCancel}
                />
              </div>
              <div className="modal-body">
                <label htmlFor="ipd-discount-password-input" className="form-label">
                  Enter password to apply discount
                </label>
                {ipdDiscountPasswordError ? (
                  <div className="alert alert-danger py-2 mb-2" role="alert">
                    {ipdDiscountPasswordError}
                  </div>
                ) : null}
                <input
                  id="ipd-discount-password-input"
                  type="password"
                  className="form-control"
                  value={ipdDiscountPassword}
                  onChange={(e) => setIpdDiscountPassword(e.target.value)}
                  placeholder="Password"
                  onKeyDown={(e) => e.key === "Enter" && handleIpdDiscountPasswordConfirm()}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={handleIpdDiscountPasswordCancel}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleIpdDiscountPasswordConfirm}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Daycare Discount password dialog */}
      {daycareShowDiscountPasswordDialog && (
        <div
          className="modal fade show d-block"
          id="daycare-discount-password-modal"
          tabIndex={-1}
          aria-labelledby="daycare-discount-password-label"
          aria-modal="true"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="daycare-discount-password-label">
                  Discount password
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleDaycareDiscountPasswordCancel}
                />
              </div>
              <div className="modal-body">
                <label htmlFor="daycare-discount-password-input" className="form-label">
                  Enter password to apply discount
                </label>
                {daycareDiscountPasswordError ? (
                  <div className="alert alert-danger py-2 mb-2" role="alert">
                    {daycareDiscountPasswordError}
                  </div>
                ) : null}
                <input
                  id="daycare-discount-password-input"
                  type="password"
                  className="form-control"
                  value={daycareDiscountPassword}
                  onChange={(e) => setDaycareDiscountPassword(e.target.value)}
                  placeholder="Password"
                  onKeyDown={(e) => e.key === "Enter" && handleDaycareDiscountPasswordConfirm()}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={handleDaycareDiscountPasswordCancel}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleDaycareDiscountPasswordConfirm}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* row start */}
          <div className="row">
            <div className="col-12">
              {/* page header start */}
              <div className="mb-1">
                <h6 className="fw-bold mb-0 d-flex align-items-center">
                  <Link href={all_routes.appointments} className="text-dark">
                    <i className="ti ti-chevron-left me-1" />
                    Appointments
                  </Link>
                </h6>
              </div>
              {/* page header end */}
              {/* Error Message Display */}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                  <strong>Error:</strong> {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError("")}
                    aria-label="Close"
                  />
                </div>
              )}
              {daycareError && appointmentTab === "Daycare" && (
                <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                  <strong>Error:</strong> {daycareError}
                  <button type="button" className="btn-close" onClick={() => setDaycareError("")} aria-label="Close" />
                </div>
              )}
              {ipdError && appointmentTab === "IPD" && (
                <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                  <strong>Error:</strong> {ipdError}
                  <button type="button" className="btn-close" onClick={() => setIpdError("")} aria-label="Close" />
                </div>
              )}
              <ul className="nav nav-tabs border-0 mb-0 flex-shrink-0">
                <li className="nav-item">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={appointmentTab === "OPD"}
                    className={`nav-link${appointmentTab === "OPD" ? " active" : ""}`}
                    onClick={() => setAppointmentTab("OPD")}
                  >
                    OPD
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={appointmentTab === "Daycare"}
                    className={`nav-link${appointmentTab === "Daycare" ? " active" : ""}`}
                    onClick={() => setAppointmentTab("Daycare")}
                  >
                    Daycare
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={appointmentTab === "IPD"}
                    className={`nav-link${appointmentTab === "IPD" ? " active" : ""}`}
                    onClick={() => setAppointmentTab("IPD")}
                  >
                    IPD
                  </button>
                </li>
              </ul>
              <div className="tab-content">
                <div className={`tab-pane ${appointmentTab === "OPD" ? "show active" : ""}`} id="opd">
              {/* Patient Details Card */}
              <form onSubmit={handleSubmit}>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="fw-bold text-primary mb-0">Patient Details</h6>
                      {selectedPatient && (
                        <span className="badge badge-soft-success border border-success fw-medium">
                          Existing Patient
                        </span>
                      )}
                    </div>
                    {/* <Link href={all_routes.createPatient} className="btn btn-primary btn-sm">
                      <i className="ti ti-circle-plus me-1" />
                      New Patient
                    </Link> */}
                  </div>
                  <div className="form">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="mb-3 position-relative patient-search-container">
                          <label className="form-label mb-1 fw-medium">
                            Phone Number<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={phone}
                            onChange={(e) => {
                              console.log("Search input onChange called with value:", e.target.value);
                              setPhone(e.target.value || "");
                              setSelectedPatient(null); // Clear selected patient when search changes
                            }}
                            placeholder="Enter phone number or name"
                            required
                          />
                          {showPatientDropdown && patientSearchResults.length > 0 && (
                            <div 
                              className="dropdown-menu show position-absolute w-100 mt-1 shadow-lg"
                              style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}
                            >
                              {patientSearchResults.map((patient) => (
                                <button
                                  key={patient._id}
                                  type="button"
                                  className="dropdown-item d-flex align-items-center justify-content-between"
                                  onClick={() => handlePatientSelect(patient)}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <div>
                                    <div className="fw-medium text-dark">{patient.name}</div>
                                    <div className="fs-13 text-muted">{patient.phone}</div>
                                  </div>
                                  <i className="ti ti-arrow-right fs-12 text-muted" />
                                </button>
                              ))}
                            </div>
                          )}
                          {searchingPatients && !showPatientDropdown && (
                            <div className="position-absolute top-100 start-0 w-100 mt-1 p-2 bg-white border rounded shadow-sm">
                              <div className="text-center text-muted fs-13">
                                <i className="ti ti-loader-2 fs-14 me-1" style={{ animation: 'spin 1s linear infinite' }} />
                                Searching...
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Title<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={Title}
                            className="select"
                            value={title}
                            onChange={handleTitleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Name<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter patient name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Gender<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={Gender}
                            className="select"
                            value={gender}
                            onChange={setGender}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Email Address
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Date of Birth
                          </label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              format={{
                                format: "DD-MM-YYYY",
                                type: "mask",
                              }}
                              getPopupContainer={getModalContainer}
                              placeholder="Select DOB"
                              suffixIcon={null}
                              value={dob}
                              onChange={handleDobChange}
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Age<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="row g-2">
                            <div className="col-4">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Years"
                                value={ageYears}
                                onChange={(e) => setAgeYears(e.target.value)}
                              />
                            </div>
                            <div className="col-4">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Months"
                                value={ageMonths}
                                onChange={(e) => setAgeMonths(e.target.value)}
                              />
                            </div>
                            <div className="col-4">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Days"
                                value={ageDays}
                                onChange={(e) => setAgeDays(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Blood Group
                          </label>
                          <CommonSelect
                            options={Blood_Group}
                            className="select"
                            value={bloodGroup}
                            onChange={setBloodGroup}
                          />
                        </div>
                      </div>
                      <div className="col-md-5">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Address
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Aadhar No
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Aadhar number"
                            value={aadharNo}
                            onChange={(e) => setAadharNo(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Ayushman No
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Ayushman card number"
                            value={ayushmanNo}
                            onChange={(e) => setAyushmanNo(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="row g-2">
                          <div className="col-12 col-sm-6 col-lg-3">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">
                                Attendant Name
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter attendant name"
                                value={attendantName}
                                onChange={(e) => setAttendantName(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-12 col-sm-6 col-lg-3">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">
                                Relation to Patient
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Son, Daughter, etc."
                                value={attendantRelation}
                                onChange={(e) => setAttendantRelation(e.target.value)}
                              />
                            </div>
                          </div>
                          {visitType?.value === "MR" && (
                            <>
                              <div className="col-12 col-sm-6 col-lg-3">
                                <div className="mb-3">
                                  <label className="form-label mb-1 fw-medium">Company</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Company name"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="col-12 col-sm-6 col-lg-3">
                                <div className="mb-3">
                                  <label className="form-label mb-1 fw-medium">Division</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Division"
                                    value={division}
                                    onChange={(e) => setDivision(e.target.value)}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Doctor Details and Payment Details in Same Row */}
              <div className="row mb-3">
                {/* Doctor Details Section */}
                <div className="col-lg-7 pe-3">
                  <div className="card h-100">
                    <div className="card-body p-3">
                      <h6 className="fw-bold text-primary mb-2">Doctor Details</h6>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <div className="mb-2">
                            <label className="form-label mb-1 fw-medium">
                              Doctor<span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={doctorOptions}
                              className="select"
                              value={selectedDoctor}
                              onChange={handleDoctorChange}
                              onInputChange={handleDoctorInputChange}
                              isLoading={doctorSearchLoading}
                              placeholder="Select or Search Doctor"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-2">
                            <label className="form-label mb-1 fw-medium">
                              Date of Appointment
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <div className="input-icon-end position-relative date-of-appointment-picker">
                              <DatePicker
                                className="form-control datetimepicker"
                                format={{
                                  format: "DD-MM-YYYY",
                                  type: "mask",
                                }}
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY"
                                suffixIcon={null}
                                value={visitDate}
                                onChange={setVisitDate}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-2">
                            <label className="form-label mb-1 fw-medium">
                              Session Slot
                            </label>
                            <CommonSelect
                              options={sessionOptions}
                              className="select"
                              value={sessionSlot}
                              onChange={setSessionSlot}
                              disabled={!selectedDoctor}
                              placeholder={!selectedDoctor ? "Select doctor first" : undefined}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-2">
                            <label className="form-label mb-1 fw-medium">
                              Time
                            </label>
                            <input
                              type="time"
                              className="form-control"
                              value={visitTime ? dayjs(visitTime).format("HH:mm") : ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setVisitTime(value ? dayjs(value, "HH:mm") : null);
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="mb-2">
                            <label className="form-label mb-1 fw-medium">
                              Visit Type<span className="text-danger ms-1">*</span>
                            </label>
                            <div className="d-flex gap-3 flex-wrap">
                              {Visit_Type.filter((v) => v.value !== "Select").map((type) => {
                                const isDayCare = appointmentType === "Day Care";
                                const isMrOption = type.value === "MR";
                                const isDisabled =
                                  (isDayCare && type.value !== "New") ||
                                  (isMrOption && isMrDisabledForSelectedDay);
                                return (
                                  <div key={type.value} className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="radio"
                                      name="visitType"
                                      id={`visitType-${type.value}`}
                                      value={type.value}
                                      checked={visitType?.value === type.value}
                                      disabled={isDisabled}
                                      onChange={(e) => {
                                        const opt = Visit_Type.find((v) => v.value === e.target.value);
                                        if (opt) setVisitType(opt);
                                      }}
                                    />
                                    <label
                                      className={`form-check-label ${isDisabled ? "text-muted" : ""}`}
                                      htmlFor={`visitType-${type.value}`}
                                    >
                                      {type.label}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        {/* <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label mb-1 fw-medium">
                              Reason for Visit
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              placeholder="Enter reason for visit"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Payment Details Section */}
                <div className="col-lg-5 ps-3">
                  <div className="card h-100">
                    <div className="card-body p-3">
                      <h6 className="fw-bold text-primary mb-2">Payment Details</h6>
                      <div className="mb-2 d-flex align-items-center flex-wrap gap-2">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>
                          Payment Mode
                        </label>
                        <div className="d-flex gap-3 flex-wrap ms-auto justify-content-end">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="paymentMode"
                              id="cash"
                              value="Cash"
                              checked={paymentMode === "Cash"}
                              disabled={isPaymentModeDisabledForMr}
                              onChange={(e) => {
                                if (isPaymentModeDisabledForMr) return;
                                setPaymentMode(e.target.value);
                              }}
                            />
                            <label className="form-check-label" htmlFor="cash">
                              Cash
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="paymentMode"
                              id="upi"
                              value="UPI"
                              checked={paymentMode === "UPI"}
                              disabled={isPaymentModeDisabledForMr}
                              onChange={(e) => {
                                if (isPaymentModeDisabledForMr) return;
                                setPaymentMode(e.target.value);
                              }}
                            />
                            <label className="form-check-label" htmlFor="upi">
                              UPI
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="paymentMode"
                              id="card"
                              value="Card"
                              checked={paymentMode === "Card"}
                              disabled={isPaymentModeDisabledForMr}
                              onChange={(e) => {
                                if (isPaymentModeDisabledForMr) return;
                                setPaymentMode(e.target.value);
                              }}
                            />
                            <label
                              className={`form-check-label ${isPaymentModeDisabledForMr ? "text-muted" : ""}`}
                              htmlFor="card"
                            >
                              Card
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Total</label>
                        <div className="form-control bg-light fs-15" style={{ pointerEvents: "none" }}>
                          ₹{total.toFixed(2)}
                        </div>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Discount</label>
                        <input
                          type="number"
                          className="form-control fs-15"
                          placeholder="0"
                          value={discount || ""}
                          onChange={(e) => {
                            if (isMrVisitSelected) return;
                            setDiscount(parseFloat(e.target.value) || 0);
                          }}
                          disabled={isMrVisitSelected}
                          min="0"
                        />
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Final Amount</label>
                        <div className="form-control bg-light fs-15" style={{ pointerEvents: "none" }}>
                          ₹{finalAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Amount Received</label>
                        <input
                          type="number"
                          className="form-control fs-15"
                          placeholder="0"
                          value={amountReceived || ""}
                          onChange={(e) => {
                            if (isMrVisitSelected) return;
                            setAmountReceived(parseFloat(e.target.value) || 0);
                          }}
                          disabled={isMrVisitSelected}
                          min="0"
                        />
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Balance</label>
                        <div
                          className="form-control d-flex align-items-center justify-content-between fs-15"
                          style={{
                            pointerEvents: "none",
                            backgroundColor: "#fff3cd",
                            borderColor: "#ffc107",
                          }}
                        >
                          <span>₹{balance.toFixed(2)}</span>
                          <i className="ti ti-alert-triangle text-warning fs-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* card end */}
              <div className="d-flex align-items-center justify-content-end">
                <Link href={all_routes.appointments} className="btn font-weight-bold fs-15 fw-medium rounded btn-light me-2">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  className="btn font-weight-bold fs-15 fw-medium rounded btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Appointment"}
                </button>
              </div>
              </form>
                </div>
                <div className={`tab-pane ${appointmentTab === "Daycare" ? "show active" : ""}`} id="daycare">
                  <form onSubmit={handleDaycareSubmit}>
                    <div className="card mb-3">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="fw-bold text-primary mb-0">Patient Details</h6>
                            {daycareSelectedPatient && (
                              <span className="badge badge-soft-success border border-success fw-medium">
                                Existing Patient
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-3">
                            <div className="mb-3 position-relative daycare-patient-search-container">
                              <label className="form-label mb-1 fw-medium">Phone Number<span className="text-danger ms-1">*</span></label>
                              <input
                                type="text"
                                className="form-control"
                                value={daycarePhone}
                                onChange={(e) => { setDaycarePhone(e.target.value || ""); setDaycareSelectedPatient(null); }}
                                placeholder="Enter phone number or name"
                                required
                              />
                              {daycareShowPatientDropdown && daycarePatientSearchResults.length > 0 && (
                                <div className="dropdown-menu show position-absolute w-100 mt-1 shadow-lg" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto" }}>
                                  {daycarePatientSearchResults.map((patient) => (
                                    <button key={patient._id} type="button" className="dropdown-item d-flex align-items-center justify-content-between" onClick={() => handleDaycarePatientSelect(patient)} onMouseDown={(e) => e.preventDefault()}>
                                      <div><div className="fw-medium text-dark">{patient.name}</div><div className="fs-13 text-muted">{patient.phone}</div></div>
                                      <i className="ti ti-arrow-right fs-12 text-muted" />
                                    </button>
                                  ))}
                                </div>
                              )}
                              {daycareSearchingPatients && !daycareShowPatientDropdown && (
                                <div className="position-absolute top-100 start-0 w-100 mt-1 p-2 bg-white border rounded shadow-sm">
                                  <div className="text-center text-muted fs-13"><i className="ti ti-loader-2 fs-14 me-1" style={{ animation: "spin 1s linear infinite" }} /> Searching...</div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-2">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Title<span className="text-danger ms-1">*</span></label>
                              <CommonSelect options={Title} className="select" value={daycareTitle} onChange={handleDaycareTitleChange} />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Name<span className="text-danger ms-1">*</span></label>
                              <input type="text" className="form-control" placeholder="Enter patient name..." value={daycareName} onChange={(e) => setDaycareName(e.target.value)} required />
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Gender<span className="text-danger ms-1">*</span></label>
                              <CommonSelect options={Gender} className="select" value={daycareGender} onChange={setDaycareGender} />
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Email Address</label>
                              <input type="email" className="form-control" placeholder="Enter email address" value={daycareEmail} onChange={(e) => setDaycareEmail(e.target.value)} />
                            </div>
                          </div>
                          <div className="col-md-2">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Date of Birth</label>
                              <div className="input-icon-end position-relative">
                                <DatePicker className="form-control datetimepicker" format={{ format: "DD-MM-YYYY", type: "mask" }} getPopupContainer={getModalContainer} placeholder="Select DOB" suffixIcon={null} value={daycareDob} onChange={handleDaycareDobChange} />
                                <span className="input-icon-addon"><i className="ti ti-calendar" /></span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Age<span className="text-danger ms-1">*</span></label>
                              <div className="row g-2">
                                <div className="col-4"><input type="text" className="form-control" placeholder="Years" value={daycareAgeYears} onChange={(e) => setDaycareAgeYears(e.target.value)} /></div>
                                <div className="col-4"><input type="text" className="form-control" placeholder="Months" value={daycareAgeMonths} onChange={(e) => setDaycareAgeMonths(e.target.value)} /></div>
                                <div className="col-4"><input type="text" className="form-control" placeholder="Days" value={daycareAgeDays} onChange={(e) => setDaycareAgeDays(e.target.value)} /></div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Blood Group</label>
                              <CommonSelect options={Blood_Group} className="select" value={daycareBloodGroup} onChange={setDaycareBloodGroup} />
                            </div>
                          </div>
                          <div className="col-md-5">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Address</label>
                              <input type="text" className="form-control" placeholder="Enter address" value={daycareAddress} onChange={(e) => setDaycareAddress(e.target.value)} />
                            </div>
                            <div className="row g-2">
                              <div className="col-md-6">
                                <div className="mb-3">
                                  <label className="form-label mb-1 fw-medium">Attendant Name</label>
                                  <input type="text" className="form-control" placeholder="Enter attendant name" value={daycareAttendantName} onChange={(e) => setDaycareAttendantName(e.target.value)} />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="mb-3">
                                  <label className="form-label mb-1 fw-medium">Relation to Patient</label>
                                  <input type="text" className="form-control" placeholder="Son, Daughter, etc." value={daycareAttendantRelation} onChange={(e) => setDaycareAttendantRelation(e.target.value)} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Aadhar No</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter Aadhar number"
                                value={daycareAadharNo}
                                onChange={(e) => setDaycareAadharNo(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">Ayushman No</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter Ayushman card number"
                                value={daycareAyushmanNo}
                                onChange={(e) => setDaycareAyushmanNo(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-lg-7 pe-3">
                        <div className="card h-100">
                          <div className="card-body p-3">
                            <h6 className="fw-bold text-primary mb-2">Day Care Details</h6>
                            <div className="row">
                              <div className="col-md-8">
                                {/* Consulting Doc + Doctor Visit Charges, matched widths */}
                                <div className="mb-3">
                                  <div className="d-flex align-items-end gap-2 flex-wrap">
                                    <div style={{ width: "62%", minWidth: 0 }}>
                                      <label className="form-label mb-1 fw-medium d-block">
                                        Consulting Doc<span className="text-danger ms-1">*</span>
                                      </label>
                                      <CommonSelect
                                        options={doctorOptions}
                                        value={daycareSelectedDoctor}
                                        onChange={handleDaycareDoctorChange}
                                        onInputChange={handleDoctorInputChange}
                                        isLoading={doctorSearchLoading}
                                        placeholder="Search doctor..."
                                      />
                                    </div>
                                    <div style={{ width: "35%", minWidth: 0 }}>
                                      <label className="form-label mb-1 fw-medium d-block">
                                        Doctor Visit Charges
                                      </label>
                                      <div className="d-flex gap-3 flex-wrap">
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="radio"
                                            name="daycareDoctorVisitCharges"
                                            id="daycareDvcYes"
                                            value="Yes"
                                            checked={daycareDoctorVisitCharges === "Yes"}
                                            onChange={() => setDaycareDoctorVisitCharges("Yes")}
                                            disabled={!daycareSelectedDoctor}
                                          />
                                          <label className="form-check-label" htmlFor="daycareDvcYes">
                                            Yes
                                          </label>
                                        </div>
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="radio"
                                            name="daycareDoctorVisitCharges"
                                            id="daycareDvcNo"
                                            value="No"
                                            checked={daycareDoctorVisitCharges === "No"}
                                            onChange={() => setDaycareDoctorVisitCharges("No")}
                                            disabled={!daycareSelectedDoctor}
                                          />
                                          <label className="form-check-label" htmlFor="daycareDvcNo">
                                            No
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Daycare Charges Type + Hours, same widths */}
                                <div className="mb-3">
                                  <div className="d-flex align-items-end gap-2 flex-wrap">
                                    <div style={{ width: "62%", minWidth: 0 }}>
                                      <label className="form-label mb-1 fw-medium d-block">
                                        Daycare Charges Type
                                      </label>
                                      <CommonSelect
                                        options={daycareBedChargesOptions}
                                        value={daycareBedChargesType}
                                        onChange={(opt) => {
                                          setDaycareBedChargesType(opt);
                                          if (opt?.value !== "custom") {
                                            setDaycareCustomRate(0);
                                          }
                                        }}
                                        placeholder="Select..."
                                      />
                                    </div>
                                    <div style={{ width: "35%", minWidth: 0 }}>
                                      <label className="form-label mb-1 fw-medium d-block">
                                        {isDaycareCustomCharges ? "Amount (₹)" : "Hours"}
                                      </label>
                                      {isDaycareCustomCharges ? (
                                        <input
                                          type="number"
                                          className="form-control"
                                          min={0}
                                          step={0.01}
                                          value={daycareCustomRate === 0 ? "" : daycareCustomRate}
                                          onChange={(e) => {
                                            if (e.target.value === "") {
                                              setDaycareCustomRate(0);
                                              return;
                                            }
                                            const v = parseFloat(e.target.value);
                                            if (!Number.isNaN(v) && v >= 0) setDaycareCustomRate(v);
                                          }}
                                          placeholder="0"
                                        />
                                      ) : (
                                        <input
                                          type="number"
                                          className="form-control"
                                          min={0}
                                          step={1}
                                          value={daycareBedChargesHours === 0 ? "" : daycareBedChargesHours}
                                          onChange={(e) => {
                                            if (e.target.value === "") {
                                              setDaycareBedChargesHours(0);
                                              return;
                                            }
                                            const v = parseFloat(e.target.value);
                                            if (!Number.isNaN(v) && v >= 0) setDaycareBedChargesHours(v);
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="mb-3">
                                  <label className="form-label mb-1 fw-medium">Add Procedures</label>
                                  <CommonSelect
                                    options={daycareProceduresOptions}
                                    value={daycareAddProcedureSelect}
                                    onChange={handleDaycareAddProcedure}
                                    placeholder="Select procedure..."
                                    isLoading={daycareProceduresLoading}
                                  />
                                </div>
                                <div className="mt-1">
                                  <div className="border rounded overflow-hidden">
                                    <div
                                      className="d-flex border-bottom bg-light px-2 py-1 fw-medium text-dark"
                                      style={{ fontSize: "0.95rem" }}
                                    >
                                      <span className="col-1 text-nowrap">S.No</span>
                                      <span className="col text-nowrap ps-3">Procedure</span>
                                      <span className="col text-end pe-4 text-nowrap">Price</span>
                                    </div>
                                    <div
                                      className="text-dark"
                                      style={{ maxHeight: "170px", overflowY: "auto", fontSize: "0.95rem" }}
                                    >
                                      {daycareAddedProcedures.length === 0 ? (
                                        <div className="px-2 py-3 text-center">No procedures added</div>
                                      ) : (
                                        daycareAddedProcedures.map((proc, idx) => (
                                          <div
                                            key={proc.id}
                                            className="d-flex align-items-center border-bottom px-2 py-2"
                                          >
                                            <span className="col-1">{idx + 1}</span>
                                            <span className="col ps-3">{proc.name}</span>
                                            <span className="col d-flex align-items-center justify-content-end gap-1">
                                              <span>{proc.price}</span>
                                              <button
                                                type="button"
                                                className="btn btn-link p-0 text-danger min-w-0"
                                                aria-label="Remove procedure"
                                                onClick={() => handleDaycareRemoveProcedure(proc.id)}
                                              >
                                                <i className="ti ti-trash ps-1 fs-16" />
                                              </button>
                                            </span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-5 ps-3">
                        <div className="card h-100">
                          <div className="card-body p-3">
                            <h6 className="fw-bold text-primary mb-2">Payment Details</h6>
                            <div className="mb-2 d-flex align-items-center flex-wrap gap-2">
                              <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>
                                Payment Mode
                              </label>
                              <div className="d-flex gap-3 flex-wrap ms-auto justify-content-end">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="daycarePaymentMode"
                                    id="daycare-cash"
                                    value="Cash"
                                    checked={daycarePaymentMode === "Cash"}
                                    onChange={(e) => setDaycarePaymentMode(e.target.value)}
                                  />
                                  <label className="form-check-label" htmlFor="daycare-cash">Cash</label>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="daycarePaymentMode"
                                    id="daycare-upi"
                                    value="UPI"
                                    checked={daycarePaymentMode === "UPI"}
                                    onChange={(e) => setDaycarePaymentMode(e.target.value)}
                                  />
                                  <label className="form-check-label" htmlFor="daycare-upi">UPI</label>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="daycarePaymentMode"
                                    id="daycare-card"
                                    value="Card"
                                    checked={daycarePaymentMode === "Card"}
                                    onChange={(e) => setDaycarePaymentMode(e.target.value)}
                                  />
                                  <label className="form-check-label" htmlFor="daycare-card">Card</label>
                                </div>
                              </div>
                            </div>
                            <div className="mb-2 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Total</label>
                              <div className="form-control bg-light fs-15" style={{ pointerEvents: "none" }}>
                                ₹{daycareSubtotal.toFixed(2)}
                              </div>
                            </div>
                            <div className="mb-2 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Discount</label>
                              <input
                                type="number"
                                className="form-control fs-15"
                                placeholder="0"
                                value={daycareDiscount || ""}
                                onChange={(e) => {
                                  setDaycareDiscount(parseFloat(e.target.value) || 0);
                                }}
                                min="0"
                              />
                            </div>
                            <div className="mb-2 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Final Amount</label>
                              <div className="form-control bg-light fs-15" style={{ pointerEvents: "none" }}>
                                ₹{(daycareSubtotal - (daycareDiscount || 0)).toFixed(2)}
                              </div>
                            </div>
                            <div className="mb-2 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Amount Received</label>
                              <input
                                type="number"
                                className="form-control fs-15"
                                placeholder="0"
                                value={daycareAmountReceived || ""}
                                onChange={(e) => setDaycareAmountReceived(parseFloat(e.target.value) || 0)}
                                min="0"
                              />
                            </div>
                            <div className="mb-2 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Balance</label>
                              <div
                                className="form-control d-flex align-items-center justify-content-between fs-15"
                                style={{
                                  pointerEvents: "none",
                                  backgroundColor: "#fff3cd",
                                  borderColor: "#ffc107",
                                }}
                              >
                                <span>₹{daycareBalance.toFixed(2)}</span>
                                <i className="ti ti-alert-triangle text-warning fs-16" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-end mt-3">
                      <Link href={all_routes.appointments} className="btn font-weight-bold fs-15 fw-medium rounded btn-light me-2">Cancel</Link>
                      <button type="submit" className="btn font-weight-bold fs-15 fw-medium rounded btn-primary" disabled={daycareLoading}>{daycareLoading ? "Creating..." : "Create Daycare Appointment"}</button>
                    </div>
                  </form>
                </div>
                <div className={`tab-pane ${appointmentTab === "IPD" ? "show active" : ""}`} id="ipd">
                  <form onSubmit={handleIpdSubmit}>
                    <div className="row g-3 align-items-start">
                      {/* LEFT COLUMN — stepper + form steps */}
                      <div className="col-12 col-lg-8 d-flex flex-column">
                        <div className="card mb-3">
                          <div className="card-body">
                            <IpdFormStepIndicator currentStep={ipdFormStep} />
                            {ipdError ? (
                              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
                                <i className="ti ti-alert-circle fs-16" />
                                <span className="fs-14">{ipdError}</span>
                              </div>
                            ) : null}

                        {/* STEP 1 — Patient Details */}
                        {ipdFormStep === 1 && (
                          <>
                              <h6 className="fw-bold text-primary mb-3 d-flex align-items-center flex-wrap gap-2">
                                Patient Details
                                {ipdSelectedPatient ? (
                                  <span className="badge badge-soft-success border border-success fw-medium fs-12">
                                    Existing Patient
                                  </span>
                                ) : null}
                              </h6>
                              <div className="row g-3">
                                <div className="col-12">
                                  <div className="d-flex flex-column flex-md-row gap-3 align-items-start">
                                    <IpdPatientCompactUpload
                                      label="Patient photo"
                                      placeholder="Add patient photo"
                                      hint="Jpg / Png · drag or click"
                                      accept="image/jpeg,image/png,image/jpg"
                                      file={ipdPhotoFile}
                                      previewUrl={ipdPatientPhotoUrl || undefined}
                                      onFileChange={setIpdPhotoFile}
                                    />
                                    <div className="flex-grow-1 w-100">
                                      <div className="row g-3 m-0">
                                        <div className="col-12 col-sm-6 col-md-4">
                                          <div className="position-relative ipd-patient-search-container">
                                            <label className="form-label mb-1 fw-medium fs-14">Phone Number <span className="text-danger">*</span></label>
                                            <input
                                              type="text"
                                              className="form-control"
                                              value={ipdPhone}
                                              onChange={(e) => {
                                                setIpdPhone(e.target.value || "");
                                                setIpdSelectedPatient(null);
                                                setIpdPhotoFile(null);
                                                setIpdAadharFile(null);
                                                setIpdPatientPhotoUrl("");
                                                setIpdPatientAadharDocUrl("");
                                              }}
                                              placeholder="Phone number or name"
                                              required
                                            />
                                            {ipdShowPatientDropdown && ipdPatientSearchResults.length > 0 && (
                                              <div className="dropdown-menu show position-absolute w-100 mt-1 shadow-lg" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto" }}>
                                                {ipdPatientSearchResults.map((patient) => (
                                                  <button key={patient._id} type="button" className="dropdown-item d-flex align-items-center justify-content-between" onClick={() => handleIpdPatientSelect(patient)} onMouseDown={(e) => e.preventDefault()}>
                                                    <div><div className="fw-medium text-dark fs-14">{patient.name}</div><div className="fs-13 text-muted">{patient.phone}</div></div>
                                                    <i className="ti ti-arrow-right fs-12 text-muted" />
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                            {ipdSearchingPatients && !ipdShowPatientDropdown && (
                                              <div className="position-absolute top-100 start-0 w-100 mt-1 p-2 bg-white border rounded shadow-sm">
                                                <div className="text-center text-muted fs-13"><i className="ti ti-loader-2 fs-14 me-1" /> Searching...</div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="col-6 col-md-2">
                                          <label className="form-label mb-1 fw-medium fs-14">Title <span className="text-danger">*</span></label>
                                          <CommonSelect options={Title} className="select" value={ipdTitle} onChange={handleIpdTitleChange} />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md">
                                          <label className="form-label mb-1 fw-medium fs-14">Full Name <span className="text-danger">*</span></label>
                                          <input type="text" className="form-control" placeholder="Enter patient name" value={ipdName} onChange={(e) => setIpdName(e.target.value)} required />
                                        </div>
                                      </div>
                                      <div className="row g-3 m-0">
                                        <div className="col-12 col-sm-6 col-md-3">
                                          <label className="form-label mb-1 fw-medium fs-14">Gender <span className="text-danger">*</span></label>
                                          <CommonSelect options={Gender} className="select" value={ipdGender} onChange={setIpdGender} />
                                        </div>
                                        <div className="col-12 col-sm-6 col-md-5">
                                          <label className="form-label mb-1 fw-medium fs-14">Email Address</label>
                                          <input type="email" className="form-control" placeholder="Enter email" value={ipdEmail} onChange={(e) => setIpdEmail(e.target.value)} />
                                        </div>
                                        <div className="col-12 col-md-4">
                                          <label className="form-label mb-1 fw-medium fs-14">Blood Group</label>
                                          <CommonSelect options={Blood_Group} className="select" value={ipdBloodGroup} onChange={setIpdBloodGroup} />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label mb-1 fw-medium fs-14">Date of Birth</label>
                                  <div className="input-icon-end position-relative">
                                    <DatePicker className="form-control datetimepicker" format={{ format: "DD-MM-YYYY", type: "mask" }} getPopupContainer={getModalContainer} placeholder="DD-MM-YYYY" suffixIcon={null} value={ipdDob} onChange={handleIpdDobChange} />
                                    <span className="input-icon-addon"><i className="ti ti-calendar" /></span>
                                  </div>
                                </div>
                                <div className="col-md-5">
                                  <label className="form-label mb-1 fw-medium fs-14">Age <span className="text-danger">*</span></label>
                                  <div className="row g-2">
                                    <div className="col-4"><input type="text" className="form-control" placeholder="Years" value={ipdAgeYears} onChange={(e) => setIpdAgeYears(e.target.value)} /></div>
                                    <div className="col-4"><input type="text" className="form-control" placeholder="Months" value={ipdAgeMonths} onChange={(e) => setIpdAgeMonths(e.target.value)} /></div>
                                    <div className="col-4"><input type="text" className="form-control" placeholder="Days" value={ipdAgeDays} onChange={(e) => setIpdAgeDays(e.target.value)} /></div>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label mb-1 fw-medium fs-14">Aadhar No</label>
                                  <input type="text" className="form-control" placeholder="Enter Aadhar number" value={ipdAadharNo} onChange={(e) => setIpdAadharNo(e.target.value)} />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label mb-1 fw-medium fs-14">Marital Status</label>
                                  <CommonSelect
                                    options={Marital_Status}
                                    className="select"
                                    value={ipdMaritalStatus}
                                    onChange={setIpdMaritalStatus}
                                  />
                                </div>
                                <div className="col-md-5">
                                  <label className="form-label mb-1 fw-medium fs-14">Ayushman No</label>
                                  <input type="text" className="form-control" placeholder="Enter Ayushman card number" value={ipdAyushmanNo} onChange={(e) => setIpdAyushmanNo(e.target.value)} />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label mb-1 fw-medium fs-14">Occupation</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter occupation"
                                    value={ipdOccupation}
                                    onChange={(e) => setIpdOccupation(e.target.value)}
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label mb-1 fw-medium fs-14">Drug Sensitivity</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. Penicillin, Aspirin"
                                    value={ipdDrugSensitivity}
                                    onChange={(e) => setIpdDrugSensitivity(e.target.value)}
                                  />
                                </div>
                                <div className="col-md-8">
                                  <label className="form-label mb-1 fw-medium fs-14">Address</label>
                                  <input type="text" className="form-control" placeholder="Enter address" value={ipdAddress} onChange={(e) => setIpdAddress(e.target.value)} />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label mb-1 fw-medium fs-14">Attendant Name</label>
                                  <input type="text" className="form-control" placeholder="Attendant name" value={ipdAttendantName} onChange={(e) => setIpdAttendantName(e.target.value)} />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label mb-1 fw-medium fs-14">Relation to Patient</label>
                                  <input type="text" className="form-control" placeholder="Son, Daughter, Spouse…" value={ipdAttendantRelation} onChange={(e) => setIpdAttendantRelation(e.target.value)} />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label mb-1 fw-medium fs-14">Aadhar Document</label>
                                  <input
                                    type="file"
                                    className="form-control"
                                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                                    onChange={(e) => setIpdAadharFile(e.target.files?.[0] ?? null)}
                                  />
                                  {ipdAadharFile?.name ? (
                                    <small className="text-muted d-block mt-1 text-truncate">{ipdAadharFile.name}</small>
                                  ) : ipdPatientAadharDocUrl ? (
                                    <small className="text-muted d-block mt-1">Existing document on file</small>
                                  ) : null}
                                </div>
                              </div>
                          </>
                        )}

                        {/* STEP 2 — IPD Details */}
                        {ipdFormStep === 2 && (
                          <>
                              <h6 className="fw-bold text-primary mb-3">IPD Details</h6>
                              <div className="row g-3">
                                <div className="col-md-8">
                                  <label className="form-label mb-1 fw-medium fs-14">Consulting Doctor <span className="text-danger">*</span></label>
                                  <CommonSelect
                                    options={doctorOptions}
                                    value={ipdSelectedDoctor}
                                    onChange={handleIpdDoctorChange}
                                    onInputChange={handleDoctorInputChange}
                                    isLoading={doctorSearchLoading}
                                    placeholder="Search doctor..."
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label mb-1 fw-medium fs-14">MLC</label>
                                  <div className="d-flex align-items-center gap-2 pt-1">
                                    <div className="form-check form-switch mb-0">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        id="ipd-new-mlc-toggle"
                                        checked={ipdMlc}
                                        onChange={(e) => handleIpdMlcToggle(e.target.checked)}
                                        aria-label="Medico-legal case (MLC)"
                                      />
                                      <label className="form-check-label fw-medium fs-14" htmlFor="ipd-new-mlc-toggle">
                                        {ipdMlc ? "Yes" : "No"}
                                      </label>
                                    </div>
                                    {ipdMlc ? (
                                      <span className="badge" style={{ background: "#fef9c3", color: "#854d0e", fontSize: "0.7rem" }}>
                                        MLC
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                {ipdMlc ? (
                                  <IpdMlcFields
                                    idPrefix="ipd-new-mlc"
                                    value={ipdMlcData}
                                    onChange={setIpdMlcData}
                                  />
                                ) : null}
                                <IpdAddDoctorVisitsField
                                  doctorOptions={doctorOptions}
                                  addDoctorSelect={ipdAddVisitingDoctorSelect}
                                  onAddDoctor={handleIpdAddVisitingDoctor}
                                  doctorsLoading={doctorSearchLoading}
                                  visits={ipdDoctorVisits}
                                  onIncrementDays={handleIpdIncrementDoctorVisitDays}
                                  onDecrementDays={handleIpdDecrementDoctorVisitDays}
                                  onRemove={handleIpdRemoveVisitingDoctor}
                                />
                                <IpdAddProceduresField
                                  proceduresOptions={ipdProceduresOptions}
                                  addProcedureSelect={ipdAddProcedureSelect}
                                  onAddProcedure={handleIpdAddProcedure}
                                  proceduresLoading={ipdProceduresLoading}
                                  procedures={ipdAddedProcedures}
                                  onIncrementUnits={handleIpdIncrementProcedureUnits}
                                  onDecrementUnits={handleIpdDecrementProcedureUnits}
                                  onRemove={handleIpdRemoveProcedure}
                                />
                                <div className="col-12">
                                  <label htmlFor="ipd-new-notes" className="form-label mb-1 fw-medium fs-14">
                                    Reason for Admission <span className="text-danger">*</span>
                                  </label>
                                  <textarea
                                    id="ipd-new-notes"
                                    className="form-control"
                                    rows={3}
                                    value={ipdNotes}
                                    onChange={(e) => setIpdNotes(e.target.value)}
                                    placeholder="e.g. Diabetes complications"
                                    required
                                  />
                                </div>
                              </div>
                          </>
                        )}

                        {/* STEP 3 — Bed Details */}
                        {ipdFormStep === 3 && (
                          <>
                              <h6 className="fw-bold text-primary mb-0 d-flex align-items-center flex-wrap gap-2">
                                Bed Details
                                {ipdSelectedBed ? (
                                  <span className="badge badge-soft-success border border-success fw-medium fs-12">
                                    {ipdSelectedBed.bedCode} selected
                                  </span>
                                ) : null}
                              </h6>
                              <IpdBedSelectionStep
                                data={ipdBedBlockData}
                                loading={ipdBedsLoading}
                                error={ipdBedsError}
                                selectedBedId={ipdSelectedBedId}
                                onSelectBed={handleIpdSelectBed}
                                wardOptions={ipdWardOptions}
                                selectedWardId={ipdSelectedWardFilterId}
                                onWardFilterChange={handleIpdWardFilterChange}
                                wardsLoading={ipdWardsLoading}
                              />
                          </>
                        )}
                          </div>
                        </div>

                        {/* ── Footer Actions ── */}
                        <div className="d-flex align-items-center justify-content-end mt-2 flex-wrap gap-2">
                          <Link href={all_routes.ipdAppointments} className="btn btn-light fw-medium fs-14 px-4">
                            Cancel
                          </Link>
                          {ipdFormStep === 2 ? (
                            <button
                              type="button"
                              className="btn btn-light fw-medium fs-14 px-4"
                              onClick={() => {
                                setIpdFormStep(1);
                                setIpdError("");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              disabled={ipdLoading || ipdBedsLoading}
                            >
                              <i className="ti ti-arrow-left me-1" />
                              Back
                            </button>
                          ) : null}
                          {ipdFormStep === 3 ? (
                            <button
                              type="button"
                              className="btn btn-light fw-medium fs-14 px-4"
                              onClick={() => {
                                setIpdFormStep(2);
                                setIpdError("");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              disabled={ipdLoading || ipdBedsLoading}
                            >
                              <i className="ti ti-arrow-left me-1" />
                              Back
                            </button>
                          ) : null}
                          <button
                            type="submit"
                            className="btn font-weight-bold fs-15 fw-medium rounded btn-primary"
                            disabled={ipdLoading || ipdBedsLoading}
                          >
                            {ipdLoading ? (
                              <><i className="ti ti-loader-2 me-1" />Creating...</>
                            ) : ipdFormStep === 1 ? (
                              <>Next: IPD Details<i className="ti ti-arrow-right ms-1" /></>
                            ) : ipdFormStep === 2 ? (
                              <>Next: Select Bed<i className="ti ti-arrow-right ms-1" /></>
                            ) : (
                              <>Create IPD Appointment<i className="ti ti-check ms-1" /></>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* RIGHT COLUMN — Summary + Payment (static) */}
                      <div className="col-12 col-lg-4">
                        <IpdAdmissionSummarySidebar
                          patient={{
                            title:
                              ipdTitle?.value && ipdTitle.value !== "Select"
                                ? ipdTitle.label
                                : undefined,
                            name: ipdName.trim() || undefined,
                            phone:
                              ipdSelectedPatient?.phone?.trim() ||
                              ipdPhone.trim() ||
                              undefined,
                            gender:
                              ipdGender?.value && ipdGender.value !== "Select"
                                ? ipdGender.label
                                : undefined,
                            ageYears: ipdAgeYears || undefined,
                            bloodGroup:
                              ipdBloodGroup?.value && ipdBloodGroup.value !== "Select"
                                ? ipdBloodGroup.label
                                : undefined,
                            drugSensitivity: ipdDrugSensitivity.trim() || undefined,
                            isNewPatient: !ipdSelectedPatient?._id,
                          }}
                          admission={{
                            consultingDoctor: ipdSelectedDoctor?.label ?? ipdSummaryDoctor?.name,
                            admissionDate: dayjs().format("DD MMM YYYY"),
                            reason: ipdNotes.trim() || undefined,
                            proceduresLabel: ipdSummaryPackageLabel,
                            isMlc: ipdMlc,
                          }}
                          bed={ipdSummaryBed}
                          payment={
                            <>
                            <div className="mb-2 d-flex align-items-center flex-wrap gap-2">
                              <label className="form-label mb-0 fw-medium me-2 text-dark" style={{ minWidth: "120px" }}>
                                Payment Mode
                              </label>
                              <div className="d-flex gap-3 flex-wrap ms-auto justify-content-end">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="ipdPaymentMode"
                                    id="ipd-cash"
                                    value="Cash"
                                    checked={ipdPaymentMode === "Cash"}
                                    onChange={(e) => setIpdPaymentMode(e.target.value)}
                                  />
                                  <label className="form-check-label text-dark" htmlFor="ipd-cash">Cash</label>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="ipdPaymentMode"
                                    id="ipd-upi"
                                    value="UPI"
                                    checked={ipdPaymentMode === "UPI"}
                                    onChange={(e) => setIpdPaymentMode(e.target.value)}
                                  />
                                  <label className="form-check-label text-dark" htmlFor="ipd-upi">UPI</label>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="ipdPaymentMode"
                                    id="ipd-card"
                                    value="Card"
                                    checked={ipdPaymentMode === "Card"}
                                    onChange={(e) => setIpdPaymentMode(e.target.value)}
                                  />
                                  <label className="form-check-label text-dark" htmlFor="ipd-card">Card</label>
                                </div>
                              </div>
                            </div>
                            <div className="mb-2 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2 text-dark" style={{ minWidth: "120px" }}>Total</label>
                              <div className="form-control bg-light fs-15 text-dark" style={{ pointerEvents: "none" }}>
                                ₹{ipdSubtotal.toFixed(2)}
                              </div>
                            </div>
                            <div className="mb-2 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2 text-dark" style={{ minWidth: "120px" }}>Discount</label>
                              <input
                                type="number"
                                className="form-control fs-15 text-dark"
                                placeholder="0"
                                value={ipdDiscount || ""}
                                onChange={(e) => setIpdDiscount(parseFloat(e.target.value) || 0)}
                                min="0"
                              />
                            </div>
                            <div className="mb-2 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2 text-dark" style={{ minWidth: "120px" }}>Final Amount</label>
                              <div className="form-control bg-light fs-15 text-dark" style={{ pointerEvents: "none" }}>
                                ₹{(ipdSubtotal - (ipdDiscount || 0)).toFixed(2)}
                              </div>
                            </div>
                            <div className="mb-2 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2 text-dark" style={{ minWidth: "120px" }}>Amount Received</label>
                              <input
                                type="number"
                                className="form-control fs-15 text-dark"
                                placeholder="0"
                                value={ipdAmountReceived || ""}
                                onChange={(e) => setIpdAmountReceived(parseFloat(e.target.value) || 0)}
                                min="0"
                              />
                            </div>
                            <div className="mb-0 d-flex align-items-center">
                              <label className="form-label mb-0 fw-medium me-2 text-dark" style={{ minWidth: "120px" }}>Balance</label>
                              <div className="form-control d-flex align-items-center justify-content-between fs-15 text-dark bg-warning-subtle border border-warning">
                                <span>₹{ipdBalance.toFixed(2)}</span>
                                <i className="ti ti-alert-triangle text-warning fs-16" />
                              </div>
                            </div>
                            </>
                          }
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {/* row end */}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link href="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals />
    </>
  );
};

export default NewAppointmentComponent;
