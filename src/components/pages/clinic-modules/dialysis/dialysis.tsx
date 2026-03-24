"use client";

import { useEffect, useState } from "react";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import Datatable from "@/core/common/dataTable";
import Link from "next/link";
import axios from "axios";
import dayjs from "dayjs";
import { API_BASE_URL } from "@/environment";

interface IDialysisSessionRow {
  _id: string;
  sessionId: string;
  status?: string;
  createdAt?: string;
  patient?: { name?: string; age?: number; gender?: string; phone?: string };
}

const DialysisComponent = () => {
  const [activeTab, setActiveTab] = useState<"all" | "today">("today");
  const [dialysisSessions, setDialysisSessions] = useState<IDialysisSessionRow[]>([]);
  const [dialysisLoading, setDialysisLoading] = useState(false);
  const [dialysisPage, setDialysisPage] = useState(1);
  const [dialysisSearchInput, setDialysisSearchInput] = useState("");
  const [dialysisSearch, setDialysisSearch] = useState("");
  const [dialysisStatusFilter, setDialysisStatusFilter] = useState<string>("");
  const [dialysisStatusUpdatingId, setDialysisStatusUpdatingId] = useState<string | null>(null);
  const dialysisLimit = 100;

  useEffect(() => {
    const t = setTimeout(() => setDialysisSearch(dialysisSearchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [dialysisSearchInput]);

  useEffect(() => {
    setDialysisPage(1);
  }, [dialysisSearch, dialysisStatusFilter]);

  useEffect(() => {
    const fetchDialysis = async () => {
      if (!API_BASE_URL) return;
      try {
        setDialysisLoading(true);
        const params: Record<string, string | number> = {
          page: dialysisPage,
          limit: dialysisLimit,
        };
        if (activeTab === "today") {
          params.date = dayjs().format("YYYY-MM-DD");
        }
        if (dialysisSearch) params.search = dialysisSearch;
        if (dialysisStatusFilter) params.status = dialysisStatusFilter;

        const res = await axios.get(`${API_BASE_URL}/hospital/dialysis-sessions`, { params });
        if (res.data?.code === 200 && Array.isArray(res.data?.data?.sessions)) {
          setDialysisSessions(res.data.data.sessions as IDialysisSessionRow[]);
          return;
        }
        setDialysisSessions([]);
      } catch {
        setDialysisSessions([]);
      } finally {
        setDialysisLoading(false);
      }
    };
    fetchDialysis();
  }, [activeTab, dialysisPage, dialysisSearch, dialysisStatusFilter]);

  const handleTabChange = (tab: "all" | "today") => {
    setActiveTab(tab);
    setDialysisPage(1);
  };

  const handleDialysisStatusChange = async (sessionId: string, newStatus: string) => {
    if (!API_BASE_URL) return;
    try {
      setDialysisStatusUpdatingId(sessionId);
      await axios.put(`${API_BASE_URL}/hospital/dialysis-session/${sessionId}`, {
        status: newStatus,
      });
      setDialysisSessions((prev) =>
        prev.map((session) =>
          session._id === sessionId ? { ...session, status: newStatus } : session
        )
      );
    } catch {
      // Keep previous status if update fails
    } finally {
      setDialysisStatusUpdatingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
          <div className="flex-grow-1">
            <h4 className="fw-bold mb-0">Dialysis</h4>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <ul className="nav nav-tabs border-0 mb-0 flex-shrink-0">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link${activeTab === "all" ? " active" : ""}`}
                onClick={() => handleTabChange("all")}
              >
                All Dialysis
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link${activeTab === "today" ? " active" : ""}`}
                onClick={() => handleTabChange("today")}
              >
                Today&apos;s Dialysis
              </button>
            </li>
          </ul>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <div className="table-search d-flex align-items-center mb-0">
              <div className="search-input">
                <SearchInput
                  value={dialysisSearchInput}
                  onChange={(value) => setDialysisSearchInput(value)}
                />
              </div>
            </div>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", minWidth: "10rem" }}
              value={dialysisStatusFilter}
              onChange={(e) => setDialysisStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          {dialysisLoading ? (
            <p className="text-muted mb-0">Loading dialysis sessions...</p>
          ) : dialysisSessions.length === 0 ? (
            <p className="text-muted mb-0">No dialysis sessions found.</p>
          ) : (
            <Datatable
              columns={[
                {
                  title: "Session ID",
                  dataIndex: "sessionId",
                  sorter: false,
                  showSorterTooltip: false,
                },
                {
                  title: "Patient",
                  dataIndex: "patientName",
                  sorter: false,
                  showSorterTooltip: false,
                  render: (_: unknown, record: any) => (
                    <div className="text-dark">
                      <div className="fw-semibold fs-14 text-truncate">{record.patientName}</div>
                      {record.meta ? (
                        <div className="fs-13 text-muted text-truncate">{record.meta}</div>
                      ) : null}
                    </div>
                  ),
                },
                {
                  title: "Phone",
                  dataIndex: "phone",
                  sorter: false,
                  showSorterTooltip: false,
                },
                {
                  title: "Date",
                  dataIndex: "date",
                  sorter: false,
                  showSorterTooltip: false,
                  render: (_: unknown, record: any) => (
                    <div className="text-dark">
                      <div>{record.date}</div>
                      {record.time ? <div className="fs-13 text-muted">{record.time}</div> : null}
                    </div>
                  ),
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  sorter: false,
                  showSorterTooltip: false,
                  render: (_: unknown, record: any) => (
                    <select
                      className={`form-select form-select-sm ${
                        record.status === "Completed" ? "text-success" : "text-warning"
                      }`}
                      style={{ width: "auto", minWidth: "7rem" }}
                      value={record.status || "In Progress"}
                      disabled={dialysisStatusUpdatingId === record.key}
                      onChange={(e) => handleDialysisStatusChange(record.key, e.target.value)}
                      aria-label="Update status"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  ),
                },
              ]}
              dataSource={dialysisSessions.map((session) => ({
                key: session._id,
                sessionId: session.sessionId ?? "-",
                patientName: session.patient?.name ?? "-",
                meta: [session.patient?.age != null ? `${session.patient.age}` : "", session.patient?.gender || ""]
                  .filter(Boolean)
                  .join(", "),
                phone: session.patient?.phone ?? "-",
                date: session.createdAt ? dayjs(session.createdAt).format("DD MMM YYYY") : "-",
                time: session.createdAt ? dayjs(session.createdAt).format("hh:mm A") : "",
                status: session.status ?? "-",
              }))}
              Selection={false}
              searchText={dialysisSearch}
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
  );
};

export default DialysisComponent;
