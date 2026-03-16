"use client";

import Modals from "./modals/modals";
import { useState, useEffect } from "react";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import Datatable from "@/core/common/dataTable";
import { Department, Service_Name, StatusActive } from "@/core/common/selectOption";
import Slider from "rc-slider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CommonSelect from "@/core/common/common-select/commonSelect";
import { all_routes } from "@/routes/all_routes";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";

interface IProcedureRow {
  _id: string;
  procedureId?: string;
  procedureName?: string;
  category?: string;
  price?: number;
  basePrice?: number;
  status?: string;
  nursingCharges?: number;
  roomCharges?: number;
}

interface IDialysisSessionRow {
  _id: string;
  sessionId: string;
  patientId?: string;
  status?: string;
  createdAt?: string;
  patient?: { name?: string; age?: number; gender?: string; phone?: string };
}

const ProceduresComponent = () => {
  const router = useRouter();
  const [procedures, setProcedures] = useState<IProcedureRow[]>([]);
  const [proceduresLoading, setProceduresLoading] = useState(false);
  const [proceduresTotal, setProceduresTotal] = useState(0);
  const [procedureToDelete, setProcedureToDelete] = useState<{ id: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialysisSessions, setDialysisSessions] = useState<IDialysisSessionRow[]>([]);
  const [dialysisLoading, setDialysisLoading] = useState(false);
  const [dialysisPage, setDialysisPage] = useState(1);
  const [dialysisTotal, setDialysisTotal] = useState(0);
  const [dialysisSearchInput, setDialysisSearchInput] = useState("");
  const [dialysisSearch, setDialysisSearch] = useState("");
  const [dialysisStatusFilter, setDialysisStatusFilter] = useState<string>("");
  const dialysisLimit = 100;
  const columns = [
    {
      title: "Procedure ID",
      dataIndex: "ProcedureId",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Procedure Name",
      dataIndex: "ServiceName",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Department",
      dataIndex: "Department",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Price",
      dataIndex: "Price",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge ${
            text === "Active"
              ? "badge-soft-success border-success"
              : "badge-soft-danger border-danger"
          } border px-2 py-1 fs-13 fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "",
      render: (_: unknown, record: { ProcedureId?: string; key?: string }) => (
        <div className="d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href="#"
            className="btn btn-link p-0 text-primary"
            data-bs-toggle="offcanvas"
            data-bs-target="#edit_procedure"
            data-procedure-id={record.key}
            aria-label="Edit"
          >
            <i className="ti ti-edit fs-16" />
          </Link>
          <button
            type="button"
            className="btn btn-link p-0 text-danger"
            aria-label="Delete"
            onClick={() => setProcedureToDelete(record.key ? { id: record.key } : null)}
            data-bs-toggle="modal"
            data-bs-target="#delete_procedure"
          >
            <i className="ti ti-trash fs-16" />
          </button>
        </div>
      ),
    },
  ];

  const handleProcedureRowClick = (record: { key?: string }) => {
    if (record?.key) router.push(`${all_routes.procedureDetails}?id=${record.key}`);
  };

  const [searchText, setSearchText] = useState<string>("");

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const [sliderValueDefault, setSliderValueDefault] = useState(0);
  const handleChangeDefault = (value: any) => {
    setSliderValueDefault(value);
  };

  // Debounce dialysis search (server-side)
  useEffect(() => {
    const t = setTimeout(() => setDialysisSearch(dialysisSearchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [dialysisSearchInput]);

  // Reset to page 1 when search or filter changes
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
        if (dialysisSearch) params.search = dialysisSearch;
        if (dialysisStatusFilter) params.status = dialysisStatusFilter;
        const res = await axios.get(`${API_BASE_URL}/hospital/dialysis-sessions`, {
          params,
        });
        if (res.data?.code === 200 && Array.isArray(res.data?.data?.sessions)) {
          setDialysisSessions(res.data.data.sessions as IDialysisSessionRow[]);
          const pagination = res.data.data?.pagination;
          if (pagination?.totalCount != null) setDialysisTotal(pagination.totalCount);
        } else {
          setDialysisSessions([]);
        }
      } catch {
        setDialysisSessions([]);
      } finally {
        setDialysisLoading(false);
      }
    };
    fetchDialysis();
  }, [dialysisPage, dialysisSearch, dialysisStatusFilter]);

  const fetchProcedures = async () => {
    if (!API_BASE_URL) return;
    try {
      setProceduresLoading(true);
      const res = await axios.get(`${API_BASE_URL}/hospital/procedures`, {
        params: { limit: 20 },
      });
      if (res.data?.code === 200) {
        const list = res.data?.data?.procedures ?? [];
        setProcedures(list as IProcedureRow[]);
        const count = res.data?.data?.count;
        setProceduresTotal(count != null ? count : list.length);
      } else {
        setProcedures([]);
      }
    } catch {
      setProcedures([]);
    } finally {
      setProceduresLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, []);

  const handleDeleteProcedure = async () => {
    const id = procedureToDelete?.id;
    if (!id || !API_BASE_URL) return;
    setDeleteLoading(true);
    try {
      const res = await axios.delete(`${API_BASE_URL}/hospital/procedures/${id}`);
      if ((res?.status >= 200 && res?.status < 300) || res?.data?.code === 200) {
        setProcedureToDelete(null);
        const modalEl = document.getElementById("delete_procedure");
        if (modalEl) {
          const bsModal = (window as any).bootstrap?.Modal?.getInstance
            ? (window as any).bootstrap.Modal.getInstance(modalEl)
            : null;
          if (bsModal && typeof bsModal.hide === "function") {
            bsModal.hide();
          } else {
            (document.getElementById("delete_procedure_cancel") as HTMLElement | null)?.click();
          }
        }
        fetchProcedures();
      }
    } catch {
      // keep modal open on error
    } finally {
      setDeleteLoading(false);
    }
  };

  const proceduresDataSource = procedures.map((p) => ({
    key: p._id,
    ProcedureId: p.procedureId ?? "—",
    ServiceName: p.procedureName ?? "—",
    Department: p.category ?? "—",
    Price: p.price != null || p.basePrice != null ? `₹${p.price ?? p.basePrice}` : "—",
    Status: p.status ?? "Active",
  }));

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Procedures
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Procedures : {proceduresLoading ? "…" : proceduresTotal}
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
              <Link
                href={all_routes.addProcedure}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" />
                New Procedure
              </Link>
            </div>
          </div>
          <ul className="nav nav-tabs nav-bordered mb-3">
            <li className="nav-item">
              <Link
                href="#procedures"
                data-bs-toggle="tab"
                aria-expanded="true"
                className="nav-link active bg-transparent"
              >
                <span>Procedures</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="#dialysis"
                data-bs-toggle="tab"
                aria-expanded="false"
                className="nav-link bg-transparent"
              >
                <span>Dialysis</span>
              </Link>
            </li>
          </ul>
          <div className="tab-content">
            <div className="tab-pane show active" id="procedures">
          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set mb-3">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="table-search d-flex align-items-center mb-0">
                  <div className="search-input">
                    <SearchInput value={searchText} onChange={handleSearch} />
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
                <Link
                  href="#"
                  className="btn btn-white bg-white fs-14 py-1 border d-inline-flex text-dark align-items-center"
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
                    <h5 className="mb-0 fw-bold">Filter</h5>
                    <div className="d-flex align-items-center">
                      <Link
                        href="#"
                        className="link-danger text-decoration-underline"
                      >
                        Clear All
                      </Link>
                    </div>
                  </div>
                  <form action="#">
                    <div className="filter-body pb-0">
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Procedure Name</label>
                          <a href="#" className="link-primary mb-1">
                            Reset
                          </a>
                        </div>
                        <CommonSelect
                          options={Service_Name}
                          className="select"
                          defaultValue={Service_Name[0]}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Department</label>
                          <a href="#" className="link-primary mb-1">
                            Reset
                          </a>
                        </div>
                        <CommonSelect
                          options={Department}
                          className="select"
                          defaultValue={Department[0]}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Amount</label>
                        <div className="dropdown">
                          <a
                            href="#"
                            className="dropdown-toggle form-control"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="outside"
                            aria-expanded="true"
                          >
                            Select
                          </a>
                          <div className="dropdown-menu shadow-lg w-100 dropdown-info">
                            <div className="filter-range">
                              <Slider
                                min={0}
                                max={100}
                                value={sliderValueDefault}
                                defaultValue={[0, 50]}
                                onChange={handleChangeDefault}
                              />
                              <p>
                                Range :{" "}
                                <span className="text-gray-9">
                                  $200 - $5695
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Status</label>
                          <a href="#" className="link-primary mb-1">
                            Reset
                          </a>
                        </div>
                        <CommonSelect
                          options={StatusActive}
                          className="select"
                          defaultValue={StatusActive[0]}
                        />
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                      <a
                        href="#"
                        className="btn btn-light btn-md me-2"
                        id="close-filter"
                      >
                        Close
                      </a>
                      <button type="submit" className="btn btn-primary btn-md">
                        Filter
                      </button>
                    </div>
                  </form>
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
          <div className="table-responsive">
            {proceduresLoading ? (
              <p className="text-muted mb-0">Loading procedures…</p>
            ) : (
              <Datatable
                columns={columns}
                dataSource={proceduresDataSource}
                Selection={false}
                searchText={searchText}
                onRowClick={handleProcedureRowClick}
              />
            )}
          </div>
            </div>
            <div className="tab-pane" id="dialysis">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
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
                  <p className="text-muted mb-0">Loading dialysis sessions…</p>
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
                        render: (_: any, record: any) => (
                          <div className="text-dark">
                            <div className="fw-semibold fs-14 text-truncate">
                              {record.patientName}
                            </div>
                            {record.meta && (
                              <div className="fs-13 text-muted text-truncate">
                                {record.meta}
                              </div>
                            )}
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
                        render: (_: any, record: any) => (
                          <div className="text-dark">
                            <div>{record.date}</div>
                            {record.time && (
                              <div className="fs-13 text-muted">{record.time}</div>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: "Status",
                        dataIndex: "status",
                        sorter: false,
                        showSorterTooltip: false,
                        render: (text: string) => (
                          <span
                            className={`badge fs-13 fw-medium border ${
                              text === "Completed"
                                ? "badge-soft-success text-success border-success"
                                : text === "In Progress"
                                  ? "badge-soft-warning text-warning border-warning"
                                  : "badge-soft-secondary text-secondary border-secondary"
                            }`}
                          >
                            {text || "—"}
                          </span>
                        ),
                      },
                    ]}
                    dataSource={dialysisSessions.map((session) => ({
                      key: session._id,
                      sessionId: session.sessionId ?? "—",
                      patientName: session.patient?.name ?? "—",
                      meta: [
                        session.patient?.age != null ? `${session.patient.age}` : "",
                        session.patient?.gender || "",
                      ]
                        .filter(Boolean)
                        .join(", "),
                      phone: session.patient?.phone ?? "—",
                      date: session.createdAt
                        ? dayjs(session.createdAt).format("DD MMM YYYY")
                        : "—",
                      time: session.createdAt
                        ? dayjs(session.createdAt).format("hh:mm A")
                        : "",
                      status: session.status ?? "—",
                    }))}
                    Selection={false}
                    searchText={dialysisSearch}
                  />
                )}
              </div>
            </div>
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

      <Modals
        onDeleteConfirm={handleDeleteProcedure}
        deleteLoading={deleteLoading}
        onEditSuccess={fetchProcedures}
      />
    </>
  );
};

export default ProceduresComponent;
