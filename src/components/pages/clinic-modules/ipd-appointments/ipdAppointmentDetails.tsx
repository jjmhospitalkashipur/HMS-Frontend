"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { all_routes } from "@/routes/all_routes";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";
import PrintReceipt from "@/components/pages/clinic-modules/appointments/printReceipt";
import {
  buildIPDReceiptData,
  enrichIPDDoctorForReceipt,
  type IIpdAppointmentDetail,
} from "@/components/pages/clinic-modules/appointments/buildIPDReceiptData";

const TRANSACTION_PAYMENT_MODES = ["Cash", "UPI", "Card"] as const;

const IpdAppointmentDetailsComponent = () => {
  const params = useParams();
  const id = params?.id as string;

  const [ipd, setIpd] = useState<IIpdAppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [amount, setAmount] = useState<string>("0");
  const [submitting, setSubmitting] = useState(false);
  const [transactionModeUpdatingId, setTransactionModeUpdatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [mlc, setMlc] = useState<boolean>(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [mlcSaving, setMlcSaving] = useState(false);
  const [fieldUpdateError, setFieldUpdateError] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchIPDDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchIPDDetails = async () => {
    try {
      setLoading(true);
      setError("");
      if (!API_BASE_URL) {
        setError("API configuration error");
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/hospital/ipd-appointments/${id}`);
      if (res.data?.code === 200 && res.data?.data) {
        const data = res.data.data?.ipdAppointment ?? res.data.data;
        const responseReceiptId = res.data?.data?.receiptId as string | undefined;
        let next: IIpdAppointmentDetail = {
          ...(data as IIpdAppointmentDetail),
          receiptId: (data as IIpdAppointmentDetail)?.receiptId ?? responseReceiptId,
        };
        next = await enrichIPDDoctorForReceipt(next);
        setIpd(next);
        setNotes(next.notes ?? "");
        setMlc(Boolean(next.mlc ?? next.isMlc));
      } else {
        setError("IPD appointment not found");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load ipd appointment");
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

  if (error || !ipd) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">
            <strong>Error:</strong> {error || "IPD appointment not found"}
          </div>
          <Link href={all_routes.ipdAppointments} className="btn btn-primary">
            Back to IPD Appointments
          </Link>
        </div>
      </div>
    );
  }

  const doctor = ipd.doctor;
  const transactions = ipd.transactions || [];
  const baseTotal = ipd.totalPrice ?? ipd.subtotal ?? 0;
  const totalPaidFromTx = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPaid = ipd.amountPaid != null ? ipd.amountPaid : totalPaidFromTx;
  const dueAmount = Math.max(0, baseTotal - totalPaid);
  const primaryProceduresLabel =
    ipd.procedures && ipd.procedures.length
      ? ipd.procedures
          .map((p) => p.procedureName || "")
          .filter(Boolean)
          .join(", ")
      : "N/A";
  const proceduresPrice =
    ipd.procedureChargesTotal ??
    (ipd.procedures && ipd.procedures.length
      ? ipd.procedures[0].price ?? 0
      : 0);
  const doctorChargesPrice = ipd.doctorChargesAmount ?? 0;

  const handleAddTransaction = async () => {
    if (!ipd || !API_BASE_URL || submitting) return;

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
        visitId: ipd._id,
        transactionType: "Payment",
        amount: amountNum,
        paymentMode,
      });
      if (res.data?.code === 200 || (res.status >= 200 && res.status < 300)) {
        setShowAddTransaction(false);
        setAmount("0");
        setPaymentMode("Cash");
        await fetchIPDDetails();
      } else {
        alert(res.data?.message || "Failed to add transaction");
      }
    } catch (err: any) {
      console.error("Error adding ipd transaction:", err);
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

  const patchIpdFields = async (payload: { notes?: string; mlc?: boolean }) => {
    if (!API_BASE_URL || !id) return false;
    try {
      const res = await axios.patch(`${API_BASE_URL}/hospital/ipd-appointments/${id}`, payload);
      const ok = res?.status >= 200 && res?.status < 300;
      const codeOk = res?.data?.code === 200 || res?.data?.code === "200";
      if (!ok && !codeOk) {
        setFieldUpdateError(res?.data?.message ?? "Failed to update IPD appointment.");
        return false;
      }
      setFieldUpdateError("");
      setIpd((prev) => (prev ? { ...prev, ...payload, ...(payload.mlc !== undefined ? { isMlc: payload.mlc } : {}) } : prev));
      return true;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to update IPD appointment.";
      setFieldUpdateError(message);
      return false;
    }
  };

  const handleMlcToggle = async (checked: boolean) => {
    if (!ipd || mlcSaving) return;
    const previous = mlc;
    setMlc(checked);
    setMlcSaving(true);
    const saved = await patchIpdFields({ mlc: checked });
    if (!saved) {
      setMlc(previous);
    }
    setMlcSaving(false);
  };

  const handleSaveNotes = async () => {
    if (!ipd || notesSaving) return;
    const trimmed = notes.trim();
    const current = (ipd.notes ?? "").trim();
    if (trimmed === current) return;
    setNotesSaving(true);
    const saved = await patchIpdFields({ notes: trimmed || undefined });
    if (saved) {
      setNotes(trimmed);
    }
    setNotesSaving(false);
  };

  const handleTransactionPaymentModeChange = async (
    transactionMongoId: string,
    newPaymentMode: string
  ) => {
    if (!API_BASE_URL || !ipd) return;
    try {
      setTransactionModeUpdatingId(transactionMongoId);
      await axios.patch(`${API_BASE_URL}/hospital/transactions/${transactionMongoId}`, {
        paymentMode: newPaymentMode,
      });
      setIpd((prev) => {
        if (!prev?.transactions) return prev;
        return {
          ...prev,
          transactions: prev.transactions.map((t) =>
            t._id === transactionMongoId ? { ...t, paymentMode: newPaymentMode } : t
          ),
        };
      });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to update payment mode.");
      await fetchIPDDetails();
    } finally {
      setTransactionModeUpdatingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h6 className="fw-bold mb-0 d-flex align-items-center">
            <Link href={all_routes.ipdAppointments} className="text-dark">
              <i className="ti ti-chevron-left me-1" />
              IPD Appointments
            </Link>
          </h6>
          
          <button
            type="button"
            className="btn btn-primary btn-sm d-inline-flex align-items-center"
            onClick={() => setShowPrintReceipt(true)}
          >
            <i className="ti ti-receipt me-1" />
            Print Receipt
          </button>
        </div>

        {fieldUpdateError ? (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            {fieldUpdateError}
          </div>
        ) : null}

        <div className="row">
          {/* Left column: IPD & patient/doctor details */}
          <div className="col-lg-7 pe-3">
            <div className="card mb-3">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold text-primary mb-3">IPD Information</h6>
                  <span
                    className={`badge ${
                      ipd.status === "Completed"
                        ? "badge-soft-success"
                        : ipd.status === "Cancelled"
                        ? "badge-soft-danger"
                        : ipd.status === "In Progress"
                        ? "badge-soft-warning text-dark"
                        : "badge-soft-primary"
                    }`}
                  >
                    {ipd.status || "Scheduled"}
                  </span>
                </div>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                  <h6 className="fw-bold text-primary mb-0">Patient Details</h6>
                  <Link
                    href={`${all_routes.patientDetails}?id=${ipd.patient?._id ?? ipd.patientId ?? ""}`}
                    className={`btn btn-sm d-inline-flex align-items-center ${
                      ipd.patient?._id || ipd.patientId ? "btn-primary" : "btn-light disabled"
                    }`}
                    aria-disabled={!(ipd.patient?._id || ipd.patientId)}
                  >
                    <i className="ti ti-user-circle me-1" />
                    Open Profile
                  </Link>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14">IPD ID</label>
                      <div className="fw-bold text-dark">{ipd.ipdId}</div>
                    </div>
                  </div>
                  {ipd.patient?.mrd && (
                    <div className="col-md-4">
                      <div className="mb-2">
                        <label className="form-label mb-1 fw-medium text-dark fs-14">MRD</label>
                        <div className="fw-bold text-dark">{ipd.patient.mrd}</div>
                      </div>
                    </div>
                  )}
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14">Appointment Date</label>
                      <div className="fw-bold text-dark">
                        {ipd.appointmentDate
                          ? dayjs(ipd.appointmentDate).format("DD MMM YYYY")
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14 d-block">MLC</label>
                      <div className="form-check form-switch mb-0 pt-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="ipd-mlc-toggle"
                          checked={mlc}
                          disabled={mlcSaving}
                          onChange={(e) => void handleMlcToggle(e.target.checked)}
                          aria-label="Medico-legal case (MLC)"
                        />
                        <label className="form-check-label fw-medium text-dark" htmlFor="ipd-mlc-toggle">
                          {mlcSaving ? "Saving…" : mlc ? "Yes" : "No"}
                        </label>
                      </div>
                    </div>
                  </div>
                  
                </div>

                <div className="mb-3">
                  <label htmlFor="ipd-notes" className="form-label mb-1 fw-medium text-dark fs-14">
                    Notes
                  </label>
                  <textarea
                    id="ipd-notes"
                    className="form-control"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={() => void handleSaveNotes()}
                    placeholder="Add notes for this IPD admission…"
                    disabled={notesSaving}
                  />
                  <div className="d-flex align-items-center justify-content-end mt-2 gap-2 flex-wrap">
                    {notesSaving ? (
                      <span className="text-muted fs-13">Saving notes…</span>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => void handleSaveNotes()}
                      disabled={notesSaving}
                    >
                      Save Notes
                    </button>
                  </div>
                </div>

                <div className="row g-2 mb-1">
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

                <div className="row g-2 mb-1">
                 
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14 d-block">
                        Doctor Visit Charges
                      </label>
                      <div className="fw-bold text-dark">
                        ₹{doctorChargesPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-medium text-dark fs-14 d-block">
                        Total Amount
                      </label>
                      <div className="fw-bold text-dark">
                        ₹{baseTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {doctor && (
                  <>
                    <h6 className="fw-bold text-primary ">Doctor Details</h6>
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

                {ipd.procedures && ipd.procedures.length > 0 && (
                  <div className="mt-3">
                    <h6 className="fw-bold text-primary mb-2">Procedures</h6>
                    <div className="table-responsive">
                      <table className="table table-sm mb-0 text-dark">
                        <thead>
                          <tr>
                            <th style={{ width: "60px" }} className="text-dark">
                              S.No
                            </th>
                            <th className="text-dark">Procedure</th>
                            <th className="text-end text-dark">Price</th>
                            <th className="text-end text-dark" style={{ width: "140px" }}>
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ipd.procedures.map((proc, index) => (
                            <tr key={proc.procedureId || `${proc.procedureName}-${index}`}>
                              <td className="text-dark">{index + 1}</td>
                              <td className="text-dark">{proc.procedureName || "N/A"}</td>
                              <td className="text-end text-dark">
                                ₹{(proc.price ?? 0).toFixed(2)}
                              </td>
                              <td className="text-end">
                                {proc.isDialysis ? (
                                  proc.dialysisSessionId ? (
                                    <Link
                                      href={`${all_routes.dialysisAppointment}?patientId=${ipd.patientId || ""}&sessionId=${proc.dialysisSessionId}`}
                                      className="btn btn-sm btn-outline-primary"
                                    >
                                      Dialysis
                                    </Link>
                                  ) : (
                                    <Link
                                      href={`${all_routes.dialysisAppointment}?patientId=${ipd.patientId || ""}`}
                                      className="btn btn-sm btn-outline-primary"
                                    >
                                      Dialysis
                                    </Link>
                                  )
                                ) : (
                                  <span className="text-muted fs-13">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
                              <select
                                className="form-select form-select-sm"
                                style={{ minWidth: "6.5rem", maxWidth: "10rem" }}
                                value={
                                  TRANSACTION_PAYMENT_MODES.includes(
                                    txn.paymentMode as (typeof TRANSACTION_PAYMENT_MODES)[number]
                                  )
                                    ? txn.paymentMode
                                    : txn.paymentMode || "Cash"
                                }
                                disabled={transactionModeUpdatingId === txn._id}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === txn.paymentMode) return;
                                  void handleTransactionPaymentModeChange(txn._id, v);
                                }}
                                aria-label="Payment mode"
                              >
                                {txn.paymentMode &&
                                !TRANSACTION_PAYMENT_MODES.includes(
                                  txn.paymentMode as (typeof TRANSACTION_PAYMENT_MODES)[number]
                                ) ? (
                                  <option value={txn.paymentMode}>{txn.paymentMode}</option>
                                ) : null}
                                {TRANSACTION_PAYMENT_MODES.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
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
      {/* Print Receipt */}
      {showPrintReceipt && ipd && (
        <PrintReceipt
          receiptData={buildIPDReceiptData(ipd, dueAmount)}
          onClose={() => setShowPrintReceipt(false)}
        />
      )}

      {/* Add Transaction Modal */}
      {showAddTransaction && ipd && (
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

export default IpdAppointmentDetailsComponent;

