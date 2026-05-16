"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CommonSelect, { Option } from "@/core/common/common-select/commonSelect";
import { Title, Gender, Blood_Group } from "@/core/common/selectOption";
import { all_routes } from "@/routes/all_routes";
import axios from "axios";
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
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";

interface IIpdProcedure {
  procedureId: string;
  procedureName?: string;
  price?: number;
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
}

interface IIpdDoctor {
  _id: string;
  name: string;
}

interface IIpdTransaction {
  _id: string;
  amount?: number;
  paymentMode?: string;
  createdAt?: string;
  transactionDate?: string;
}

interface IIpdDetail {
  _id: string;
  patientId: string;
  doctorId: string;
  ipdChargesType?: string;
  ipdChargesHours?: number;
  ipdChargesRate?: number;
  customIPDRate?: number;
  bedChargesType?: string;
  bedChargesHours?: number;
  bedChargesRate?: number;
  procedures?: IIpdProcedure[];
  doctorVisitCharges?: boolean;
  discount?: number;
  appointmentDate?: string;
  doctor?: IIpdDoctor;
  patient?: IIpdPatient;
  amountPaid?: number;
  transactions?: IIpdTransaction[];
}

const EditIpdAppointmentComponent = () => {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [ipdId, setIpdId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patient, setPatient] = useState<IIpdPatient | null>(null);

  const [doctorOptions, setDoctorOptions] = useState<Option[]>([]);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Option | null>(null);

  const [doctorVisitCharges, setDoctorVisitCharges] = useState<"Yes" | "No">("No");

  const [proceduresOptions, setProceduresOptions] = useState<Option[]>([]);
  const [procedurePriceById, setProcedurePriceById] = useState<Record<string, number>>({});
  const [proceduresLoading, setProceduresLoading] = useState(false);
  const [addedProcedures, setAddedProcedures] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [addProcedureSelect, setAddProcedureSelect] = useState<Option | null>(null);

  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [amountPaidFromApi, setAmountPaidFromApi] = useState<number>(0);

  const [discount, setDiscount] = useState<number>(0);
  const [discountFromApi, setDiscountFromApi] = useState<number>(0);
  const [discountPassword, setDiscountPassword] = useState<string>("");
  const [discountPasswordError, setDiscountPasswordError] = useState<string>("");
  const [showDiscountPasswordDialog, setShowDiscountPasswordDialog] = useState<boolean>(false);
  const [appointmentDate, setAppointmentDate] = useState<string>("");

  const proceduresTotal = addedProcedures.reduce((sum, p) => sum + p.price, 0);
  const [ipdDoctorCharge, setIpdDoctorCharge] = useState<number>(0);
  const docVisitAmount = doctorVisitCharges === "Yes" ? ipdDoctorCharge : 0;
  const subtotal = proceduresTotal + docVisitAmount;
  const netTotal = subtotal - (discount || 0);
  const balance = netTotal - (amountReceived || 0);

  const fetchDoctors = useCallback(
    async (search = "") => {
      if (!API_BASE_URL) return;
      setDoctorSearchLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/hospital/doctors`, {
          params: { limit: 50, search: search || undefined },
        });
        const list = res.data?.data?.doctors ?? res.data?.data ?? [];
        const arr = Array.isArray(list) ? (list as IDoctor[]) : [];
        setDoctors(arr);
        setDoctorOptions(
          arr.map((d) => ({ value: d._id, label: d.name ?? "—" }))
        );
      } catch {
        setDoctorOptions([]);
      } finally {
        setDoctorSearchLoading(false);
      }
    },
    []
  );

  const fetchProcedures = useCallback(async () => {
    if (!API_BASE_URL) return;
    setProceduresLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/hospital/procedures`, { params: { limit: 50 } });
      const list = res.data?.data?.procedures ?? res.data?.data ?? [];
      const arr = Array.isArray(list) ? list : [];
      setProceduresOptions(
        arr.map((p: { _id: string; procedureName?: string; price?: number; basePrice?: number }) => ({
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

  const fetchIPD = useCallback(
    async (ipdIdParam: string) => {
      if (!API_BASE_URL) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/hospital/ipd-appointments/${ipdIdParam}`);
        const raw = res.data?.data?.ipdAppointment ?? res.data?.data;
        const data = raw as IIpdDetail | undefined;
        if (!data) {
          setError("IPD appointment not found.");
          return;
        }

        setIpdId(data._id);
        setPatientId(data.patientId ?? null);

        if (data.patient) {
          setPatient(data.patient as IIpdPatient);
        } else if (data.patientId) {
          try {
            const pRes = await axios.get(`${API_BASE_URL}/hospital/patients/${data.patientId}`);
            const pData = pRes.data?.data?.patient ?? pRes.data?.data;
            if (pData) setPatient({ _id: data.patientId, ...(pData as any) } as IIpdPatient);
          } catch {
            setPatient(null);
          }
        } else {
          setPatient(null);
        }

        if (data.doctor) {
          setSelectedDoctor({ value: data.doctor._id, label: data.doctor.name ?? "" });
        } else if (data.doctorId) {
          const match = doctors.find((d) => d._id === data.doctorId);
          setSelectedDoctor({
            value: data.doctorId,
            label: match?.name ?? "",
          });
        } else {
          setSelectedDoctor(null);
        }

        setDoctorVisitCharges(data.doctorVisitCharges ? "Yes" : "No");

        const procs = (data.procedures ?? []).map((p) => ({
          id: p.procedureId ?? (p as any)._id,
          name: p.procedureName ?? "—",
          price: p.price ?? 0,
        }));
        setAddedProcedures(procs);
        setDiscount(data.discount ?? 0);
        setDiscountFromApi(data.discount ?? 0);
        setAppointmentDate(
          data.appointmentDate ? dayjs(data.appointmentDate).format("YYYY-MM-DD") : ""
        );

        // doctor charge for ipd (from API if present)
        const apiDoctorCharge =
          (data as any).doctorChargesAmount != null
            ? Number((data as any).doctorChargesAmount)
            : 0;
        setIpdDoctorCharge(apiDoctorCharge);

        const txTotal = Array.isArray(data.transactions)
          ? data.transactions.reduce((sum, t) => sum + (Number(t?.amount) || 0), 0)
          : 0;
        const paid = data.amountPaid != null ? Number(data.amountPaid) : txTotal;
        setAmountPaidFromApi(paid);
        setAmountReceived(paid);
        const lastMode = Array.isArray(data.transactions) && data.transactions.length
          ? data.transactions[data.transactions.length - 1]?.paymentMode
          : undefined;
        setPaymentMode(lastMode ?? "Cash");
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Failed to load ipd appointment.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!id) return;
    fetchDoctors();
    fetchProcedures();
    fetchIPD(id);
  }, [id, fetchDoctors, fetchProcedures, fetchIPD]);

  // If no doctor charge came from API, try to derive it from doctor's visitTypes (same logic as create)
  useEffect(() => {
    if (!selectedDoctor?.value || ipdDoctorCharge > 0) return;
    const doctor = doctors.find((d) => d._id === selectedDoctor.value);
    const visitTypes = doctor?.visitTypes;
    if (!visitTypes?.length) return;
    const match = visitTypes.find((vt) => {
      if (vt.visitType != null && vt.appointmentType != null) {
        return (
          vt.visitType === "New" &&
          (vt.appointmentType === "IPD" || vt.appointmentType === "In Patient")
        );
      }
      if (vt.type != null) return vt.type === "IPD";
      return false;
    });
    if (match?.charge != null) {
      setIpdDoctorCharge(match.charge);
    }
  }, [selectedDoctor?.value, doctors, ipdDoctorCharge]);

  const handleAddProcedure = (option: Option | null) => {
    if (!option?.value || procedurePriceById[option.value] == null) return;
    const price = procedurePriceById[option.value] ?? 0;
    setAddedProcedures((prev) => {
      if (prev.some((p) => p.id === option.value)) return prev;
      return [...prev, { id: option.value, name: option.label, price }];
    });
    setAddProcedureSelect(null);
  };

  const handleRemoveProcedure = (id: string) => {
    setAddedProcedures((prev) => prev.filter((p) => p.id !== id));
  };

  const doIpdSubmit = async (discountPwd: string | undefined) => {
    if (!ipdId || !API_BASE_URL || !selectedDoctor?.value) return;
    const procedureIds = addedProcedures
      .map((p) => p.id)
      .filter((pid) => Boolean(pid) && procedurePriceById[pid] != null);
    const uniqueProcedureIds = Array.from(new Set(procedureIds));
    const discountNum = Number(discount) || 0;

    setSubmitLoading(true);
    setError("");
    try {
      const remainingAmount = Math.max(
        0,
        (Number(amountReceived) || 0) - (Number(amountPaidFromApi) || 0)
      );
      const payload = {
        ...(patientId && { patientId }),
        doctorId: selectedDoctor.value,
        procedureIds: uniqueProcedureIds,
        doctorVisitCharges: doctorVisitCharges === "Yes",
        discount: discountNum,
        appointmentDate: appointmentDate || undefined,
        ...(discountNum > 0 && discountPwd !== undefined && discountPwd !== "" && { discountPassword: discountPwd }),
      };
      const res = await axios.put(
        `${API_BASE_URL}/hospital/ipd-appointments/${ipdId}`,
        payload
      );
      const ok = res?.status >= 200 && res?.status < 300;
      const codeOk = res?.data?.code === 200 || res?.data?.code === "200";
      if (ok || codeOk) {
        if (remainingAmount > 0) {
          try {
            await axios.post(`${API_BASE_URL}/hospital/transactions`, {
              visitId: ipdId,
              transactionType: "Payment",
              amount: remainingAmount,
              paymentMode,
            });
          } catch (txErr) {
            console.error("IPD updated but transaction failed:", txErr);
          }
        }
        router.push(all_routes.ipdAppointments);
      } else {
        const responseMessage = res?.data?.message ?? "Failed to update ipd appointment.";
        if (discountPwd !== undefined && discount > 0) {
          setDiscountPasswordError(String(responseMessage));
          setShowDiscountPasswordDialog(true);
          setError("");
          return;
        }
        setError(responseMessage);
      }
    } catch (err: any) {
      const apiMessage =
        err?.response?.data?.message ?? "Failed to update ipd appointment.";
      if (discountPwd !== undefined && discount > 0) {
        setDiscountPasswordError(String(apiMessage));
        setShowDiscountPasswordDialog(true);
        setError("");
        return;
      }
      setError(apiMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!ipdId || !API_BASE_URL) return;
    if (!selectedDoctor?.value) {
      setError("Please select a doctor.");
      return;
    }
    const hasDiscountMismatch = Math.abs(discount - discountFromApi) > 0.0001;
    if (discount > 0 && hasDiscountMismatch) {
      setDiscountPassword("");
      setDiscountPasswordError("");
      setShowDiscountPasswordDialog(true);
      return;
    }
    void doIpdSubmit(undefined);
  };

  const handleDiscountPasswordConfirm = () => {
    if (!discountPassword.trim()) {
      setDiscountPasswordError("Please enter the discount password.");
      return;
    }
    setDiscountPasswordError("");
    void doIpdSubmit(discountPassword.trim());
  };

  const handleDiscountPasswordCancel = () => {
    setShowDiscountPasswordDialog(false);
    setDiscountPassword("");
    setDiscountPasswordError("");
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
  const patientDobFormatted = patient?.dob ? dayjs(patient.dob).format("DD-MM-YYYY") : "";
  const patientAgeDisplay =
    patient?.age != null
      ? String(patient.age)
      : patient?.dob
      ? String(dayjs().diff(dayjs(patient.dob), "year"))
      : "";

  return (
    <div className="page-wrapper">
      {showDiscountPasswordDialog && (
        <div
          className="modal fade show d-block"
          id="edit-ipd-discount-password-modal"
          tabIndex={-1}
          aria-labelledby="edit-ipd-discount-password-label"
          aria-modal="true"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="edit-ipd-discount-password-label">
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
                <label htmlFor="edit-ipd-discount-password-input" className="form-label">
                  Enter password to apply discount
                </label>
                {discountPasswordError ? (
                  <div className="alert alert-danger py-2 mb-2" role="alert">
                    {discountPasswordError}
                  </div>
                ) : null}
                <input
                  id="edit-ipd-discount-password-input"
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
      <div className="content">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="fw-bold mb-0">Edit IPD Appointment</h4>
          <button
            type="button"
            className="btn btn-light"
            onClick={() => router.push(all_routes.ipdAppointments)}
          >
            Back to IPD Appointments
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="fw-bold text-primary mb-3">Patient Details</h6>
                <div className="row">
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Phone Number</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={patient?.phone ?? ""}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Title</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={patientTitleLabel}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Name</label>
                      {patient?._id ? (
                        <Link
                          href={`${all_routes.patientDetails}?id=${patient._id}`}
                          className="form-control bg-light border-0 py-2 text-decoration-none text-dark d-flex align-items-center"
                          style={{ cursor: "pointer" }}
                        >
                          <span className="flex-grow-1 text-start">
                            {patient?.name ?? "—"}
                          </span>
                          <i className="ti ti-arrow-right fs-12 ms-1" />
                        </Link>
                      ) : (
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={patient?.name ?? ""}
                          readOnly
                          disabled
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Gender</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={patientGenderLabel}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Email</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={patient?.email ?? ""}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">DOB</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={patientDobFormatted}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Age</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={patientAgeDisplay}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Blood Group</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={patientBloodLabel}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Address</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={patient?.address ?? ""}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Relation to Patient</label>
                          <input
                            type="text"
                            className="form-control bg-light"
                            value={(patient as any)?.attendantRelation ?? ""}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Attendant Name</label>
                          <input
                            type="text"
                            className="form-control bg-light"
                            value={(patient as any)?.attendantName ?? ""}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-7">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Aadhar No</label>
                          <input
                            type="text"
                            className="form-control bg-light"
                            value={(patient as any)?.aadharNo ?? ""}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Ayushman No</label>
                          <input
                            type="text"
                            className="form-control bg-light"
                            value={(patient as any)?.ayushmanCardNo ?? (patient as any)?.ayushmanNo ?? ""}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-lg-7 pe-3">
                <div className="card h-100">
                  <div className="card-body p-3">
                    <h6 className="fw-bold text-primary mb-2">IPD Details</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Consulting Doc<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={doctorOptions}
                            value={selectedDoctor}
                            disabled
                            isLoading={doctorSearchLoading}
                            placeholder="Search doctor..."
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Doctor Visit Charges</label>
                          <div className="d-flex gap-3 flex-wrap">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="editIpdDvcPage"
                                value="Yes"
                                checked={doctorVisitCharges === "Yes"}
                                onChange={() => setDoctorVisitCharges("Yes")}
                              />
                              <label className="form-check-label">Yes</label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="editIpdDvcPage"
                                value="No"
                                checked={doctorVisitCharges === "No"}
                                onChange={() => setDoctorVisitCharges("No")}
                              />
                              <label className="form-check-label">No</label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-2">
                          <label className="form-label mb-1 fw-medium">Add Procedures</label>
                          <CommonSelect
                            options={proceduresOptions}
                            value={addProcedureSelect}
                            onChange={handleAddProcedure}
                            placeholder="Select procedure..."
                            isLoading={proceduresLoading}
                          />
                        </div>
                        <div className="mt-2">
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
                              {addedProcedures.length === 0 ? (
                                <div className="px-2 py-3 text-center">No procedures added</div>
                              ) : (
                                addedProcedures.map((proc, idx) => (
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
                                        onClick={() => handleRemoveProcedure(proc.id)}
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
                    <div className="mb-3 d-flex align-items-center flex-wrap gap-2">
                      <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>
                        Payment Mode
                      </label>
                      <div className="d-flex gap-3 flex-wrap">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="editIpdPaymentMode"
                            value="Cash"
                            checked={paymentMode === "Cash"}
                            onChange={(e) => setPaymentMode(e.target.value)}
                          />
                          <label className="form-check-label">Cash</label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="editIpdPaymentMode"
                            value="UPI"
                            checked={paymentMode === "UPI"}
                            onChange={(e) => setPaymentMode(e.target.value)}
                          />
                          <label className="form-check-label">UPI</label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="editIpdPaymentMode"
                            value="Card"
                            checked={paymentMode === "Card"}
                            onChange={(e) => setPaymentMode(e.target.value)}
                          />
                          <label className="form-check-label">Card</label>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded overflow-hidden">
                      {addedProcedures.length > 0 && (
                        <div className="d-flex justify-content-between align-items-center px-2 py-2 border-bottom">
                          <span className="fw-medium">Procedures Charges</span>
                          <span className="text-end">{Math.round(proceduresTotal)}</span>
                        </div>
                      )}
                      {doctorVisitCharges === "Yes" && (
                        <div className="d-flex justify-content-between align-items-center px-2 py-2 border-bottom">
                          <span className="fw-medium">Doc Visit Charges</span>
                          <span className="text-end">{Math.round(docVisitAmount)}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between align-items-center px-2 py-2 border-bottom">
                        <span className="fw-medium">SubTotal</span>
                        <span className="text-end">{Math.round(subtotal)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center px-2 py-2 border-bottom gap-2">
                        <span className="fw-medium">Discount</span>
                        <input
                          type="number"
                          className="form-control text-end"
                          style={{ maxWidth: "100px", fontSize: "16px" }}
                          value={discount || ""}
                          onChange={(e) => {
                            setDiscount(parseFloat(e.target.value) || 0);
                          }}
                          min={0}
                        />
                      </div>
                      <div className="d-flex justify-content-between align-items-center px-2 py-2 border-bottom gap-2">
                        <span className="fw-medium">Amount Received</span>
                        <input
                          type="number"
                          className="form-control text-end"
                          style={{ maxWidth: "100px", fontSize: "16px" }}
                          value={amountReceived || ""}
                          onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                          min={0}
                        />
                      </div>
                      <div
                        className="d-flex justify-content-between align-items-center px-2 py-2 fw-bold"
                        style={{ backgroundColor: "#FFF7DB" }}
                      >
                        <span>Balance</span>
                        <span className="text-end">{Math.round(balance)}</span>
                      </div>
                     
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => router.push(all_routes.ipdAppointments)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                {submitLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditIpdAppointmentComponent;

