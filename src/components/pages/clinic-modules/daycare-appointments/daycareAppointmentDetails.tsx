"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { all_routes } from "@/routes/all_routes";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";

interface IDaycarePatient {
  _id: string;
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  mrd?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  address?: string;
}

interface IDaycareDoctor {
  _id: string;
  name: string;
  department?: string;
  designation?: string;
}

interface IDaycareProcedure {
  procedureId: string;
  procedureName?: string;
  price?: number;
}

interface IDaycareTransaction {
  _id: string;
  transactionId: string;
  amount: number;
  paymentMode: string;
  transactionDate: string;
  createdAt: string;
}

interface IDaycareAppointmentDetail {
  _id: string;
  daycareId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  bedChargesType?: string;
  bedChargesTotal?: number;
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

const DaycareAppointmentDetailsComponent = () => {
  const params = useParams();
  const id = params?.id as string;

  const [daycare, setDaycare] = useState<IDaycareAppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [amount, setAmount] = useState<string>("0");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDaycareDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDaycareDetails = async () => {
    try {
      setLoading(true);
      setError("");
      if (!API_BASE_URL) {
        setError("API configuration error");
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/hospital/daycare-appointments/${id}`);
      if (res.data?.code === 200 && res.data?.data) {
        const data = res.data.data?.daycareAppointment ?? res.data.data;
        setDaycare(data as IDaycareAppointmentDetail);
      } else {
        setError("Daycare appointment not found");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load daycare appointment");
    } finally {
      setLoading(false);
    }
  };

  const calculateAgeFromDob = (dob?: string) => {
    if (!dob) return undefined;
    const birth = dayjs(dob);
    if (!birth.isValid()) return undefined;
    return dayjs().diff(birth, "year");
  };

  if (loading) {
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

  if (error || !daycare) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">
            <strong>Error:</strong> {error || "Daycare appointment not found"}
          </div>
          <Link href={all_routes.daycareAppointments} className="btn btn-primary">
            Back to Daycare Appointments
          </Link>
        </div>
      </div>
    );
  }

  const doctor = daycare.doctor;
  const transactions = daycare.transactions || [];
  const baseTotal = daycare.totalPrice ?? daycare.subtotal ?? 0;
  const totalPaidFromTx = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPaid = daycare.amountPaid != null ? daycare.amountPaid : totalPaidFromTx;
  const dueAmount = Math.max(0, baseTotal - totalPaid);
  const primaryProceduresLabel =
    daycare.procedures && daycare.procedures.length
      ? daycare.procedures
          .map((p) => p.procedureName || "")
          .filter(Boolean)
          .join(", ")
      : "N/A";
  const proceduresPrice =
    daycare.procedureChargesTotal ??
    (daycare.procedures && daycare.procedures.length
      ? daycare.procedures[0].price ?? 0
      : 0);

  const handleAddTransaction = async () => {
    if (!daycare || !API_BASE_URL || submitting) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!paymentMode || paymentMode === "Select") {
      alert("Please select a payment mode");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE_URL}/hospital/transactions`, {
        visitId: daycare._id,
        transactionType: "Payment",
        amount: amountNum,
        paymentMode,
      });
      if (res.data?.code === 200 || (res.status >= 200 && res.status < 300)) {
        setShowAddTransaction(false);
        setAmount("0");
        setPaymentMode("Cash");
        await fetchDaycareDetails();
      } else {
        alert(res.data?.message || "Failed to add transaction");
      }
    } catch (err: any) {
      console.error("Error adding daycare transaction:", err);
      alert(err?.response?.data?.message || "Failed to add transaction. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddTransaction(false);
    setAmount("0");
    setPaymentMode("Cash");
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h6 className="fw-bold mb-0 d-flex align-items-center">
            <Link href={all_routes.daycareAppointments} className="text-dark">
              <i className="ti ti-chevron-left me-1" />
              Daycare Appointments
            </Link>
          </h6>
        </div>

        <div className="row">
          {/* Left column: Daycare & patient/doctor details */}
          <div className="col-lg-7 pe-3">
            <div className="card mb-3">
              <div className="card-body p-3">
                <h6 className="fw-bold text-primary mb-3">Daycare Information</h6>
                <div className="row g-2 mb-3">
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14">Daycare ID</label>
                      <div className="fw-bold text-dark">{daycare.daycareId}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14">Appointment Date</label>
                      <div className="fw-bold text-dark">
                        {daycare.appointmentDate
                          ? dayjs(daycare.appointmentDate).format("DD MMM YYYY")
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14">Status</label>
                      <div>
                        <span
                          className={`badge ${
                            daycare.status === "Completed"
                              ? "badge-soft-success"
                              : daycare.status === "Cancelled"
                              ? "badge-soft-danger"
                              : daycare.status === "In Progress"
                              ? "badge-soft-warning"
                              : "badge-soft-primary"
                          }`}
                        >
                          {daycare.status || "Scheduled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row g-2 mb-1">
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14">Bed Type</label>
                      <div className="fw-bold text-dark">{daycare.bedChargesType || "N/A"}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14">Procedures</label>
                      <div className="fw-bold text-dark text-truncate">{primaryProceduresLabel}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14 d-block">
                        Procedure Charges
                      </label>
                      <div className="fw-bold text-dark">
                        ₹{(proceduresPrice ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {doctor && (
                  <>
                    <h6 className="fw-bold text-primary mb-3">Doctor Details</h6>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <div className="mb-2">
                          <label className="form-label mb-1 fw-medium text-dark fs-14">
                            Doctor Name
                          </label>
                          <div className="fw-bold text-dark">{doctor.name}</div>
                        </div>
                      </div>
                      {doctor.designation && (
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label mb-1 fw-medium text-dark fs-14">
                              Designation
                            </label>
                            <div className="fw-bold text-dark">{doctor.designation}</div>
                          </div>
                        </div>
                      )}
                      {doctor.department && (
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label mb-1 fw-medium text-dark fs-14">
                              Department
                            </label>
                            <div className="fw-bold text-dark">{doctor.department}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Payment History with Add Transaction */}
          <div className="col-lg-5 ps-3">
            <div className="card">
              <div className="card-body p-3">
                <h6 className="fw-bold text-primary mb-2">Payment History</h6>
                {transactions.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="ti ti-receipt fs-48 mb-2 d-block" />
                    <p className="mb-0">No payment transactions found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th className="border-0 fs-13 fw-medium">ID</th>
                          <th className="border-0 fs-13 fw-medium">Date - Time</th>
                          <th className="border-0 fs-13 fw-medium">Amount</th>
                          <th className="border-0 fs-13 fw-medium">Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn) => (
                          <tr key={txn._id}>
                            <td className="fs-15 text-dark fw-medium">{txn.transactionId}</td>
                            <td className="fs-15 text-dark">
                              {dayjs(txn.transactionDate).format("DD MMM YYYY")}
                              <br />
                              <small className="text-dark">
                                {dayjs(txn.createdAt).format("HH:mm")}
                              </small>
                            </td>
                            <td className="fs-15 text-dark fw-medium">
                              <i className="ti ti-check fs-14 me-1 text-success" />
                              ₹{txn.amount?.toFixed(2) || "0.00"}
                            </td>
                            <td className="fs-15 text-dark">
                              <span className="badge badge-soft-primary">{txn.paymentMode}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-3 d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAddTransaction(true)}
                  >
                    <i className="ti ti-plus me-1" />
                    Add Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add Transaction Modal */}
      {showAddTransaction && daycare && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={handleCloseModal}
            style={{ zIndex: 1050 }}
          />
          <div
            className="modal fade show"
            style={{ display: "block", zIndex: 1055 }}
            tabIndex={-1}
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Add Transaction</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModal}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label mb-2 fw-medium text-dark">
                      Mode<span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="Select">Select</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-2 fw-medium text-dark">
                      Amount Received<span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label mb-2 fw-medium text-dark">Due</label>
                    <div className="text-dark fs-15">₹{dueAmount.toFixed(2)}</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddTransaction}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Adding...
                      </>
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DaycareAppointmentDetailsComponent;

