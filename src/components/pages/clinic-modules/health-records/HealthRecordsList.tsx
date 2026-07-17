"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
// import ImageWithBasePath from "@/core/imageWithBasePath";
import {
  // deleteFhirHealthRecord,
  getFhirHiTypeLabel,
  linkFhirHealthRecords,
  listFhirHealthRecords,
} from "@/core/api/fhirHealthRecordApi";
import type {
  IFhirHealthRecordListItem,
  TFhirSourceType,
} from "@/core/types/fhirHealthRecord";

interface IProps {
  sourceType: TFhirSourceType;
  sourceId: string;
  refreshKey?: number;
  onEdit?: (fhirRecordId: string) => void;
  /** When false, linking is blocked (patient/visit not ABHA-linked). */
  abhaLinked?: boolean;
}

const resolveRecordId = (record: IFhirHealthRecordListItem): string =>
  record._id || record.fhirId || record.id || "";

const resolveRecordDate = (record: IFhirHealthRecordListItem): string => {
  const raw = record.metadata?.date || record.createdAt || record.updatedAt || "";
  if (!raw) return "—";
  const d = dayjs(raw);
  return d.isValid() ? d.format("DD MMM YYYY, HH:mm") : raw;
};

const resolveStatus = (record: IFhirHealthRecordListItem): string => {
  const raw = (record.metadata?.status || record.status || "").trim();
  if (!raw) return record.finalizedAt ? "Final" : "Draft";
  if (raw.toLowerCase() === "final") return "Final";
  if (raw.toLowerCase() === "draft") return "Draft";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const isFinalStatus = (status: string): boolean => status.toLowerCase().includes("final");

const isRecordDraft = (record: IFhirHealthRecordListItem): boolean => {
  const raw = (record.metadata?.status || record.status || "").trim().toLowerCase();
  if (raw === "draft") return true;
  if (raw.includes("final")) return false;
  if (raw.includes("draft")) return true;
  if (record.finalizedAt) return false;
  return false;
};

const isAlreadyLinkedToAbdm = (record: IFhirHealthRecordListItem): boolean =>
  record.linkedToAbdm === true;

const canSelectRecordForLink = (
  record: IFhirHealthRecordListItem,
  abhaLinked: boolean
): boolean => {
  const recordId = resolveRecordId(record);
  if (!recordId || !abhaLinked) return false;
  if (isRecordDraft(record)) return false;
  if (isAlreadyLinkedToAbdm(record)) return false;
  return true;
};

const statusBadgeClass = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes("final")) return "badge bg-success-transparent text-success";
  if (normalized.includes("draft")) return "badge bg-warning-transparent text-warning";
  return "badge bg-light text-dark border";
};

const HealthRecordsList = ({
  sourceType,
  sourceId,
  refreshKey = 0,
  onEdit,
  abhaLinked = false,
}: IProps) => {
  const [records, setRecords] = useState<IFhirHealthRecordListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  // const [deleteTarget, setDeleteTarget] = useState<IFhirHealthRecordListItem | null>(null);
  // const [deleting, setDeleting] = useState(false);
  // const [deleteError, setDeleteError] = useState("");
  const limit = 10;

  const fetchRecords = useCallback(
    async (nextPage: number) => {
      if (!sourceId?.trim()) {
        setRecords([]);
        setTotal(0);
        setSelectedIds([]);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const result = await listFhirHealthRecords(sourceType, sourceId, nextPage, limit);
        setRecords(result.records);
        setTotal(result.total);
        setPage(result.page);
        setSelectedIds([]);
      } catch (err) {
        setRecords([]);
        setTotal(0);
        setSelectedIds([]);
        setError(err instanceof Error ? err.message : "Failed to load health records");
      } finally {
        setLoading(false);
      }
    },
    [sourceId, sourceType]
  );

  useEffect(() => {
    setPage(1);
    void fetchRecords(1);
  }, [fetchRecords, refreshKey]);

  const selectableIds = useMemo(
    () =>
      records
        .filter((record) => canSelectRecordForLink(record, abhaLinked))
        .map((record) => resolveRecordId(record))
        .filter((id): id is string => Boolean(id)),
    [records, abhaLinked]
  );

  useEffect(() => {
    if (abhaLinked) return;
    setSelectedIds([]);
  }, [abhaLinked]);

  const allSelectableSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  const handleToggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...selectableIds])));
  };

  const handleToggleRow = (recordId: string, checked: boolean) => {
    if (!recordId) return;
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(recordId)) return prev;
        return [...prev, recordId];
      }
      return prev.filter((id) => id !== recordId);
    });
  };

  const handleLinkSelected = async () => {
    if (selectedIds.length === 0 || linking) return;
    setLinking(true);
    setLinkError("");
    setLinkSuccess("");
    try {
      await linkFhirHealthRecords(selectedIds);
      setLinkSuccess(
        `Linked ${selectedIds.length} health record${selectedIds.length === 1 ? "" : "s"} successfully.`
      );
      setSelectedIds([]);
      await fetchRecords(page);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Failed to link health records");
    } finally {
      setLinking(false);
    }
  };

  /*
  const handleCloseDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    const recordId = deleteTarget ? resolveRecordId(deleteTarget) : "";
    if (!recordId) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteFhirHealthRecord(recordId);
      setDeleteTarget(null);
      const nextPage =
        records.length <= 1 && page > 1 ? page - 1 : page;
      await fetchRecords(nextPage);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete health record");
    } finally {
      setDeleting(false);
    }
  };
  */

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1 && !loading;
  const canNext = page < totalPages && !loading;
  /*
  const deleteTargetId = deleteTarget ? resolveRecordId(deleteTarget) : "";
  const deleteTargetType = deleteTarget
    ? getFhirHiTypeLabel(
        typeof deleteTarget.hiType === "string" ? deleteTarget.hiType : undefined
      )
    : "";
  */

  return (
    <div className="card mt-3 mb-0">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h6 className="fw-bold text-primary mb-0">Health Records</h6>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={!abhaLinked || selectedIds.length === 0 || linking}
              title={
                !abhaLinked
                  ? "ABHA must be linked before linking health records"
                  : selectedIds.length === 0
                    ? "Select at least one record"
                    : "Link selected health records"
              }
              onClick={() => void handleLinkSelected()}
              aria-label="Link selected health records"
            >
              {linking ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  />
                  Linking…
                </>
              ) : (
                <>
                  <i className="ti ti-link me-1" />
                  Link{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
                </>
              )}
            </button>
          </div>
          {total > 0 ? (
            <span className="text-muted fs-13">{total} record{total === 1 ? "" : "s"}</span>
          ) : null}
        </div>

        {linkError ? (
          <div className="alert alert-danger py-2" role="alert">
            {linkError}
          </div>
        ) : null}
        {linkSuccess ? (
          <div className="alert alert-success py-2" role="alert">
            {linkSuccess}
          </div>
        ) : null}

        {loading ? (
          <div className="d-flex justify-content-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="alert alert-danger py-2 mb-0" role="alert">
            {error}
          </div>
        ) : null}

        {!loading && !error && records.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="ti ti-file-text fs-48 mb-2 d-block" />
            <p className="mb-0">No health records found</p>
          </div>
        ) : null}

        {!loading && !error && records.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th className="border-0 fs-13 fw-medium align-middle" style={{ width: "48px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input m-0 border border-2 border-secondary"
                        style={{ width: "1.15rem", height: "1.15rem", cursor: selectableIds.length === 0 || linking ? "not-allowed" : "pointer" }}
                        checked={allSelectableSelected}
                        disabled={selectableIds.length === 0 || linking}
                        onChange={handleToggleSelectAll}
                        aria-label="Select all linkable health records"
                      />
                    </th>
                    <th className="border-0 fs-13 fw-medium">Type</th>
                    <th className="border-0 fs-13 fw-medium">Date</th>
                    <th className="border-0 fs-13 fw-medium">Status</th>
                    <th className="border-0 fs-13 fw-medium text-end" style={{ minWidth: "120px" }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => {
                    const id = resolveRecordId(record) || `row-${index}`;
                    const status = resolveStatus(record);
                    const recordId = resolveRecordId(record);
                    const isFinal = isFinalStatus(status);
                    const isDraft = isRecordDraft(record);
                    const alreadyLinked = isAlreadyLinkedToAbdm(record);
                    const canSelect = canSelectRecordForLink(record, abhaLinked);
                    const canEdit = Boolean(recordId) && !isFinal;
                    // const canDelete = Boolean(recordId) && !isFinal;
                    const typeLabel = getFhirHiTypeLabel(
                      typeof record.hiType === "string" ? record.hiType : undefined
                    );
                    const checkboxTitle = !abhaLinked
                      ? "ABHA must be linked before selecting records"
                      : isDraft
                        ? "Draft records cannot be linked"
                        : alreadyLinked
                          ? "Record is already linked to ABDM"
                          : "Select record";
                    return (
                      <tr key={id}>
                        <td className="align-middle">
                          <input
                            type="checkbox"
                            className={`form-check-input m-0 border border-2 ${
                              canSelect ? "border-primary" : "border-secondary"
                            }`}
                            style={{
                              width: "1.15rem",
                              height: "1.15rem",
                              opacity: canSelect ? 1 : 0.45,
                              cursor: !canSelect || linking ? "not-allowed" : "pointer",
                            }}
                            checked={Boolean(recordId) && selectedIds.includes(recordId)}
                            disabled={!canSelect || linking}
                            title={checkboxTitle}
                            onChange={(e) => handleToggleRow(recordId, e.target.checked)}
                            aria-label={`Select ${typeLabel}`}
                          />
                        </td>
                        <td className="fs-14 text-dark fw-medium">{typeLabel}</td>
                        <td className="fs-14 text-dark">{resolveRecordDate(record)}</td>
                        <td className="fs-14">
                          <span className={statusBadgeClass(status)}>{status}</span>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex align-items-center gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              disabled={!canEdit}
                              title={
                                isFinal ? "Finalized records cannot be edited" : "Edit record"
                              }
                              onClick={() => {
                                if (!recordId || !canEdit) return;
                                onEdit?.(recordId);
                              }}
                              aria-label={`Edit ${typeLabel}`}
                            >
                              <i className="ti ti-edit me-1" />
                              Edit
                            </button>
                            {/* Delete temporarily disabled
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={!canDelete || deleting}
                              title={
                                isFinal ? "Finalized records cannot be deleted" : "Delete record"
                              }
                              onClick={() => {
                                if (!recordId || !canDelete) return;
                                setDeleteError("");
                                setDeleteTarget(record);
                              }}
                              aria-label={`Delete ${typeLabel}`}
                            >
                              <i className="ti ti-trash" />
                            </button>
                            */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="d-flex align-items-center justify-content-between mt-3 gap-2 flex-wrap">
                <span className="text-muted fs-13">
                  Page {page} of {totalPages}
                </span>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={!canPrev}
                    onClick={() => void fetchRecords(page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={!canNext}
                    onClick={() => void fetchRecords(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Delete confirmation modal temporarily disabled
      {deleteTarget && deleteTargetId ? (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete_health_record_title"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDeleteModal();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-body text-center position-relative z-1">
                <ImageWithBasePath
                  src="assets/img/bg/delete-modal-bg-01.png"
                  alt=""
                  className="img-fluid position-absolute top-0 start-0 z-n1"
                />
                <ImageWithBasePath
                  src="assets/img/bg/delete-modal-bg-02.png"
                  alt=""
                  className="img-fluid position-absolute bottom-0 end-0 z-n1"
                />
                <div className="mb-3">
                  <span className="avatar avatar-lg bg-danger text-white">
                    <i className="ti ti-trash fs-24" aria-hidden />
                  </span>
                </div>
                <h5 id="delete_health_record_title" className="fw-bold mb-1">
                  Delete health record?
                </h5>
                <p className="mb-3 text-muted small">
                  This will permanently delete the <strong>{deleteTargetType}</strong> record.
                  This action cannot be undone.
                </p>
                {deleteError ? (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    {deleteError}
                  </div>
                ) : null}
                <div className="d-flex justify-content-center flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={handleCloseDeleteModal}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => void handleConfirmDelete()}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-1"
                          role="status"
                          aria-hidden="true"
                        />
                        Deleting…
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      */}
    </div>
  );
};

export default HealthRecordsList;
