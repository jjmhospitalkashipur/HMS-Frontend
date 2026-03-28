"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Datatable from "@/core/common/dataTable";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import { all_routes } from "@/routes/all_routes";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";
import { formatAgeForListing } from "@/core/common/formatAgeForListing";

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

interface IDaycarePatient {
  _id: string;
  name?: string;
  age?: number;
  months?: number;
  days?: number;
  gender?: string;
}

interface IDaycareAppointment {
  _id: string;
  daycareId: string;
  patientId: string;
  doctorId: string;
  daycareChargesType?: string;
  daycareChargesTotal?: number;
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
  paymentStatus?: string;
  amountPaid?: number;
  doctor?: IDaycareDoctor;
  patient?: IDaycarePatient;
}

interface IRow {
  id: string;
  _doctorId?: string;
  Daycare_ID: string;
  Date: string;
  Time?: string;
  Patient: string;
  Age?: string;
  Gender?: string;
  Doctor: string;
  DoctorDesignation?: string;
  Department: string;
  DepartmentName?: string;
  Procedures: string[];
  Total: number;
  Status: string;
  Payment_Status: string;
}

const DaycareAppointmentsComponent = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "today">("today");
  const [rows, setRows] = useState<IRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDaycareAppointments = useCallback(async () => {
      if (!API_BASE_URL) return;
      try {
        setLoading(true);
        setError("");
        const params: Record<string, string | number> = {
          page,
          limit,
        };
        if (activeTab === "today") {
          params.date = dayjs().format("YYYY-MM-DD");
        }
        const trimmedSearch = searchText.trim();
        if (trimmedSearch) {
          params.search = trimmedSearch;
        }
        const res = await axios.get(`${API_BASE_URL}/hospital/daycare-appointments`, { params });
        if (res.data?.code === 200 && res.data?.data) {
          const raw = res.data.data as any;
          const list: IDaycareAppointment[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw.appointments)
            ? (raw.appointments as IDaycareAppointment[])
            : [];

          const pagination = raw?.pagination;
          if (pagination && typeof pagination === "object") {
            const total =
              typeof pagination.total === "number"
                ? pagination.total
                : typeof pagination.totalCount === "number"
                  ? pagination.totalCount
                  : list.length;
            setTotalCount(total);
          } else {
            const fallbackTotal = res.data?.data?.total ?? res.data?.data?.count;
            setTotalCount(typeof fallbackTotal === "number" ? fallbackTotal : list.length);
          }

          if (!list.length) {
            setRows([]);
            setError("");
            return;
          }
          const mapped: IRow[] = list.map((item) => {
            const dateStr = item.appointmentDate
              ? dayjs(item.appointmentDate).format("DD MMM YYYY")
              : "";
            const timeStr = item.appointmentDate
              ? dayjs(item.appointmentDate).format("hh:mm A")
              : "";
            const doctorName = item.doctor?.name ?? "";
            const doctorDesignation = item.doctor?.designation ?? "";
            const dept = item.daycareChargesType || item.bedChargesType || "";
            const deptName = item.doctor?.department || "";
            const patientName = item.patient?.name ?? "";
            const age = formatAgeForListing(
              item.patient?.age,
              item.patient?.months,
              item.patient?.days
            );
            const gender = item.patient?.gender;
            const proceduresList =
              item.procedures && item.procedures.length
                ? item.procedures.map((p) => p.procedureName || "").filter(Boolean)
                : [];

            return {
              id: item._id,
              _doctorId: item.doctor?._id || item.doctorId,
              Daycare_ID: item.daycareId,
              Date: dateStr,
              Time: timeStr,
              Patient: patientName,
              Age: age,
              Gender: gender,
              Doctor: doctorName,
              DoctorDesignation: doctorDesignation,
              Department: dept,
              DepartmentName: deptName,
              Procedures: proceduresList,
              Total: item.totalPrice ?? 0,
              Status: item.status || "",
              Payment_Status: item.paymentStatus || "",
            };
          });
          setRows(mapped);
        } else {
          setRows([]);
          setTotalCount(0);
          setError(res.data?.message || "Failed to load daycare appointments.");
        }
      } catch (err: any) {
        setRows([]);
        setTotalCount(0);
        setError(err?.response?.data?.message || "Failed to load daycare appointments.");
      } finally {
        setLoading(false);
      }
  }, [activeTab, page, limit, searchText]);

  useEffect(() => {
    fetchDaycareAppointments();
  }, [fetchDaycareAppointments]);

  const columns = [
    {
      title: "Daycare ID",
      dataIndex: "Daycare_ID",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Date",
      dataIndex: "Date",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string, record: IRow) => (
        <div className="text-dark">
          <div>{text}</div>
          {record.Time && <div className="fs-13 text-muted">{record.Time}</div>}
        </div>
      ),
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string, record: IRow) => {
        const meta = [record.Age != null ? `${record.Age}` : "", record.Gender || ""]
          .filter(Boolean)
          .join(", ");
        return (
          <div className="text-dark">
            <div className="fw-semibold">{text}</div>
            {meta && <div className="fs-13 text-muted">{meta}</div>}
          </div>
        );
      },
    },
    {
      title: "Doctor",
      dataIndex: "Doctor",
      sorter: false,
      showSorterTooltip: false,
      ellipsis: false,
      minWidth: 132,
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          verticalAlign: "top",
        },
      }),
      render: (text: any, record: IRow) => (
        <div style={{ minWidth: 0, maxWidth: "100%", lineHeight: 1.3 }}>
          {record._doctorId ? (
            <Link
              href={`${all_routes.doctordetails}?id=${record._doctorId}`}
              className="fw-semibold text-dark fs-14 d-inline"
              style={{ wordBreak: "break-word" }}
              onClick={(e) => e.stopPropagation()}
            >
              {text || "—"}
            </Link>
          ) : (
            <span className="fw-semibold text-dark fs-14" style={{ wordBreak: "break-word" }}>
              {text || "—"}
            </span>
          )}
          {record.DoctorDesignation ? (
            <p className="mb-0 mt-1 fs-13 text-muted" style={{ wordBreak: "break-word" }}>
              {record.DoctorDesignation}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      title: "Department",
      dataIndex: "Department",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string, record: IRow) => {
        const hasBedType = Boolean(text);
        const hasDeptName = Boolean(record.DepartmentName);
        if (!hasBedType && !hasDeptName) return "-";
        return (
          <div className="text-dark">
           {hasDeptName && (
              <div className="fs-15 mt-1">{record.DepartmentName}</div>
            )}
            {hasBedType && (
              <span className="badge badge-soft-primary border border-primary px-2 py-1 fs-12 me-1">
                {text}
              </span>
            )}
           
          </div>
        );
      },
    },
    {
      title: "Procedures",
      dataIndex: "Procedures",
      sorter: false,
      showSorterTooltip: false,
      render: (_: unknown, record: IRow) => {
        const procedures = record.Procedures ?? [];
        if (!procedures.length) return "-";
        return (
          <div className="d-flex flex-column gap-1 text-dark">
            {procedures.map((name, idx) => (
              <span key={`${name}-${idx}`} className="fs-13">
                {name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: "Total",
      dataIndex: "Total",
      sorter: false,
      showSorterTooltip: false,
      render: (value: number, record: IRow) => {
        const paymentStatus = record.Payment_Status || "Unpaid";
        const isPaid = paymentStatus === "Paid";
        return (
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold text-dark">₹{(value ?? 0).toFixed(2)}</span>
            <span
              className={`d-inline-flex align-items-center justify-content-center rounded-circle ${
                isPaid ? "bg-success" : "bg-warning"
              }`}
              style={{ width: "15px", height: "15px", minWidth: "15px" }}
            >
              <i className="ti ti-check fs-10 text-white" />
            </span>
          </div>
        );
      },
    },
    {
      title: "",
      sorter: false,
      showSorterTooltip: false,
      render: (_: any, record: IRow) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            className="text-primary"
            href={`${all_routes.editDaycareAppointment}/${record.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <i className="ti ti-edit fs-16" />
          </Link>
        </div>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  const handleTabChange = (tab: "all" | "today") => {
    setActiveTab(tab);
    setPage(1);
  };

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
  };

  const handleRowClick = (record: IRow) => {
    if (!record?.id) return;
    router.push(`${all_routes.daycareAppointmentDetails}/${record.id}`);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .datatable .ant-table-tbody > tr > td {
            color: #000 !important;
          }
          .datatable .ant-table-thead > tr > th {
            color: #000 !important;
          }
        `,
        }}
      />
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">Daycare Appointments</h4>
            </div>
            <div className="text-end d-flex">
              <Link
                href={`${all_routes.newAppointment}?tab=daycare`}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" />
                New Appointment
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <ul className="nav nav-tabs border-0 mb-3 flex-shrink-0">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link${activeTab === "all" ? " active" : ""}`}
                  onClick={() => handleTabChange("all")}
                >
                  All Appointments
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link${activeTab === "today" ? " active" : ""}`}
                  onClick={() => handleTabChange("today")}
                >
                  Today&apos;s Appointments
                </button>
              </li>
            </ul>
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

          <div className="table-responsive">
            {loading ? (
              <p className="text-muted mb-0">Loading daycare appointments…</p>
            ) : (
              <Datatable
                columns={columns}
                dataSource={rows}
                Selection={false}
                // Server-side search: Datatable must not client-filter the current page.
                searchText={""}
                onRowClick={handleRowClick}
                total={totalCount}
                currentPage={page}
                pageSize={limit}
                onPaginationChange={handlePaginationChange}
              />
            )}
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
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

export default DaycareAppointmentsComponent;

