"use client";

import { useEffect, useRef } from "react";
import dayjs from "dayjs";

export interface IReceiptTransaction {
  _id: string;
  transactionId: string;
  transactionType?: string;
  amount: number;
  paymentMode: string;
  referenceNo?: string;
  transactionDate: string;
  createdAt?: string;
}

export interface IReceiptData {
  visitId?: string;
  appointmentId?: string;
  visitDate?: string;
  visitTime?: string;
  tokenNumber?: number;
  visitType?: string;
  appointmentType?: string;
  status?: string;
  patientName?: string;
  patientTitle?: string;
  mrd?: string;
  age?: string | number;
  gender?: string;
  phone?: string;
  doctorName?: string;
  doctorDesignation?: string;
  transactions?: IReceiptTransaction[];
}

interface IPrintReceiptProps {
  receiptData: IReceiptData;
  onClose?: () => void;
}

const PrintReceipt = ({ receiptData, onClose }: IPrintReceiptProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const doPrint = () => {
      if (!printRef.current) return;
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${receiptData.visitId || "Visit"}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                margin: 0;
                padding: 20px;
                font-family: Tahoma, Arial, sans-serif;
                font-size: 14px;
                color: #000;
                background: #fff;
                line-height: 1.4;
              }
              .receipt-container { width: 100%; max-width: 900px; margin: 0 auto; padding: 0; background: #fff; }
              .letterhead-space { height: 60px; width: 100%; margin-bottom: 20px; }
             
              .patient-card { border-radius: 12px; padding: 8px; margin-bottom: 24px; }
              .patient-info-table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.4; margin: 0; }
              .patient-info-table td { padding: 6px 8px; border: 1px solid #000; vertical-align: middle; font-size: 13px; }
              .info-label-cell { background-color: #f8f9fa; font-weight: 600; color: #495057; width: 20%; text-align: left; white-space: nowrap; }
              .info-value-cell { background-color: #fff; font-weight: 500; color: #212529; width: 30%; text-align: left; }
              .info-value-cell-full { background-color: #fff; font-weight: 500; color: #212529; text-align: left; }
              .payment-section-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
              .payment-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
              .payment-table th, .payment-table td { padding: 8px 10px; border: none; border-bottom: 1px solid #dee2e6; text-align: left; vertical-align: middle; }
              .payment-table th { background: transparent; font-weight: 600; color: #495057; }
              .payment-table tbody tr:nth-child(even) { background-color: #fafafa; }
              .payment-no-data { text-align: center; padding: 24px; color: #6c757d; font-size: 14px; border: none; border-bottom: 1px solid #dee2e6; }
              @media print {
                @page { margin: 12mm; size: A4; }
                body { padding: 0; background: white !important; }
                .patient-info-table td { border: 1px solid #000 !important; }
                .payment-table th, .payment-table td { border: none !important; border-bottom: 1px solid #000 !important; }
                .patient-info-table, .payment-table { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        onClose?.();
      }, 250);
    };
    doPrint();
  }, [receiptData, onClose]);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—";
    const parts = timeStr.split(":");
    const h = parseInt(parts[0], 10);
    const m = parts[1] || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const patientName = [receiptData.patientTitle, receiptData.patientName].filter(Boolean).join(" ").trim() || "—";
  const ageGender = receiptData.age != null || receiptData.gender
    ? `${receiptData.age ?? "—"} Yrs / ${receiptData.gender ?? "—"}`
    : "—";
  const doctorDisplay = receiptData.doctorName
    ? `Dr. ${receiptData.doctorName.replace(/^Dr\.\s*/i, "")}${receiptData.doctorDesignation ? ` (${receiptData.doctorDesignation})` : ""}`
    : "—";
  const dateTime = receiptData.visitDate && receiptData.visitTime
    ? `${dayjs(receiptData.visitDate).format("DD MMM YYYY")} - ${formatTime(receiptData.visitTime)}`
    : receiptData.visitDate
      ? dayjs(receiptData.visitDate).format("DD MMM YYYY")
      : "—";
  const transactions = receiptData.transactions ?? [];

  return (
    <div style={{ display: "none" }}>
      <div ref={printRef} className="receipt-container">
        <div className="letterhead-space" />


        <div className="patient-card">
          <table className="patient-info-table">
            <tbody>
              <tr>
                <td className="info-label-cell">Token No.:</td>
                <td className="info-value-cell">{receiptData.tokenNumber ?? "—"}</td>
                <td className="info-label-cell">Date / Time:</td>
                <td className="info-value-cell">{dateTime}</td>
              </tr>
              <tr>
                <td className="info-label-cell">Patient Name:</td>
                <td className="info-value-cell">{patientName}</td>
                <td className="info-label-cell">Visit ID:</td>
                <td className="info-value-cell">{receiptData.visitId ?? "—"}</td>
              </tr>
              <tr>
                <td className="info-label-cell">Age / Gender:</td>
                <td className="info-value-cell">{ageGender}</td>
                <td className="info-label-cell">Phone No.:</td>
                <td className="info-value-cell">{receiptData.phone ?? "—"}</td>
              </tr>
              <tr>
                <td className="info-label-cell">MRD No.:</td>
                <td className="info-value-cell">{receiptData.mrd ?? "—"}</td>
                <td className="info-label-cell">Case ID:</td>
                <td className="info-value-cell">{receiptData.appointmentId ?? "—"}</td>
              </tr>
              <tr>
                <td className="info-label-cell">Visit Type:</td>
                <td className="info-value-cell">{receiptData.visitType ?? "—"}</td>
                <td className="info-label-cell">Status:</td>
                <td className="info-value-cell">{receiptData.status ?? "—"}</td>
              </tr>
              <tr>
                <td className="info-label-cell">Ref. Consultant:</td>
                <td className="info-value-cell-full" colSpan={3}>{doctorDisplay}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="payment-section-title">Payment History</div>
        {transactions.length === 0 ? (
          <div className="payment-no-data">No payment transactions found</div>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Mode</th>
              
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn._id}>
                  <td>{txn.transactionId ?? "—"}</td>
                  <td>{txn.transactionDate ? dayjs(txn.transactionDate).format("DD MMM YYYY HH:mm") : "—"}</td>
                  <td>{txn.transactionType ?? "—"}</td>
                  <td>₹{typeof txn.amount === "number" ? txn.amount.toFixed(2) : "0.00"}</td>
                  <td>{txn.paymentMode ?? "—"}</td>
                 
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PrintReceipt;
