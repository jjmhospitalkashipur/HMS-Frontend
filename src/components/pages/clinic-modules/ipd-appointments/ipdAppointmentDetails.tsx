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
import {
  extractIpdFromGetResponse,
  mapIpdApiToAppointmentDetail,
  type IIpdApiRecord,
} from "@/components/pages/clinic-modules/ipd-appointments/ipdApiHelpers";

const TRANSACTION_PAYMENT_MODES = ["Cash", "UPI", "Card"] as const;

const DETAIL_LABEL_CLASS = "form-label mb-1 fw-medium text-dark fs-14";
const DETAIL_VALUE_CLASS = "fw-bold text-dark";
const PAYMENT_VALUE_CLASS = "text-dark";
const DETAIL_TABLE_HEAD_CLASS = "table-light";

const formatPatientAgeForDisplay = (
  years?: number | null,
  months?: number | null,
  days?: number | null
): string | undefined => {
  if (years != null && Number.isFinite(Number(years))) {
    const y = Number(years);
    if (y === 0) {
      const m = months != null ? Number(months) : 0;
      if (m > 0) return `${m} ${m === 1 ? "Month" : "Months"}`;
      if (days != null) return `${days} ${Number(days) === 1 ? "Day" : "Days"}`;
      return undefined;
    }
    return `${y} ${y === 1 ? "Year" : "Years"}`;
  }
  return undefined;
};

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

  useEffect(() => {
    if (id) {
      void fetchIPDDetails();
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
      const res = await axios.get(`${API_BASE_URL}/hospital/ipd/${id}`);
      const ok = res.data?.code === 200 || (res.status >= 200 && res.status < 300);
      const raw = extractIpdFromGetResponse(res.data?.data) as IIpdApiRecord | null;
      if (!ok || !raw?._id) {
        setError(res.data?.message ?? "IPD admission not found");
        return;
      }

      const responseReceiptId = res.data?.data?.receiptId as string | undefined;
      let next = mapIpdApiToAppointmentDetail(raw, responseReceiptId);

      if (!next.patient && next.patientId) {
        try {
          const pRes = await axios.get(`${API_BASE_URL}/hospital/patients/${next.patientId}`);
          const pData = pRes.data?.data?.patient ?? pRes.data?.data;
          if (pData && typeof pData === "object") {
            next = { ...next, patient: { ...(pData as IIpdAppointmentDetail["patient"]), _id: next.patientId } };
          }
        } catch {
          /* optional patient fetch */
        }
      }

      next = await enrichIPDDoctorForReceipt(next);
      setIpd(next);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to load IPD admission";
      setError(message);
    } finally {
      setLoading(false);
    }
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
            <strong>Error:</strong> {error || "IPD admission not found"}
          </div>
          <Link href={all_routes.ipdAppointments} className="btn btn-primary">
            Back to IPD Appointments
          </Link>
        </div>
      </div>
    );
  }

  const doctor = ipd.doctor;
  const patient = ipd.patient;
  const transactions = ipd.transactions || [];
  const baseTotal = ipd.totalPrice ?? ipd.subtotal ?? 0;
  const totalPaidFromTx = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPaid = ipd.amountPaid != null ? ipd.amountPaid : totalPaidFromTx;
  const dueAmount = Math.max(0, baseTotal - totalPaid);
  const proceduresPrice = ipd.procedureChargesTotal ?? 0;
  const doctorChargesPrice = ipd.doctorChargesAmount ?? 0;
  const bedChargesPrice = ipd.bedChargesTotal ?? 0;
  const admissionDateLabel = ipd.admissionDate ?? ipd.appointmentDate;
  const patientAgeUi = formatPatientAgeForDisplay(
    patient?.age,
    patient?.months,
    patient?.days
  );
  const bedNumber = ipd.bed?.bedNumber ?? ipd.bed?.bedCode;
  const wardName = ipd.bed?.ward?.name;
  const bedRate =
    ipd.bed?.ward?.chargePerDay != null && Number.isFinite(Number(ipd.bed.ward.chargePerDay))
      ? `₹${Number(ipd.bed.ward.chargePerDay).toLocaleString("en-IN")}/day`
      : null;
  const isMlc = Boolean(ipd.mlc ?? ipd.isMlc);
  const reasonLabel = (ipd.reason ?? ipd.notes ?? "").trim() || "—";

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
    } catch (err: unknown) {
      console.error("Error adding ipd transaction:", err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to add transaction. Please try again.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddTransaction(false);
    setAmount("0");
    setPaymentMode("Cash");
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
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to update payment mode.";
      alert(message);
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

          <div className="d-flex flex-wrap align-items-center gap-2">
            <Link
              href={`${all_routes.editIpdAppointment}/${ipd._id}`}
              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
            >
              <i className="ti ti-edit me-1" />
              Edit
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm d-inline-flex align-items-center"
              onClick={() => setShowPrintReceipt(true)}
            >
              <i className="ti ti-receipt me-1" />
              Print Receipt
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-7 pe-lg-3">
            <div className="card mb-3">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h6 className="fw-bold text-primary mb-0">IPD Information</h6>
                  <div className="d-flex align-items-center flex-wrap gap-2">
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
                      {ipd.status || "Admitted"}
                    </span>
                    {isMlc ? (
                      <span className="badge badge-soft-warning border border-warning fs-12 px-2 py-1">
                        MLC
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                  <h6 className="fw-bold text-primary mb-0">Patient Details</h6>
                  <Link
                    href={`${all_routes.patientDetails}?id=${patient?._id ?? ipd.patientId ?? ""}`}
                    className={`btn btn-sm d-inline-flex align-items-center ${
                      patient?._id || ipd.patientId ? "btn-primary" : "btn-light disabled"
                    }`}
                    aria-disabled={!(patient?._id || ipd.patientId)}
                  >
                    <i className="ti ti-user-circle me-1" />
                    Open Profile
                  </Link>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-3 col-sm-6">
                    <label className={DETAIL_LABEL_CLASS}>Patient Name</label>
                    <div className={DETAIL_VALUE_CLASS}>
                      {patient?.title ? `${patient.title} ` : ""}
                      {patient?.name || "N/A"}
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <label className={DETAIL_LABEL_CLASS}>Age / Gender</label>
                    <div className={DETAIL_VALUE_CLASS}>
                      {patientAgeUi || "N/A"} / {patient?.gender || "N/A"}
                    </div>
                  </div>
                  {patient?.mrd ? (
                    <div className="col-md-3 col-sm-6">
                      <label className={DETAIL_LABEL_CLASS}>MRD</label>
                      <div className={DETAIL_VALUE_CLASS}>{patient.mrd}</div>
                    </div>
                  ) : null}
                  <div className="col-md-3 col-sm-6">
                    <label className={DETAIL_LABEL_CLASS}>Phone</label>
                    <div className={DETAIL_VALUE_CLASS}>{patient?.phone || "N/A"}</div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <label className={DETAIL_LABEL_CLASS}>IPD ID</label>
                    <div className={DETAIL_VALUE_CLASS}>{ipd.ipdId || "—"}</div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <label className={DETAIL_LABEL_CLASS}>Admission Date</label>
                    <div className={DETAIL_VALUE_CLASS}>
                      {admissionDateLabel
                        ? dayjs(admissionDateLabel).format("DD MMM YYYY")
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {(bedNumber || wardName || bedRate) ? (
                  <div className="row g-2 mb-3">
                    <div className="col-md-4 col-sm-6">
                      <label className={DETAIL_LABEL_CLASS}>Bed No.</label>
                      <div className={DETAIL_VALUE_CLASS}>{bedNumber || "—"}</div>
                    </div>
                    {wardName ? (
                      <div className="col-md-4 col-sm-6">
                        <label className={DETAIL_LABEL_CLASS}>Ward</label>
                        <div className={DETAIL_VALUE_CLASS}>{wardName}</div>
                      </div>
                    ) : null}
                    {bedRate ? (
                      <div className="col-md-4 col-sm-6">
                        <label className={DETAIL_LABEL_CLASS}>Bed Rate</label>
                        <div className={DETAIL_VALUE_CLASS}>{bedRate}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mb-3">
                  <label className={DETAIL_LABEL_CLASS}>Reason for Admission</label>
                  <div className={DETAIL_VALUE_CLASS}>{reasonLabel}</div>
                </div>

                <div className="row g-2 mb-1">
                  <div className="col-md-4 col-sm-6">
                    <label className={`${DETAIL_LABEL_CLASS} d-block`}>Procedure Charges</label>
                    <div className={DETAIL_VALUE_CLASS}>₹{proceduresPrice.toFixed(2)}</div>
                  </div>
                  {bedChargesPrice > 0 ? (
                    <div className="col-md-4 col-sm-6">
                      <label className={`${DETAIL_LABEL_CLASS} d-block`}>Bed Charges</label>
                      <div className={DETAIL_VALUE_CLASS}>₹{bedChargesPrice.toFixed(2)}</div>
                    </div>
                  ) : null}
                  <div className="col-md-4 col-sm-6">
                    <label className={`${DETAIL_LABEL_CLASS} d-block`}>Doctor Visit Charges</label>
                    <div className={DETAIL_VALUE_CLASS}>₹{doctorChargesPrice.toFixed(2)}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <label className={`${DETAIL_LABEL_CLASS} d-block`}>Total Amount</label>
                    <div className={DETAIL_VALUE_CLASS}>₹{baseTotal.toFixed(2)}</div>
                  </div>
                  {ipd.discount != null && ipd.discount > 0 ? (
                    <div className="col-md-4 col-sm-6">
                      <label className={`${DETAIL_LABEL_CLASS} d-block`}>Discount</label>
                      <div className={DETAIL_VALUE_CLASS}>₹{ipd.discount.toFixed(2)}</div>
                    </div>
                  ) : null}
                  <div className="col-md-4 col-sm-6">
                    <label className={`${DETAIL_LABEL_CLASS} d-block`}>Paid</label>
                    <div className={DETAIL_VALUE_CLASS}>₹{totalPaid.toFixed(2)}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <label className={`${DETAIL_LABEL_CLASS} d-block`}>Due</label>
                    <div className={DETAIL_VALUE_CLASS}>₹{dueAmount.toFixed(2)}</div>
                  </div>
                </div>

                {(doctor || (ipd.doctorVisits && ipd.doctorVisits.length > 0)) ? (
                  <div className="mt-3">
                    <h6 className="fw-bold text-primary mb-2">Doctor Visits</h6>
                    {doctor ? (
                      <div className="row g-2 mb-2">
                        <div className="col-md-4 col-sm-6">
                          <label className={DETAIL_LABEL_CLASS}>Consulting Doctor</label>
                          <div className={DETAIL_VALUE_CLASS}>{doctor.name}</div>
                        </div>
                        {doctor.designation ? (
                          <div className="col-md-4 col-sm-6">
                            <label className={DETAIL_LABEL_CLASS}>Designation</label>
                            <div className={DETAIL_VALUE_CLASS}>{doctor.designation}</div>
                          </div>
                        ) : null}
                        {doctor.department ? (
                          <div className="col-md-4 col-sm-6">
                            <label className={DETAIL_LABEL_CLASS}>Department</label>
                            <div className={DETAIL_VALUE_CLASS}>{doctor.department}</div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {ipd.doctorVisits && ipd.doctorVisits.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm mb-0">
                          <thead className={DETAIL_TABLE_HEAD_CLASS}>
                            <tr>
                              <th style={{ width: "60px" }} className={`${DETAIL_LABEL_CLASS} border-0`}>
                                S.No
                              </th>
                              <th className={`${DETAIL_LABEL_CLASS} border-0`}>Doctor</th>
                              <th
                                className={`${DETAIL_LABEL_CLASS} border-0 text-center`}
                                style={{ width: "80px" }}
                              >
                                Days
                              </th>
                              <th className={`${DETAIL_LABEL_CLASS} border-0 text-end`}>Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ipd.doctorVisits.map((visit, index) => (
                              <tr key={visit.doctorId || `${visit.doctorName}-${index}`}>
                                <td className={DETAIL_VALUE_CLASS}>{index + 1}</td>
                                <td className={DETAIL_VALUE_CLASS}>{visit.doctorName || "N/A"}</td>
                                <td className={`text-center ${DETAIL_VALUE_CLASS}`}>{visit.days}</td>
                                <td className={`text-end ${DETAIL_VALUE_CLASS}`}>
                                  ₹{(visit.price ?? 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className={`mb-0 ${DETAIL_VALUE_CLASS}`}>No doctor visit charges recorded.</p>
                    )}
                  </div>
                ) : null}

                {ipd.procedures && ipd.procedures.length > 0 ? (
                  <div className="mt-3">
                    <h6 className="fw-bold text-primary mb-2">Procedures</h6>
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
                        <thead className={DETAIL_TABLE_HEAD_CLASS}>
                          <tr>
                            <th style={{ width: "60px" }} className={`${DETAIL_LABEL_CLASS} border-0`}>
                              S.No
                            </th>
                            <th className={`${DETAIL_LABEL_CLASS} border-0`}>Procedure</th>
                            <th className={`${DETAIL_LABEL_CLASS} border-0 text-center`} style={{ width: "80px" }}>
                              Units
                            </th>
                            <th className={`${DETAIL_LABEL_CLASS} border-0 text-end`}>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ipd.procedures.map((proc, index) => (
                            <tr key={proc.procedureId || `${proc.procedureName}-${index}`}>
                              <td className={DETAIL_VALUE_CLASS}>{index + 1}</td>
                              <td className={DETAIL_VALUE_CLASS}>{proc.procedureName || "N/A"}</td>
                              <td className={`text-center ${DETAIL_VALUE_CLASS}`}>
                                {proc.units ?? 1}
                              </td>
                              <td className={`text-end ${DETAIL_VALUE_CLASS}`}>
                                ₹{(proc.price ?? 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="col-lg-5 ps-lg-3">
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
                      <thead className={DETAIL_TABLE_HEAD_CLASS}>
                        <tr>
                          <th className="border-0 fs-13 fw-medium text-dark">ID</th>
                          <th className="border-0 fs-13 fw-medium text-dark">Date - Time</th>
                          <th className="border-0 fs-13 fw-medium text-dark">Amount</th>
                          <th className="border-0 fs-13 fw-medium text-dark">Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn) => (
                          <tr key={txn._id}>
                            <td className={`fs-15 ${PAYMENT_VALUE_CLASS} fw-medium`}>{txn.transactionId}</td>
                            <td className={`fs-15 ${PAYMENT_VALUE_CLASS}`}>
                              {dayjs(txn.transactionDate).format("DD MMM YYYY")}
                              <br />
                              <small className={PAYMENT_VALUE_CLASS}>
                                {dayjs(txn.createdAt).format("HH:mm")}
                              </small>
                            </td>
                            <td className={`fs-15 ${PAYMENT_VALUE_CLASS} fw-medium`}>
                              <i className="ti ti-check fs-14 me-1 text-success" />
                              ₹{txn.amount?.toFixed(2) || "0.00"}
                            </td>
                            <td className={`fs-15 ${PAYMENT_VALUE_CLASS}`}>
                              <select
                                className="form-select form-select-sm text-dark"
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

      {showPrintReceipt && ipd ? (
        <PrintReceipt
          receiptData={buildIPDReceiptData(ipd, dueAmount)}
          onClose={() => setShowPrintReceipt(false)}
        />
      ) : null}

      {showAddTransaction && ipd ? (
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
                  <h5 className="modal-title fw-bold text-dark">Add Transaction</h5>
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
      ) : null}
    </div>
  );
};

export default IpdAppointmentDetailsComponent;
