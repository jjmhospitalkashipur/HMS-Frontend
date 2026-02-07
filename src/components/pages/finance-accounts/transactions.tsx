"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FilterIndex from "@/core/common/filter/filterIndex";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import Datatable from "@/core/common/dataTable";
import axios from "axios";
import { API_BASE_URL } from "@/environment";

interface ITransaction {
  _id: string;
  transactionId: string;
  visitId: string;
  transactionType: string;
  amount: number;
  paymentMode: string;
  referenceNo: string;
  transactionDate: string;
  createdAt?: string;
  visitReadableId?: string;
  visitType?: string;
  appointmentType?: string;
  doctorName?: string;
  patientName?: string;
  patientPhone?: string;
}

interface ITableRow {
  id: string;
  TransactionID: string;
  VisitID: string;
  PatientName: string;
  PatientPhone: string;
  Date: string;
  Time: string;
  VisitType: string;
  AppointmentType: string;
  Doctor: string;
  PaymentMode: string;
  Amount: string;
}

const TransactionsListComponent = () => {
  const [data, setData] = useState<ITableRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");
      if (!API_BASE_URL) {
        setError("API configuration error");
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/hospital/transactions`, {
        params: { limit: 100 },
      });
      if (response.data?.code === 200 && response.data?.data?.transactions) {
        const transactions: ITransaction[] = response.data.data.transactions;
        setTotalCount(response.data.data.count ?? transactions.length);
        const formatTime = (iso: string | undefined) => {
          if (!iso) return "";
          try {
            const d = new Date(iso);
            return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
          } catch {
            return "";
          }
        };
        const rows: ITableRow[] = transactions.map((t) => ({
          id: t._id,
          TransactionID: t.transactionId ?? "",
          VisitID: t.visitReadableId ? t.visitReadableId : "—",
          PatientName: t.patientName ?? "—",
          PatientPhone: t.patientPhone ?? "—",
          Date: t.transactionDate ?? "",
          Time: formatTime(t.createdAt),
          VisitType: t.visitType ?? "—",
          AppointmentType: t.appointmentType ?? "—",
          Doctor: t.doctorName ?? "—",
          PaymentMode: t.paymentMode ?? "",
          Amount: t.amount != null ? `₹${Number(t.amount).toLocaleString()}` : "—",
        }));
        setData(rows);
      } else {
        setError("Failed to load transactions");
      }
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError(err.response?.data?.message || "Failed to load transactions");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "TransactionID",
      render: (text: string) => (
        <span className="text-dark fw-semibold">{text}</span>
      ),
    },
    {
      title: "Case ID",
      dataIndex: "VisitID",
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Patient",
      dataIndex: "PatientName",
      render: (_: string, record: any) => (
        <div>
          <div className="text-dark fw-medium">{record.PatientName}</div>
          <div className="text-dark fs-13">{record.PatientPhone}</div>
        </div>
      ),
    },
    {
      title: "Visit Type",
      dataIndex: "VisitType",
      render: (_: string, record: any) => (
        <div>
          <div className="text-dark">{record.VisitType}</div>
          <div className="text-dark fs-13">{record.AppointmentType}</div>
        </div>
      ),
    },
    {
      title: "Doctor",
      dataIndex: "Doctor",
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Payment Mode",
      dataIndex: "PaymentMode",
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      render: (text: string) => <span className="text-dark fw-medium">{text}</span>,
    },
    {
      title: "Date",
      dataIndex: "Date",
      render: (text: string, record: any) => (
        <div>
          <div className="text-dark">{text}</div>
          {record.Time && <div className="text-dark fs-13">{record.Time}</div>}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Transactions{" "}
                <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                  Total Transactions : {totalCount}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <div className="dropdown me-1">
                <Link
                  href="#"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Export
                  <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2">
                  <li>
                    <Link className="dropdown-item" href="#">
                      Download as PDF
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      Download as Excel
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="d-flex align-items-center gap-2">
              <div className="search-set mb-3">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="table-search d-flex align-items-center mb-0">
                    <div className="search-input">
                      <SearchInput value={searchText} onChange={handleSearch} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
                <Link
                  href="#"
                  className="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <i className="ti ti-filter text-gray-5 me-1" />
                  Filters
                </Link>
                <div
                  className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0"
                  id="filter-dropdown"
                >
                  <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                    <h4 className="mb-0 fw-bold">Filter</h4>
                    <div className="d-flex align-items-center">
                      <Link
                        href="#"
                        className="link-danger text-decoration-underline"
                      >
                        Clear All
                      </Link>
                    </div>
                  </div>
                  <FilterIndex />
                </div>
              </div>
              <div className="dropdown">
                <Link
                  href="#"
                  className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14"
                  data-bs-toggle="dropdown"
                >
                  <span className="me-1"> Sort By : </span> Recent
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Recent
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Oldest
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          <div className="table-responsive">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={false}
                searchText={searchText}
              />
            )}
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©{" "}
            <Link href="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default TransactionsListComponent;
