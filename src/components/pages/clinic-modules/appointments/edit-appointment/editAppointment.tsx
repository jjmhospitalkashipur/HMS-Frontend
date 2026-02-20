"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { all_routes } from "../../../../../routes/all_routes";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";
import { DatePicker, TimePicker } from "antd";
import CommonSelect, { Option } from "@/core/common/common-select/commonSelect";
import {
  Title,
  Gender,
  Visit_Type,
  Blood_Group,
  Appointment_Type,
} from "@/core/common/selectOption";

const STATUS_OPTIONS: Option[] = [
  { value: "Scheduled", label: "Scheduled" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

interface IVisitTypeCharge {
  type: string;
  charge: number;
}

interface IDoctor {
  _id: string;
  name: string;
  sessions?: string[];
  visitTypes?: IVisitTypeCharge[];
}

const EditAppointmentComponent = () => {
  const params = useParams();
  const router = useRouter();
  const visitId = params?.id as string;

  const getModalContainer = () => {
    return document.body;
  };

  // Edit appointment state
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<Option[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Option | null>(null);
  const [sessionOptions, setSessionOptions] = useState<Option[]>([]);
  const [sessionSlot, setSessionSlot] = useState<Option | null>(null);
  const [visitDate, setVisitDate] = useState<any>(null);
  const [visitTime, setVisitTime] = useState<any>(null);
  const [visitType, setVisitType] = useState<Option | null>(Visit_Type[0]);
  const [appointmentType, setAppointmentType] = useState<string>("OPD");
  const [reason, setReason] = useState<string>("");
  const [status, setStatus] = useState<Option | null>(STATUS_OPTIONS[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Payment
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [total, setTotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [amountPaidFromApi, setAmountPaidFromApi] = useState<number>(0); // amount already paid (from visit)
  const finalAmount = total - discount;
  const balance = finalAmount - amountReceived;
  
  // Patient fields
  const [phone, setPhone] = useState<string>("");
  const [title, setTitle] = useState<Option | null>(Title[0] || null);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [dob, setDob] = useState<any>(null);
  const [ageYears, setAgeYears] = useState<string>("");
  const [ageMonths, setAgeMonths] = useState<string>("");
  const [ageDays, setAgeDays] = useState<string>("");
  const [gender, setGender] = useState<Option | null>(Gender[0] || null);
  const [bloodGroup, setBloodGroup] = useState<Option | null>(Blood_Group[0] || null);
  const [address, setAddress] = useState<string>("");
  const [emergencyContactName, setEmergencyContactName] = useState<string>("");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("");

  const fetchDoctors = useCallback(async () => {
    if (!API_BASE_URL) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/hospital/doctors`, { params: { limit: 100 } });
      if (res.data?.code === 200 && res.data?.data?.doctors) {
        const list: IDoctor[] = res.data.data.doctors;
        setDoctors(list);
        setDoctorOptions(list.map((d) => ({ value: d._id, label: d.name })));
      }
    } catch (e) {
      console.error("Error fetching doctors:", e);
    }
  }, []);

  const fetchVisitForEdit = useCallback(async (id: string) => {
    if (!API_BASE_URL) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/hospital/visits/${id}`);
      if (res.data?.code === 200 && res.data?.data?.visit) {
        const v = res.data.data.visit;
        setVisitDate(v.visitDate ? dayjs(v.visitDate) : null);
        setVisitTime(v.visitTime ? dayjs(v.visitTime, "HH:mm") : null);
        setVisitType(Visit_Type.find((vt) => vt.value === v.visitType) || Visit_Type[0]);
        setAppointmentType(v.appointmentType || "OPD");
        setReason(v.reason || "");
        setStatus(STATUS_OPTIONS.find((s) => s.value === v.status) || STATUS_OPTIONS[0]);
        const priceNum = v.price != null ? Number(v.price) : 0;
        const discountNum = v.discount != null ? Number(v.discount) : 0;
        const amountPaid = (v as { amountPaid?: number }).amountPaid != null
          ? Number((v as { amountPaid?: number }).amountPaid)
          : (v as { amountReceived?: number }).amountReceived != null
            ? Number((v as { amountReceived?: number }).amountReceived)
            : 0;
        setTotal(priceNum + discountNum);
        setDiscount(discountNum);
        setAmountReceived(amountPaid);
        setAmountPaidFromApi(amountPaid);
        const transactions = (v as { transactions?: Array<{ paymentMode?: string }> }).transactions;
        const lastPaymentMode = transactions?.length
          ? transactions[transactions.length - 1]?.paymentMode
          : undefined;
        setPaymentMode(lastPaymentMode ?? (v as { paymentMode?: string }).paymentMode ?? "Cash");
        
        const docOpt = { value: v.doctorId, label: "" };
        const docRes = await axios.get(`${API_BASE_URL}/hospital/doctors/${v.doctorId}`);
        if (docRes.data?.code === 200 && docRes.data?.data?.doctor) {
          const d = docRes.data.data.doctor;
          docOpt.label = d.name || "Unknown";
          setSelectedDoctor(docOpt);
          const sessions = d.sessions;
          if (sessions?.length) {
            const opts = sessions.map((s: string) => ({ value: s, label: s }));
            setSessionOptions(opts);
            setSessionSlot(opts.find((o: Option) => o.value === v.sessionSlot) || opts[0] || null);
          } else {
            setSessionOptions([]);
            setSessionSlot(null);
          }
        } else {
          setSelectedDoctor(docOpt);
          setSessionOptions([]);
          setSessionSlot(null);
        }
        
        try {
          const pRes = await axios.get(`${API_BASE_URL}/hospital/patients/${v.patientId}`);
          if (pRes.data?.code === 200 && pRes.data?.data?.patient) {
            const p = pRes.data.data.patient;
            setPhone(p.phone || "");
            setTitle(Title.find((t) => t.value === p.title) || Title[0] || null);
            setName(p.name || "");
            setEmail(p.email || "");
            setDob(p.dob ? dayjs(p.dob) : null);
            setGender(Gender.find((g) => g.value === p.gender) || Gender[0] || null);
            setBloodGroup(Blood_Group.find((bg) => bg.value === p.bloodGroup) || Blood_Group[0] || null);
            setAddress(p.address || "");
            if (p.dob) {
              const birthDate = dayjs(p.dob).toDate();
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
            } else if (p.age != null) {
              setAgeYears(String(p.age));
            }
            if (p.emergencyContacts?.length) {
              setEmergencyContactName(p.emergencyContacts[0].name || "");
              setEmergencyPhone(p.emergencyContacts[0].number || "");
            }
          }
        } catch {
          // keep defaults
        }
      } else {
        setError("Appointment not found");
      }
    } catch (e: any) {
      console.error("Error fetching visit:", e);
      setError(e.response?.data?.message || "Failed to load appointment");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visitId) {
      fetchDoctors().then(() => fetchVisitForEdit(visitId));
    }
  }, [visitId, fetchDoctors, fetchVisitForEdit]);

  useEffect(() => {
    if (!selectedDoctor?.value) {
      setSessionOptions([]);
      setSessionSlot(null);
      return;
    }
    const doc = doctors.find((d) => d._id === selectedDoctor.value);
    if (doc?.sessions?.length) {
      const opts = doc.sessions.map((s) => ({ value: s, label: s }));
      setSessionOptions(opts);
      setSessionSlot((prev) => (prev && opts.some((o: Option) => o.value === prev?.value) ? prev : opts[0] || null));
    } else {
      setSessionOptions([]);
      setSessionSlot(null);
    }
  }, [selectedDoctor, doctors]);

  // Recalculate Total from doctor's visit type charge when doctor or visit type changes (same as new appointment)
  const updateTotalFromDoctorCharge = useCallback(() => {
    if (!selectedDoctor?.value || !visitType?.value || visitType.value === "Select") {
      return;
    }
    const doctor = doctors.find((d) => d._id === selectedDoctor.value);
    const visitTypes = doctor?.visitTypes;
    if (!visitTypes?.length) {
      return;
    }
    const vtValue = visitType.value;
    let match = visitTypes.find((vt) => vt.type === vtValue);
    if (!match && vtValue === "New") {
      match = visitTypes.find((vt) => vt.type === "OPD");
    }
    if (match != null) {
      setTotal(match.charge);
    }
  }, [selectedDoctor, visitType, doctors]);

  useEffect(() => {
    updateTotalFromDoctorCharge();
  }, [updateTotalFromDoctorCharge]);

  const handleEditDoctorChange = (opt: Option | null) => {
    setSelectedDoctor(opt);
    setSessionSlot(null);
  };

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

  const getDobValue = () => {
    if (!dob) return undefined;
    if (dayjs.isDayjs(dob)) return dob;
    if (typeof dob === "string" || dob instanceof Date) {
      const parsed = dayjs(dob);
      return parsed.isValid() ? parsed : undefined;
    }
    return undefined;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitId || !API_BASE_URL) return;
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        visitDate: visitDate ? dayjs(visitDate).format("YYYY-MM-DD") : undefined,
        visitTime: visitTime ? (dayjs.isDayjs(visitTime) ? visitTime.format("HH:mm") : dayjs(visitTime).format("HH:mm")) : undefined,
        sessionSlot: sessionSlot?.value,
        visitType: visitType?.value !== "Select" ? visitType?.value : undefined,
        appointmentType: appointmentType === "Day care" ? "Day Care" : appointmentType,
        status: status?.value,
        reason: reason || undefined,
      };
      const remainingAmount = Math.max(0, amountReceived - amountPaidFromApi);
      if (remainingAmount > 0) {
        payload.transaction = {
          transactionType: "Payment",
          amount: remainingAmount,
          paymentMode,
        };
      }
      const res = await axios.patch(`${API_BASE_URL}/hospital/visits/${visitId}`, payload);
      if (res.data?.code === 200 || (res.status >= 200 && res.status < 300)) {
        router.push(all_routes.appointments);
      } else {
        setError(res.data?.message || "Failed to update appointment");
      }
    } catch (err: any) {
      console.error("Error updating visit:", err);
      setError(err.response?.data?.message || "Failed to update appointment");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !visitDate) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !visitDate) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
          </div>
          <Link href={all_routes.appointments} className="btn btn-primary">
            Back to Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="mb-4">
          <h6 className="fw-bold mb-0 d-flex align-items-center">
            <Link href={all_routes.appointments} className="text-dark">
              <i className="ti ti-chevron-left me-1" />
              Appointments
            </Link>
          </h6>
        </div>

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

        {/* Edit Form */}
        <div className="card">
          <div className="card-body">
            <div className="border-bottom d-flex align-items-center justify-content-between pb-3 mb-3">
              <h5 className="fs-18 fw-bold mb-0">Edit Appointment</h5>
            </div>
            <form onSubmit={handleEditSubmit}>
              {/* Patient Details (read-only in edit) */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">Patient Details</h6>
                <div className="row">
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Phone Number</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={phone}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Title</label>
                      <CommonSelect options={Title} className="select" value={title} onChange={() => {}} disabled />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Name</label>
                      <input type="text" className="form-control bg-light" value={name} readOnly disabled />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Gender</label>
                      <CommonSelect options={Gender} className="select" value={gender} onChange={() => {}} disabled />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Email</label>
                      <input type="email" className="form-control bg-light" value={email} readOnly disabled />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">DOB</label>
                      <DatePicker
                        className="form-control w-100 bg-light"
                        format="DD-MM-YYYY"
                        getPopupContainer={getModalContainer}
                        value={getDobValue()}
                        onChange={() => {}}
                        allowClear={false}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Age (Y/M/D)</label>
                      <div className="row g-1">
                        <div className="col-4">
                          <input type="text" className="form-control bg-light" placeholder="Y" value={ageYears} readOnly disabled />
                        </div>
                        <div className="col-4">
                          <input type="text" className="form-control bg-light" placeholder="M" value={ageMonths} readOnly disabled />
                        </div>
                        <div className="col-4">
                          <input type="text" className="form-control bg-light" placeholder="D" value={ageDays} readOnly disabled />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Blood Group</label>
                      <CommonSelect options={Blood_Group} className="select" value={bloodGroup} onChange={() => {}} disabled />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Address</label>
                      <input type="text" className="form-control bg-light" value={address} readOnly disabled />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Emergency Contact Name</label>
                      <input type="text" className="form-control bg-light" value={emergencyContactName} readOnly disabled />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Emergency Contact Phone</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={emergencyPhone}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Details and Payment Details */}
              <div className="row mb-4">
                <div className="col-lg-7 pe-3">
                  <h6 className="fw-bold text-primary mb-3">Doctor Details</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">Doctor</label>
                        <CommonSelect options={doctorOptions} className="select" value={selectedDoctor} onChange={handleEditDoctorChange} disabled />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">Date of Appointment</label>
                        <DatePicker className="form-control w-100" format="DD-MM-YYYY" getPopupContainer={getModalContainer} value={visitDate} onChange={setVisitDate} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">Session Slot</label>
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
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">Time</label>
                        <TimePicker className="w-100" format="HH:mm" getPopupContainer={getModalContainer} value={visitTime} onChange={setVisitTime} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-2 fw-medium">Appointment Type</label>
                        <div className="d-flex gap-3 flex-wrap">
                          {Appointment_Type.map((type) => (
                            <div key={type.value} className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="editAppointmentType"
                                id={`edit-apt-${type.value}`}
                                value={type.value}
                                checked={appointmentType === type.value}
                                onChange={(e) => setAppointmentType(e.target.value)}
                              />
                              <label className="form-check-label" htmlFor={`edit-apt-${type.value}`}>{type.label}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">Visit Type</label>
                        <div className="d-flex gap-3 flex-wrap">
                          {Visit_Type.filter((v) => v.value !== "Select").map((type) => (
                            <div key={type.value} className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="editVisitType"
                                id={`edit-visitType-${type.value}`}
                                value={type.value}
                                checked={visitType?.value === type.value}
                                onChange={(e) => {
                                  const opt = Visit_Type.find((v) => v.value === e.target.value);
                                  if (opt) setVisitType(opt);
                                }}
                              />
                              <label className="form-check-label" htmlFor={`edit-visitType-${type.value}`}>
                                {type.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">Status</label>
                        <CommonSelect options={STATUS_OPTIONS} className="select" value={status} onChange={setStatus} />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Payment Details (read-only) */}
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
                              name="editPaymentMode"
                              id="edit-cash"
                              value="Cash"
                              checked={paymentMode === "Cash"}
                              onChange={(e) => setPaymentMode(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="edit-cash">Cash</label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="editPaymentMode"
                              id="edit-upi"
                              value="UPI"
                              checked={paymentMode === "UPI"}
                              onChange={(e) => setPaymentMode(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="edit-upi">UPI</label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="editPaymentMode"
                              id="edit-card"
                              value="Card"
                              checked={paymentMode === "Card"}
                              onChange={(e) => setPaymentMode(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="edit-card">Card</label>
                          </div>
                        </div>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Total</label>
                        <div className="form-control bg-light" style={{ pointerEvents: "none" }}>
                          ₹{total.toFixed(2)}
                        </div>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Discount</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={discount || ""}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Final Amount</label>
                        <div className="form-control bg-light" style={{ pointerEvents: "none" }}>
                          ₹{finalAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Amount Received</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={amountReceived || ""}
                          onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Balance</label>
                        <div
                          className="form-control d-flex align-items-center justify-content-between"
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

              <div className="d-flex justify-content-end gap-2 border-top pt-3">
                <Link href={all_routes.appointments} className="btn btn-light">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentComponent;
