"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import dayjs from "dayjs";
import Datatable from "@/core/common/dataTable";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import { API_BASE_URL } from "@/environment";
import { all_routes } from "@/routes/all_routes";

interface IPharmaTokenApi {
  _id: string;
  pharmaTokenId?: number | string;
  tokenId?: string;
  tokenNo?: number | string;
  tokenNumber?: number | string;
  visitId?: string;
  patientName?: string;
  mrd?: string;
  patientPhone?: string;
  visitType?: string;
  date?: string;
  status?: string;
  createdAt?: string;
  createdDate?: string;
  patient?: {
    mrd?: string;
    title?: string;
    name?: string;
    phone?: string;
    age?: number;
    gender?: string;
  };
}

interface IPharmaTokenRow {
  id: string;
  Pharma_Token_ID: string;
  MRD: string;
  Patient: string;
  Phone: string;
  Age_Gender: string;
  Status: string;
  Date: string;
}

interface IPatientSearchItem {
  _id: string;
  patientId?: string;
  name?: string;
  phone?: string;
  mrd?: string;
  age?: number;
  gender?: string;
}

const PharmaTokensComponent = () => {
  const [data, setData] = useState<IPharmaTokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [patientSearchText, setPatientSearchText] = useState("");
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchResults, setPatientSearchResults] = useState<IPatientSearchItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<IPatientSearchItem | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const handleFetchPharmaTokens = useCallback(async () => {
    if (!API_BASE_URL) return;
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string | number> = {
        page,
        limit,
      };
      const trimmedSearch = searchText.trim();
      if (trimmedSearch) params.search = trimmedSearch;

      const response = await axios.get(`${API_BASE_URL}/hospital/pharma-tokens`, { params });
      const payload = response.data?.data ?? {};
      const tokens: IPharmaTokenApi[] = Array.isArray(payload?.tokens)
        ? payload.tokens
        : Array.isArray(payload?.pharmaTokens)
          ? payload.pharmaTokens
          : Array.isArray(payload?.list)
            ? payload.list
            : [];

      const pagination = payload?.pagination;
      if (pagination && typeof pagination === "object") {
        const apiTotal =
          typeof pagination.totalCount === "number"
            ? pagination.totalCount
            : typeof pagination.total === "number"
              ? pagination.total
              : undefined;
        setTotalCount(typeof apiTotal === "number" ? apiTotal : tokens.length);
      } else {
        setTotalCount(typeof payload?.count === "number" ? payload.count : tokens.length);
      }

      const rows: IPharmaTokenRow[] = tokens.map((token) => {
        const created = token.createdAt || token.createdDate || "";
        const formattedDate = token.date
          ? dayjs(token.date).format("DD MMM YYYY")
          : created
            ? dayjs(created).format("DD MMM YYYY")
            : "—";
        const tokenNumber =
          token.pharmaTokenId ??
          token.tokenNo ??
          token.tokenNumber ??
          token.tokenId ??
          "—";
        return {
          id: token._id,
          Pharma_Token_ID: String(tokenNumber),
          MRD: token.mrd || token.patient?.mrd || "—",
          Patient: token.patientName || token.patient?.name || "—",
          Phone: token.patientPhone || token.patient?.phone || "—",
          Age_Gender:
            token.patient?.age != null || token.patient?.gender
              ? `${token.patient?.age ?? "—"} / ${token.patient?.gender ?? "—"}`
              : "—",
          Status: token.status || "—",
          Date: formattedDate,
        };
      });

      setData(rows);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load pharma tokens");
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchText]);

  useEffect(() => {
    handleFetchPharmaTokens();
  }, [handleFetchPharmaTokens]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
  };

  const handleCreatePharmaToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!API_BASE_URL) return;
    if (!selectedPatient?._id) {
      setCreateError("Please select a patient.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError("");
      const selectedPatientId = selectedPatient.patientId ?? selectedPatient._id;
      await axios.post(`${API_BASE_URL}/hospital/pharma-tokens`, {
        patientId: selectedPatientId,
      });

      const modalElement = document.getElementById("add_pharma_token");
      const Offcanvas = (window as any).bootstrap?.Offcanvas;
      if (modalElement && Offcanvas) {
        const offcanvasInstance =
          Offcanvas.getInstance(modalElement) ?? Offcanvas.getOrCreateInstance(modalElement);
        offcanvasInstance?.hide();
      } else if (modalElement) {
        modalElement.classList.remove("show");
        modalElement.setAttribute("aria-hidden", "true");
        (modalElement as HTMLElement).style.visibility = "hidden";
      }

      setPatientSearchText("");
      setSelectedPatient(null);
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      setPage(1);
      await handleFetchPharmaTokens();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || "Failed to create pharma token.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdatePharmaTokenStatus = async (tokenMongoId: string, newStatus: string) => {
    if (!API_BASE_URL || !tokenMongoId) return;
    try {
      setStatusUpdatingId(tokenMongoId);
      await axios.patch(`${API_BASE_URL}/hospital/pharma-tokens/${tokenMongoId}`, {
        status: newStatus,
      });
      setStatusUpdates((prev) => ({ ...prev, [tokenMongoId]: newStatus }));
      setData((prev) =>
        prev.map((row) => (row.id === tokenMongoId ? { ...row, Status: newStatus } : row))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleSearchPatients = useCallback(async (query: string) => {
    if (!API_BASE_URL) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setPatientSearchResults([]);
      return;
    }

    try {
      setPatientSearchLoading(true);
      const response = await axios.get(`${API_BASE_URL}/hospital/patients`, {
        params: { search: trimmed, limit: 10 },
      });
      const payload = response.data?.data ?? {};
      const patients: IPatientSearchItem[] = Array.isArray(payload?.patients)
        ? payload.patients
        : Array.isArray(payload?.list)
          ? payload.list
          : [];
      setPatientSearchResults(patients);
    } catch {
      setPatientSearchResults([]);
    } finally {
      setPatientSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchPatients(patientSearchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearchText, handleSearchPatients]);

  const columns = [
    {
      title: "Pharma Token ID",
      dataIndex: "Pharma_Token_ID",
      render: (text: string) => <span className="text-dark fw-semibold">{text}</span>,
    },
    {
      title: "MRD",
      dataIndex: "MRD",
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Patient Name",
      dataIndex: "Patient",
      render: (_: string, record: IPharmaTokenRow) => (
        <div>
          <div className="text-dark fw-medium">{record.Patient}</div>
          <div className="text-dark fs-13">{record.Phone}</div>
        </div>
      ),
    },
    {
      title: "Age / Gender",
      dataIndex: "Age_Gender",
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: IPharmaTokenRow) => {
        const currentStatus = statusUpdates[record.id] || record.Status || "Created";
        const statusOptions = ["Created", "Completed", "Cancelled"];
        const isUpdating = statusUpdatingId === record.id;
        const getStatusClass = (status: string) => {
          switch (status) {
            case "Created":
              return "badge-soft-primary text-primary";
            case "Completed":
              return "badge-soft-success text-success";
            case "Cancelled":
              return "badge-soft-danger text-danger";
            default:
              return "badge-soft-secondary text-secondary";
          }
        };
        return (
          <div className="dropdown" onClick={(e) => e.stopPropagation()}>
            <button
              className={`btn btn-sm fs-13 badge ${getStatusClass(currentStatus)} rounded fw-medium dropdown-toggle`}
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : currentStatus}
            </button>
            <ul className="dropdown-menu">
              {statusOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={(e) => {
                      if (isUpdating) return;
                      handleUpdatePharmaTokenStatus(record.id, option);
                      const dropdown = e.currentTarget.closest(".dropdown");
                      if (dropdown) {
                        const toggle = dropdown.querySelector<HTMLElement>("[data-bs-toggle=\"dropdown\"]");
                        const menu = dropdown.querySelector<HTMLElement>(".dropdown-menu");
                        if (toggle && menu) {
                          toggle.setAttribute("aria-expanded", "false");
                          toggle.classList.remove("show");
                          menu.classList.remove("show");
                        }
                      }
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "Date",
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
          <div className="flex-grow-1">
            <h4 className="fw-semibold mb-0">
              Pharma Appointments
              <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-2">
                Total : {totalCount}
              </span>
            </h4>
          </div>
          <div className="text-end d-flex align-items-center flex-wrap justify-content-end gap-2">
            <Link
              href={all_routes.pharmaTokenQueue}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary fs-13 btn-md"
            >
              <i className="ti ti-list-details me-1" />
              Queue
            </Link>
            <button
              type="button"
              className="btn btn-primary fs-13 btn-md"
              data-bs-toggle="offcanvas"
              data-bs-target="#add_pharma_token"
              aria-controls="add_pharma_token"
            >
              <i className="ti ti-plus me-1" />
              Create
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div className="search-input">
            <SearchInput value={searchText} onChange={handleSearch} />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-3" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="table-responsive">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading pharma tokens...</p>
            </div>
          ) : (
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={false}
              searchText={searchText}
              total={totalCount}
              currentPage={page}
              pageSize={limit}
              onPaginationChange={handlePaginationChange}
            />
          )}
        </div>
      </div>
      <div
        className="offcanvas offcanvas-offset offcanvas-end offcanvas-large"
        tabIndex={-1}
        id="add_pharma_token"
        style={{ width: "700px" }}
      >
        <div className="offcanvas-header d-block pb-0 px-0">
          <div className="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
            <h5 className="offcanvas-title fs-18 fw-bold">Create Pharma Token</h5>
            <button
              type="button"
              className="btn-close custom-btn-close opacity-100"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            >
              <i className="ti ti-x fs-16 text-dark" />
            </button>
          </div>
        </div>
        <div className="offcanvas-body p-0">
          <form onSubmit={handleCreatePharmaToken}>
            <div className="p-3">
              {createError ? (
                <div className="alert alert-danger" role="alert">
                  {createError}
                </div>
              ) : null}
              <div className="row">
                <div className="col-12">
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">
                      Search Patient <span className="text-danger ms-1">*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name / phone / MRD"
                        value={patientSearchText}
                        onChange={(e) => {
                          setPatientSearchText(e.target.value);
                          setShowPatientDropdown(true);
                          setSelectedPatient(null);
                        }}
                        onFocus={() => setShowPatientDropdown(true)}
                      />
                      {showPatientDropdown && patientSearchText.trim() ? (
                        <div
                          className="dropdown-menu show w-100 mt-1 p-0"
                          style={{ maxHeight: "260px", overflowY: "auto", position: "absolute" }}
                        >
                          {patientSearchLoading ? (
                            <div className="px-3 py-2 text-muted">Searching...</div>
                          ) : patientSearchResults.length > 0 ? (
                            patientSearchResults.map((patient) => (
                              <button
                                key={patient._id}
                                type="button"
                                className="dropdown-item py-2"
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setPatientSearchText(
                                    [patient.name, patient.mrd ? `(${patient.mrd})` : ""]
                                      .filter(Boolean)
                                      .join(" ")
                                  );
                                  setShowPatientDropdown(false);
                                }}
                              >
                                <div className="fw-medium text-dark">{patient.name || "—"}</div>
                                <div className="fs-12 text-muted">
                                  MRD: {patient.mrd || "—"} | Phone: {patient.phone || "—"}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-muted">No patients found</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                {selectedPatient ? (
                  <div className="col-12">
                    <div className="border rounded p-3 bg-light">
                      <h6 className="mb-2 fw-semibold">Selected Patient</h6>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <div className="text-muted fs-12">Name</div>
                          <div className="text-dark">{selectedPatient.name || "—"}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="text-muted fs-12">MRD</div>
                          <div className="text-dark">{selectedPatient.mrd || "—"}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="text-muted fs-12">Phone</div>
                          <div className="text-dark">{selectedPatient.phone || "—"}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="text-muted fs-12">Age / Gender</div>
                          <div className="text-dark">
                            {selectedPatient.age != null ? selectedPatient.age : "—"} / {selectedPatient.gender || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="offcanvas-footer mb-1 p-3 border-1 border-top">
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light btn-md"
                  data-bs-dismiss="offcanvas"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-md" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </form>
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
  );
};

export default PharmaTokensComponent;
