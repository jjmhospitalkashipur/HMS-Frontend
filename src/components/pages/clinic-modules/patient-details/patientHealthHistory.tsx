"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { all_routes } from "@/routes/all_routes";
import {
  streamHealthData,
  type IHealthHistoryItem,
  type THealthStreamConnectionStatus,
} from "@/core/api/abdmHealthDataStreamApi";
import HealthHistoryDetailModal from "./HealthHistoryDetailModal";

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateInputFromIso = (iso: string | null): string => {
  if (!iso?.trim()) return "";
  const date = dayjs(iso);
  return date.isValid() ? date.format("YYYY-MM-DD") : "";
};

const toIsoStartOfDay = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const toIsoEndOfDay = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const PatientHealthHistoryComponent = () => {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId")?.trim() ?? "";
  const defaultFromParam = searchParams.get("dateRangeFrom")?.trim() ?? "";
  const defaultToParam = searchParams.get("dateRangeTo")?.trim() ?? "";

  const [dateRangeFrom, setDateRangeFrom] = useState(
    () => toDateInputFromIso(defaultFromParam) || "2023-01-01"
  );
  const [dateRangeTo, setDateRangeTo] = useState(
    () => toDateInputFromIso(defaultToParam) || toDateInputValue(new Date())
  );
  const [items, setItems] = useState<IHealthHistoryItem[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<THealthStreamConnectionStatus>("idle");
  const [streamInfo, setStreamInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<IHealthHistoryItem | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isStreaming =
    connectionStatus === "connecting" || connectionStatus === "streaming";

  const statusLabel = useMemo(() => {
    switch (connectionStatus) {
      case "connecting":
        return "Connecting...";
      case "streaming":
        return "Streaming...";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "Idle";
    }
  }, [connectionStatus]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      setStreamInfo(
        `Received ${items.length} health record${items.length === 1 ? "" : "s"}...`
      );
    }
  }, [items.length]);

  const handleFetchHistory = useCallback(async () => {
    if (!patientId) {
      setError("Patient ID is missing.");
      setConnectionStatus("error");
      return;
    }
    if (!dateRangeFrom || !dateRangeTo) {
      setError("Please select both date range from and to.");
      setConnectionStatus("error");
      return;
    }

    // Prefer exact consent ISO defaults when the selected calendar day is unchanged.
    const fromIso =
      defaultFromParam && toDateInputFromIso(defaultFromParam) === dateRangeFrom
        ? defaultFromParam
        : toIsoStartOfDay(dateRangeFrom);
    const toIso =
      defaultToParam && toDateInputFromIso(defaultToParam) === dateRangeTo
        ? defaultToParam
        : toIsoEndOfDay(dateRangeTo);

    if (!fromIso || !toIso) {
      setError("Please select a valid date range.");
      setConnectionStatus("error");
      return;
    }
    if (new Date(fromIso) > new Date(toIso)) {
      setError("Date range from must be before date range to.");
      setConnectionStatus("error");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setItems([]);
    setError(null);
    setStreamInfo(null);
    setConnectionStatus("connecting");

    try {
      await streamHealthData(
        {
          patientId,
          dateRangeFrom: fromIso,
          dateRangeTo: toIso,
        },
        {
          signal: controller.signal,
          onStatus: (status, message) => {
            if (!controller.signal.aborted) {
              setConnectionStatus(status);
              if (message?.trim() && status !== "streaming") {
                setStreamInfo(message.trim());
              } else if (message?.trim() && status === "streaming") {
                setStreamInfo((prev) =>
                  prev?.startsWith("Received ") ? prev : message.trim()
                );
              }
              if (status === "error" && message?.trim()) {
                setError(message.trim());
              }
            }
          },
          onInfo: (message) => {
            if (!controller.signal.aborted && message?.trim()) {
              setStreamInfo((prev) =>
                prev?.startsWith("Received ") ? prev : message.trim()
              );
            }
          },
          onItems: (incoming) => {
            if (controller.signal.aborted) return;
            setItems((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const toAdd = incoming.filter(
                (item) => Boolean(item?.id) && !existingIds.has(item.id)
              );
              if (!toAdd.length) return prev;
              return [...prev, ...toAdd];
            });
          },
        }
      );
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setConnectionStatus("error");
      setError(err instanceof Error ? err.message : "Failed to stream health history.");
    }
  }, [
    patientId,
    dateRangeFrom,
    dateRangeTo,
    defaultFromParam,
    defaultToParam,
  ]);

  // Auto-fetch on page load / browser refresh / patient change.
  useEffect(() => {
    if (!patientId || !dateRangeFrom || !dateRangeTo) return;
    void handleFetchHistory();
    // Only re-run when patient changes; date changes use Refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [patientId]);

  const handleOpenDetails = (item: IHealthHistoryItem) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="mb-3">
            <Link
              href={`${all_routes.patientDetails}?patientId=${encodeURIComponent(patientId)}`}
              className="btn btn-light mb-2"
              aria-label="Back to patient details"
            >
              <i className="ti ti-arrow-left me-1" />
              Back
            </Link>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h4 className="fw-bold mb-1">Patient Health History</h4>
                <p className="text-muted mb-0">
                  ABDM health data for this patient
                  {patientId ? ` — loads automatically` : ""}.
                </p>
              </div>
              <span
                className={`badge border fs-12 fw-semibold px-2 py-1 rounded-2 ${
                  connectionStatus === "completed"
                    ? "badge-soft-success border-success text-success"
                    : connectionStatus === "error"
                      ? "badge-soft-danger border-danger text-danger"
                      : connectionStatus === "idle"
                        ? "badge-soft-secondary border-secondary text-secondary"
                        : "badge-soft-warning border-warning text-warning"
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="card shadow-sm mb-3">
            <div className="card-body py-3">
              <div className="row g-2 align-items-end">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-medium fs-14" htmlFor="history-date-from">
                    Date Range From <span className="text-danger">*</span>
                  </label>
                  <input
                    id="history-date-from"
                    type="date"
                    className="form-control"
                    value={dateRangeFrom}
                    onChange={(e) => setDateRangeFrom(e.target.value)}
                    disabled={isStreaming}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-medium fs-14" htmlFor="history-date-to">
                    Date Range To <span className="text-danger">*</span>
                  </label>
                  <input
                    id="history-date-to"
                    type="date"
                    className="form-control"
                    value={dateRangeTo}
                    onChange={(e) => setDateRangeTo(e.target.value)}
                    disabled={isStreaming}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                    <div>
                      <span className="text-muted fs-12 d-block">Records</span>
                      <span className="text-dark fw-medium">{items.length}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary text-nowrap"
                      onClick={handleFetchHistory}
                      disabled={isStreaming || !patientId}
                      aria-label="Refresh health history"
                    >
                      <i className="ti ti-refresh me-1" />
                      {isStreaming ? "Fetching..." : "Refresh"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {streamInfo ? (
            <div className="alert alert-info py-2" role="status">
              {streamInfo}
            </div>
          ) : null}

          {error ? (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          ) : null}

          <div className="table-responsive">
            {!items.length ? (
              <p className="text-muted mb-0">
                {isStreaming
                  ? streamInfo || "Waiting for health history records..."
                  : connectionStatus === "idle"
                    ? "Loading health history..."
                    : "No health history records found."}
              </p>
            ) : (
              <table className="table table-nowrap table-hover">
                <thead className="thead-light">
                  <tr>
                    <th>Title</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer"
                      aria-label={`Open details for ${item.title}`}
                      onClick={() => handleOpenDetails(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpenDetails(item);
                        }
                      }}
                    >
                      <td>
                        <span className="text-dark fw-medium">{item.title}</span>
                      </td>
                      <td className="text-dark">{item.patientName ?? "—"}</td>
                      <td className="text-dark">{item.practitionerName ?? "—"}</td>
                      <td className="text-dark">{item.organizationName ?? "—"}</td>
                      <td className="text-dark">
                        {item.createdAt
                          ? dayjs(item.createdAt).format("DD MMM YYYY, HH:mm")
                          : "—"}
                      </td>
                      <td className="text-dark text-capitalize">{item.status ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <HealthHistoryDetailModal
        open={Boolean(selectedItem)}
        onClose={handleCloseDetails}
        item={selectedItem?.raw ?? null}
        title={selectedItem?.title ?? "Health History Details"}
      />
    </>
  );
};

export default PatientHealthHistoryComponent;
