"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CommonSelect, { Option } from "@/core/common/common-select/commonSelect";
import { Title, Gender, Blood_Group, Marital_Status } from "@/core/common/selectOption";
import { all_routes } from "@/routes/all_routes";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";
import IpdBedSelectionStep, {
  IpdBedWardFilter,
} from "@/components/pages/clinic-modules/ipd-appointments/ipd-bed-selection/IpdBedSelectionStep";
import {
  fetchIpdBedBlockView,
  fetchIpdWardOptions,
  type IIpdWardOption,
} from "@/components/pages/clinic-modules/ipd-appointments/ipd-bed-selection/fetchIpdBedBlockView";
import type {
  IIpdBed,
  IIpdBedBlockViewData,
} from "@/components/pages/clinic-modules/ipd-appointments/ipd-bed-selection/ipdBedTypes";
import {
  appendDefaultDoctorVisitingCharge,
  getIpdDoctorVisitingCharge,
} from "@/components/pages/clinic-modules/ipd-appointments/ipdDoctorVisitingCharge";
import IpdAddProceduresField from "@/components/pages/clinic-modules/ipd-appointments/IpdAddProceduresField";
import IpdFormStepIndicator from "@/components/pages/clinic-modules/ipd-appointments/IpdFormStepIndicator";
import IpdMlcFields, {
  emptyIpdMlcData,
  type IIpdMlcData,
} from "@/components/pages/clinic-modules/ipd-appointments/IpdMlcFields";
import { getPatientMaritalStatus } from "@/core/utils/patientMaritalStatus";
import type { IIpdProcedureRow } from "@/components/pages/clinic-modules/ipd-appointments/IpdProceduresTable";
import {
  addIpdProcedureRow,
  calcIpdProceduresTotal,
  decrementIpdProcedureUnits,
  incrementIpdProcedureUnits,
  ipdProcedureRowsFromBilling,
  ipdProcedureRowsFromLegacy,
  removeIpdProcedureRow,
} from "@/components/pages/clinic-modules/ipd-appointments/ipdProcedureRows";

interface IVisitTypeCharge {
  visitType?: string;
  appointmentType?: string;
  charge: number;
  type?: string;
}

interface IDoctor {
  _id: string;
  name: string;
  visitTypes?: IVisitTypeCharge[];
}

interface IIpdPatient {
  _id: string;
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  dob?: string;
  age?: number;
  months?: number;
  days?: number;
  maritalStatus?: string;
  maritialStatus?: string;
  occupation?: string;
  drugSensitivity?: string;
  aadharNo?: string;
  ayushmanCardNo?: string;
  attendantName?: string;
  attendantRelation?: string;
}

interface IIpdBillingCharge {
  type?: string;
  procedureId?: string;
  doctorId?: string;
  units?: number;
  procedureName?: string;
  price?: number;
}

type IIpdBillingChargePayload =
  | { type: "procedure"; procedureId: string; units: number }
  | { type: "doctor"; doctorId: string; units: number };

interface IIpdUpdatePayload {
  patientId: string;
  doctorId: string;
  bedId: string;
  admissionDate: string;
  reason: string;
  billingCharges: IIpdBillingChargePayload[];
  isMLC?: boolean;
  mlc?: IIpdMlcData;
  transaction?: {
    transactionType: "Payment";
    amount: number;
    paymentMode: string;
  };
}

interface IIpdDetail {
  _id: string;
  patientId: string;
  doctorId: string;
  bedId?: string;
  reason?: string;
  notes?: string;
  admissionDate?: string;
  appointmentDate?: string;
  billingCharges?: IIpdBillingCharge[];
  procedures?: Array<{
    procedureId?: string;
    procedureName?: string;
    price?: number;
  }>;
  doctorVisitCharges?: boolean;
  doctor?: { _id: string; name: string };
  patient?: IIpdPatient;
  bed?: { _id: string; bedCode?: string };
  mlc?: IIpdMlcData;
  isMlc?: boolean;
  isMLC?: boolean;
  discount?: number;
  amountPaid?: number;
  transactions?: Array<{ amount?: number; paymentMode?: string }>;
}

const extractIpdFromGetResponse = (data: unknown): IIpdDetail | null => {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const nested = root.ipd ?? root.ipdAppointment;
  if (nested && typeof nested === "object") return nested as unknown as IIpdDetail;
  if (root._id) return root as unknown as IIpdDetail;
  return null;
};

const EditIpdAppointmentComponent = () => {
  const params = useParams();
  const router = useRouter();
  const routeId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const [ipdRecordId, setIpdRecordId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patient, setPatient] = useState<IIpdPatient | null>(null);

  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);

  const [doctorOptions, setDoctorOptions] = useState<Option[]>([]);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Option | null>(null);

  const [proceduresOptions, setProceduresOptions] = useState<Option[]>([]);
  const [procedurePriceById, setProcedurePriceById] = useState<Record<string, number>>({});
  const [proceduresLoading, setProceduresLoading] = useState(false);
  const [addedProcedures, setAddedProcedures] = useState<IIpdProcedureRow[]>([]);
  const [addProcedureSelect, setAddProcedureSelect] = useState<Option | null>(null);

  const [reason, setReason] = useState("");
  const [admissionDate, setAdmissionDate] = useState<string>("");
  const [mlc, setMlc] = useState(false);
  const [mlcData, setMlcData] = useState<IIpdMlcData>(emptyIpdMlcData);

  const [bedBlockData, setBedBlockData] = useState<IIpdBedBlockViewData | null>(null);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [bedsError, setBedsError] = useState("");
  const [wardOptions, setWardOptions] = useState<IIpdWardOption[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [selectedWardFilterId, setSelectedWardFilterId] = useState<string | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<IIpdBed | null>(null);

  const [paymentMode, setPaymentMode] = useState("Cash");
  const [amountPaidFromApi, setAmountPaidFromApi] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [amountReceived, setAmountReceived] = useState(0);

  const doctorSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [visitingCharge, setVisitingCharge] = useState(0);
  const proceduresTotal = calcIpdProceduresTotal(addedProcedures);
  const subtotal = proceduresTotal + visitingCharge;
  const finalAmount = subtotal - (discount || 0);
  const balance = finalAmount - (amountReceived || 0);

  const fetchDoctors = useCallback(async (search = "") => {
    if (!API_BASE_URL) return;
    setDoctorSearchLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/hospital/doctors`, {
        params: { limit: 50, search: search || undefined },
      });
      const list = res.data?.data?.doctors ?? res.data?.data ?? [];
      const arr = Array.isArray(list) ? (list as IDoctor[]) : [];
      setDoctors(arr);
      setDoctorOptions(arr.map((d) => ({ value: d._id, label: d.name ?? "—" })));
    } catch {
      setDoctorOptions([]);
      setDoctors([]);
    } finally {
      setDoctorSearchLoading(false);
    }
  }, []);

  const fetchProcedures = useCallback(async () => {
    if (!API_BASE_URL) return;
    setProceduresLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/hospital/procedures`, { params: { limit: 50 } });
      const list = res.data?.data?.procedures ?? res.data?.data ?? [];
      const arr = Array.isArray(list) ? list : [];
      setProceduresOptions(
        arr.map((p: { _id: string; procedureName?: string }) => ({
          value: p._id,
          label: p.procedureName ?? "—",
        }))
      );
      const priceMap: Record<string, number> = {};
      arr.forEach((p: { _id: string; price?: number; basePrice?: number }) => {
        priceMap[p._id] = p.price ?? p.basePrice ?? 0;
      });
      setProcedurePriceById(priceMap);
    } catch {
      setProceduresOptions([]);
      setProcedurePriceById({});
    } finally {
      setProceduresLoading(false);
    }
  }, []);

  const loadWardOptions = useCallback(async () => {
    setWardsLoading(true);
    try {
      const options = await fetchIpdWardOptions();
      setWardOptions(options);
    } catch {
      setWardOptions([]);
    } finally {
      setWardsLoading(false);
    }
  }, []);

  const loadBedBlockView = useCallback(async (wardId?: string | null) => {
    setBedsLoading(true);
    setBedsError("");
    try {
      const data = await fetchIpdBedBlockView(wardId);
      setBedBlockData(data);
      if (!data?.wards?.length) {
        setBedsError(
          wardId
            ? "No beds found for this ward."
            : "No beds found. Add beds in Administration → Beds."
        );
      }
    } catch {
      setBedBlockData(null);
      setBedsError("Could not load beds. Please try again.");
    } finally {
      setBedsLoading(false);
    }
  }, []);

  const handleWardFilterChange = useCallback(
    (wardId: string | null) => {
      setSelectedWardFilterId(wardId);
      setSelectedBedId(null);
      setSelectedBed(null);
      void loadBedBlockView(wardId);
    },
    [loadBedBlockView]
  );

  const handleDoctorInputChange = useCallback(
    (value: string) => {
      if (doctorSearchDebounceRef.current) {
        clearTimeout(doctorSearchDebounceRef.current);
        doctorSearchDebounceRef.current = null;
      }
      doctorSearchDebounceRef.current = setTimeout(() => {
        void fetchDoctors(value);
      }, 300);
    },
    [fetchDoctors]
  );

  const fetchIPD = useCallback(
    async (ipdIdParam: string) => {
      if (!API_BASE_URL) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/hospital/ipd/${ipdIdParam}`);
        const ok = res.data?.code === 200 || (res.status >= 200 && res.status < 300);
        const data = extractIpdFromGetResponse(res.data?.data);
        if (!ok || !data?._id) {
          setError(res.data?.message ?? "IPD admission not found.");
          return;
        }

        setIpdRecordId(data._id);
        setPatientId(data.patientId ?? null);

        if (data.patient) {
          setPatient(data.patient);
        } else if (data.patientId) {
          try {
            const pRes = await axios.get(`${API_BASE_URL}/hospital/patients/${data.patientId}`);
            const pData = pRes.data?.data?.patient ?? pRes.data?.data;
            if (pData) {
              setPatient({ ...(pData as IIpdPatient), _id: data.patientId });
            }
          } catch {
            setPatient(null);
          }
        }

        const doctorId = data.doctor?._id ?? data.doctorId;
        if (doctorId) {
          setSelectedDoctor({
            value: doctorId,
            label: data.doctor?.name ?? "",
          });
        }

        const admission =
          data.admissionDate ?? data.appointmentDate ?? dayjs().format("YYYY-MM-DD");
        setAdmissionDate(admission);
        setReason((data.reason ?? data.notes ?? "").trim());
        setMlc(Boolean(data.isMLC ?? data.isMlc));
        const mlcRecord = data.mlc && typeof data.mlc === "object" ? data.mlc : null;
        setMlcData(
          mlcRecord
            ? {
                markOfIdentification: mlcRecord.markOfIdentification ?? "",
                thanaName: mlcRecord.thanaName ?? "",
                patientBroughtBy: mlcRecord.patientBroughtBy ?? "",
                placeOfAccident: mlcRecord.placeOfAccident ?? "",
              }
            : emptyIpdMlcData()
        );
        setDiscount(Number(data.discount) || 0);

        const bedId = data.bedId ?? data.bed?._id ?? null;
        setSelectedBedId(bedId);
        if (data.bed?._id) {
          setSelectedBed({
            _id: data.bed._id,
            bedCode: data.bed.bedCode ?? "",
            status: "occupied",
          } as IIpdBed);
        }

        const txTotal = Array.isArray(data.transactions)
          ? data.transactions.reduce((sum, t) => sum + (Number(t?.amount) || 0), 0)
          : 0;
        const paid = data.amountPaid != null ? Number(data.amountPaid) : txTotal;
        setAmountPaidFromApi(paid);
        setAmountReceived(paid);
        const lastMode =
          Array.isArray(data.transactions) && data.transactions.length
            ? data.transactions[data.transactions.length - 1]?.paymentMode
            : undefined;
        setPaymentMode(lastMode ?? "Cash");
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to load IPD admission.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!routeId) return;
    void fetchDoctors();
    void fetchProcedures();
    void fetchIPD(routeId);
  }, [routeId, fetchDoctors, fetchProcedures, fetchIPD]);

  useEffect(() => {
    if (!procedurePriceById || loading) return;
    const reloadProcedures = async () => {
      if (!API_BASE_URL || !routeId) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/hospital/ipd/${routeId}`);
        const data = extractIpdFromGetResponse(res.data?.data);
        if (!data) return;
        const billing = Array.isArray(data.billingCharges) ? data.billingCharges : [];
        if (billing.length) {
          setAddedProcedures(ipdProcedureRowsFromBilling(billing, procedurePriceById));
          return;
        }
        setAddedProcedures(
          ipdProcedureRowsFromLegacy(data.procedures ?? [], procedurePriceById)
        );
      } catch {
        /* keep existing */
      }
    };
    void reloadProcedures();
  }, [procedurePriceById, loading, routeId]);

  useEffect(() => {
    if (!selectedDoctor?.value) {
      setVisitingCharge(0);
      return;
    }
    const doctor = doctors.find((d) => d._id === selectedDoctor.value);
    setVisitingCharge(getIpdDoctorVisitingCharge(doctor?.visitTypes));
  }, [selectedDoctor?.value, doctors]);

  const handleDoctorChange = useCallback((option: Option | null) => {
    setSelectedDoctor(option);
  }, []);

  const handleAddProcedure = useCallback(
    (option: Option | null) => {
      if (!option?.value || procedurePriceById[option.value] == null) return;
      const price = procedurePriceById[option.value] ?? 0;
      setAddedProcedures((prev) =>
        addIpdProcedureRow(prev, { id: option.value, name: option.label, price })
      );
      setAddProcedureSelect(null);
    },
    [procedurePriceById]
  );

  const handleIncrementProcedureUnits = useCallback((id: string) => {
    setAddedProcedures((prev) => incrementIpdProcedureUnits(prev, id));
  }, []);

  const handleDecrementProcedureUnits = useCallback((id: string) => {
    setAddedProcedures((prev) => decrementIpdProcedureUnits(prev, id));
  }, []);

  const handleRemoveProcedure = useCallback((id: string) => {
    setAddedProcedures((prev) => removeIpdProcedureRow(prev, id));
  }, []);

  const handleSelectBed = (bed: IIpdBed) => {
    setSelectedBedId(bed._id);
    setSelectedBed(bed);
    setError("");
  };

  const buildBillingCharges = (): IIpdBillingChargePayload[] => {
    const doctorId = selectedDoctor?.value;
    if (!doctorId) return [];

    const procedureCharges: IIpdBillingChargePayload[] = addedProcedures
      .filter((p) => p.id && procedurePriceById[p.id] != null && p.units > 0)
      .map((p) => ({
        type: "procedure",
        procedureId: p.id,
        units: p.units,
      }));

    return appendDefaultDoctorVisitingCharge(procedureCharges, doctorId);
  };

  const buildUpdatePayload = (): IIpdUpdatePayload | null => {
    const doctorId = selectedDoctor?.value;
    const bedId = selectedBedId;
    if (!ipdRecordId || !patientId || !doctorId || !bedId) return null;

    const payload: IIpdUpdatePayload = {
      patientId,
      doctorId,
      bedId,
      admissionDate: admissionDate || dayjs().format("YYYY-MM-DD"),
      reason: reason.trim(),
      billingCharges: buildBillingCharges(),
    };

    const extra = Math.max(0, (Number(amountReceived) || 0) - (Number(amountPaidFromApi) || 0));
    if (extra > 0) {
      payload.transaction = {
        transactionType: "Payment",
        amount: extra,
        paymentMode,
      };
    }

    payload.isMLC = mlc;
    if (mlc) {
      payload.mlc = {
        markOfIdentification: mlcData.markOfIdentification.trim(),
        thanaName: mlcData.thanaName.trim(),
        patientBroughtBy: mlcData.patientBroughtBy.trim(),
        placeOfAccident: mlcData.placeOfAccident.trim(),
      };
    }

    return payload;
  };

  const handleMlcToggle = (checked: boolean) => {
    setMlc(checked);
    if (!checked) setMlcData(emptyIpdMlcData());
  };

  const doSubmit = async () => {
    if (!ipdRecordId || !API_BASE_URL) return;
    const payload = buildUpdatePayload();
    if (!payload) {
      setError("Please complete required fields.");
      return;
    }
    if (!payload.reason) {
      setError("Please enter reason for admission.");
      setFormStep(2);
      return;
    }

    setSubmitLoading(true);
    setError("");
    try {
      const res = await axios.put(`${API_BASE_URL}/hospital/ipd/${ipdRecordId}`, payload);
      const ok = res?.status >= 200 && res?.status < 300;
      const codeOk = res?.data?.code === 200 || res?.data?.code === "200";
      if (ok || codeOk) {
        router.push(all_routes.ipdAppointments);
      } else {
        setError(res?.data?.message ?? "Failed to update IPD admission.");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to update IPD admission.";
      setError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formStep === 1) {
      setFormStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (formStep === 2) {
      if (!selectedDoctor?.value) {
        setError("Please select a consulting doctor.");
        return;
      }
      if (!reason.trim()) {
        setError("Please enter reason for admission.");
        return;
      }
      setFormStep(3);
      setSelectedWardFilterId(null);
      void loadWardOptions();
      void loadBedBlockView(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!selectedBedId) {
      setError("Please select a bed.");
      return;
    }
    void doSubmit();
  };

  const patientTitleLabel = patient?.title
    ? Title.find((t) => t.value === patient.title)?.label ?? patient.title
    : "";
  const patientGenderLabel = patient?.gender
    ? Gender.find((g) => g.value === patient.gender)?.label ?? patient.gender
    : "";
  const patientBloodLabel = patient?.bloodGroup
    ? Blood_Group.find((b) => b.value === patient.bloodGroup)?.label ?? patient.bloodGroup
    : "";
  const patientMaritalStatusValue = getPatientMaritalStatus(patient);
  const patientMaritalLabel = patientMaritalStatusValue
    ? Marital_Status.find((m) => m.value === patientMaritalStatusValue)?.label ?? patientMaritalStatusValue
    : "";
  const patientDobFormatted = patient?.dob ? dayjs(patient.dob).format("DD-MM-YYYY") : "";
  const patientAgeYears =
    patient?.age != null
      ? String(patient.age)
      : patient?.dob
        ? String(dayjs().diff(dayjs(patient.dob), "year"))
        : "";
  const patientAgeMonths = patient?.months != null ? String(patient.months) : "";
  const patientAgeDays = patient?.days != null ? String(patient.days) : "";

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="mb-4">
          <h6 className="fw-bold mb-0 d-flex align-items-center">
            <Link href={all_routes.ipdAppointments} className="text-dark">
              <i className="ti ti-chevron-left me-1" />
              Edit IPD Appointments
            </Link>
          </h6>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <IpdFormStepIndicator currentStep={formStep} />
            {error ? (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
                <i className="ti ti-alert-circle fs-16" />
                <span className="fs-14">{error}</span>
              </div>
            ) : null}

            <div className="row g-3 align-items-start">
              <div className="col-12 col-lg-8">
                {formStep === 1 && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <h6 className="fw-bold text-primary mb-3 d-flex align-items-center flex-wrap gap-2">
                        Patient Details
                        <span className="badge badge-soft-success border border-success fw-medium fs-12">
                          Existing Patient
                        </span>
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label mb-1 fw-medium fs-14">Phone Number</label>
                          <input type="text" className="form-control bg-light" value={patient?.phone ?? ""} readOnly disabled />
                        </div>
                        <div className="col-md-2">
                          <label className="form-label mb-1 fw-medium fs-14">Title</label>
                          <input type="text" className="form-control bg-light" value={patientTitleLabel} readOnly disabled />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1 fw-medium fs-14">Full Name</label>
                          {patient?._id ? (
                            <Link
                              href={`${all_routes.patientDetails}?id=${patient._id}`}
                              className="form-control bg-light text-decoration-none text-dark d-flex align-items-center"
                            >
                              <span className="flex-grow-1 text-start">{patient?.name ?? "—"}</span>
                              <i className="ti ti-arrow-right fs-12 text-muted" />
                            </Link>
                          ) : (
                            <input type="text" className="form-control bg-light" value={patient?.name ?? ""} readOnly disabled />
                          )}
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1 fw-medium fs-14">Gender</label>
                          <input type="text" className="form-control bg-light" value={patientGenderLabel} readOnly disabled />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label mb-1 fw-medium fs-14">Email Address</label>
                          <input type="text" className="form-control bg-light" value={patient?.email ?? ""} readOnly disabled />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label mb-1 fw-medium fs-14">Blood Group</label>
                          <input type="text" className="form-control bg-light" value={patientBloodLabel} readOnly disabled />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1 fw-medium fs-14">Date of Birth</label>
                          <input type="text" className="form-control bg-light" value={patientDobFormatted} readOnly disabled />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label mb-1 fw-medium fs-14">Age</label>
                          <div className="row g-2">
                            <div className="col-4">
                              <input
                                type="text"
                                className="form-control bg-light"
                                placeholder="Years"
                                value={patientAgeYears}
                                readOnly
                                disabled
                              />
                            </div>
                            <div className="col-4">
                              <input
                                type="text"
                                className="form-control bg-light"
                                placeholder="Months"
                                value={patientAgeMonths}
                                readOnly
                                disabled
                              />
                            </div>
                            <div className="col-4">
                              <input
                                type="text"
                                className="form-control bg-light"
                                placeholder="Days"
                                value={patientAgeDays}
                                readOnly
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label mb-1 fw-medium fs-14">Aadhar No</label>
                          <input type="text" className="form-control bg-light" value={patient?.aadharNo ?? ""} readOnly disabled />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1 fw-medium fs-14">Marital Status</label>
                          <input type="text" className="form-control bg-light" value={patientMaritalLabel} readOnly disabled />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label mb-1 fw-medium fs-14">Ayushman No</label>
                          <input type="text" className="form-control bg-light" value={patient?.ayushmanCardNo ?? ""} readOnly disabled />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label mb-1 fw-medium fs-14">Occupation</label>
                          <input type="text" className="form-control bg-light" value={patient?.occupation ?? ""} readOnly disabled />
                        </div>
                        <div className="w-100" />
                        <div className="col-md-4">
                          <label className="form-label mb-1 fw-medium fs-14">Drug Sensitivity</label>
                          <input type="text" className="form-control bg-light" value={patient?.drugSensitivity ?? ""} readOnly disabled />
                        </div>
                        <div className="col-md-8">
                          <label className="form-label mb-1 fw-medium fs-14">Address</label>
                          <input type="text" className="form-control bg-light" value={patient?.address ?? ""} readOnly disabled />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label mb-1 fw-medium fs-14">Attendant Name</label>
                          <input type="text" className="form-control bg-light" value={patient?.attendantName ?? ""} readOnly disabled />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label mb-1 fw-medium fs-14">Relation to Patient</label>
                          <input type="text" className="form-control bg-light" value={patient?.attendantRelation ?? ""} readOnly disabled />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <h6 className="fw-bold text-primary mb-3">IPD Details</h6>
                      <div className="row g-3">
                        <div className="col-md-8">
                          <label className="form-label mb-1 fw-medium fs-14">Consulting Doctor <span className="text-danger">*</span></label>
                          <CommonSelect
                            options={doctorOptions}
                            value={selectedDoctor}
                            onChange={handleDoctorChange}
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
                                id="edit-ipd-mlc-toggle"
                                checked={mlc}
                                onChange={(e) => handleMlcToggle(e.target.checked)}
                                aria-label="Medico-legal case (MLC)"
                              />
                              <label className="form-check-label fw-medium fs-14" htmlFor="edit-ipd-mlc-toggle">
                                {mlc ? "Yes" : "No"}
                              </label>
                            </div>
                            {mlc ? (
                              <span className="badge" style={{ background: "#fef9c3", color: "#854d0e", fontSize: "0.7rem" }}>
                                MLC
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {mlc ? (
                          <IpdMlcFields idPrefix="edit-ipd-mlc" value={mlcData} onChange={setMlcData} />
                        ) : null}
                        <IpdAddProceduresField
                          proceduresOptions={proceduresOptions}
                          addProcedureSelect={addProcedureSelect}
                          onAddProcedure={handleAddProcedure}
                          proceduresLoading={proceduresLoading}
                          procedures={addedProcedures}
                          onIncrementUnits={handleIncrementProcedureUnits}
                          onDecrementUnits={handleDecrementProcedureUnits}
                          onRemove={handleRemoveProcedure}
                        />
                        <div className="col-12">
                          <label htmlFor="edit-ipd-reason" className="form-label mb-1 fw-medium fs-14">
                            Reason for Admission <span className="text-danger">*</span>
                          </label>
                          <textarea
                            id="edit-ipd-reason"
                            className="form-control"
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Diabetes complications"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="card mb-3">
                    <div className="card-body p-0">
                      <div className="px-3 pt-3 pb-2">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                          <h6 className="fw-bold text-primary mb-0 d-flex align-items-center flex-wrap gap-2">
                            Bed Details
                            {selectedBed ? (
                              <span className="badge badge-soft-success border border-success fw-medium fs-12">
                                {selectedBed.bedCode} selected
                              </span>
                            ) : null}
                          </h6>
                          <IpdBedWardFilter
                            wardOptions={wardOptions}
                            selectedWardId={selectedWardFilterId}
                            onWardFilterChange={handleWardFilterChange}
                            wardsLoading={wardsLoading}
                          />
                        </div>
                      </div>
                      <IpdBedSelectionStep
                        data={bedBlockData}
                        loading={bedsLoading}
                        error={bedsError}
                        selectedBedId={selectedBedId}
                        onSelectBed={handleSelectBed}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="col-12 col-lg-4">
                <div className="card h-100">
                  <div className="card-body p-3">
                    <h6 className="fw-bold text-primary mb-2">Payment Details</h6>
                    <div className="mb-2 d-flex align-items-center flex-wrap gap-2">
                      <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>
                        Payment Mode
                      </label>
                      <div className="d-flex gap-3 flex-wrap ms-auto justify-content-end">
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="editIpdPaymentMode" id="edit-ipd-cash" value="Cash" checked={paymentMode === "Cash"} onChange={(e) => setPaymentMode(e.target.value)} />
                          <label className="form-check-label" htmlFor="edit-ipd-cash">Cash</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="editIpdPaymentMode" id="edit-ipd-upi" value="UPI" checked={paymentMode === "UPI"} onChange={(e) => setPaymentMode(e.target.value)} />
                          <label className="form-check-label" htmlFor="edit-ipd-upi">UPI</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="editIpdPaymentMode" id="edit-ipd-card" value="Card" checked={paymentMode === "Card"} onChange={(e) => setPaymentMode(e.target.value)} />
                          <label className="form-check-label" htmlFor="edit-ipd-card">Card</label>
                        </div>
                      </div>
                    </div>
                    <div className="mb-2 d-flex align-items-center">
                      <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>
                        Total
                      </label>
                      <div className="form-control bg-light fs-15" style={{ pointerEvents: "none" }}>
                        ₹{subtotal.toFixed(2)}
                      </div>
                    </div>
                    <div className="mb-2 d-flex align-items-center">
                      <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Discount</label>
                      <input
                        type="number"
                        className="form-control fs-15"
                        placeholder="0"
                        value={discount || ""}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        min={0}
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
                        onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="mb-2 d-flex align-items-center">
                      <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>
                        Balance
                      </label>
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

            <div className="d-flex align-items-center justify-content-end mt-4 flex-wrap gap-2">
              <Link href={all_routes.ipdAppointments} className="btn btn-light fw-medium fs-14 px-4">
                Cancel
              </Link>
              {formStep === 2 && (
                <button type="button" className="btn btn-light fw-medium fs-14 px-4" onClick={() => { setFormStep(1); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={submitLoading}>
                  <i className="ti ti-arrow-left me-1" />Back
                </button>
              )}
              {formStep === 3 && (
                <button type="button" className="btn btn-light fw-medium fs-14 px-4" onClick={() => { setFormStep(2); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={submitLoading}>
                  <i className="ti ti-arrow-left me-1" />Back
                </button>
              )}
              <button type="submit" className="btn font-weight-bold fs-15 fw-medium rounded btn-primary" disabled={submitLoading || bedsLoading}>
                {submitLoading ? (
                  <><i className="ti ti-loader-2 me-1" />Saving...</>
                ) : formStep === 1 ? (
                  <>Next: IPD Details<i className="ti ti-arrow-right ms-1" /></>
                ) : formStep === 2 ? (
                  <>Next: Select Bed<i className="ti ti-arrow-right ms-1" /></>
                ) : (
                  <>Save IPD Admission<i className="ti ti-check ms-1" /></>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditIpdAppointmentComponent;
