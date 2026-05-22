"use client";

import { useMemo } from "react";
import CommonSelect, { type Option } from "@/core/common/common-select/commonSelect";
import {
  computeBedSummary,
  type IIpdBed,
  type IIpdBedBlockViewData,
  type IIpdBedSummary,
  type IpdBedStatus,
} from "./ipdBedTypes";
import type { IIpdWardOption } from "./fetchIpdBedBlockView";

const BED_STATUS_STYLES: Record<
  IpdBedStatus,
  { bg: string; label: string; countKey: keyof Pick<IIpdBedSummary, "available" | "occupied" | "reserved" | "maintenance"> }
> = {
  available: { bg: "#5cb85c", label: "Available", countKey: "available" },
  occupied: { bg: "#e8837a", label: "Occupied", countKey: "occupied" },
  reserved: { bg: "#f0a830", label: "Reserved", countKey: "reserved" },
  maintenance: { bg: "#9e9e9e", label: "Maintenance", countKey: "maintenance" },
};

interface IIpdBedSelectionStepProps {
  data: IIpdBedBlockViewData | null;
  loading?: boolean;
  error?: string;
  selectedBedId: string | null;
  onSelectBed: (bed: IIpdBed) => void;
}

const getBedSubtitle = (bed: IIpdBed): string => {
  if (bed.status === "available") return "Available";
  if (bed.status === "maintenance") return bed.conditionLabel ?? "Maintenance";
  if (bed.status === "reserved") return bed.conditionLabel ?? "Reserved";
  if (bed.patientName && bed.conditionLabel) {
    return `${bed.patientName} · ${bed.conditionLabel}`;
  }
  return bed.patientName ?? bed.conditionLabel ?? "Occupied";
};

const ALL_WARDS_VALUE = "__all__";

const shellClass = "px-3 px-md-4 pb-4 w-100 bg-white";

interface IIpdBedWardFilterProps {
  wardOptions?: IIpdWardOption[];
  selectedWardId?: string | null;
  onWardFilterChange?: (wardId: string | null) => void;
  wardsLoading?: boolean;
}

export const IpdBedWardFilter = ({
  wardOptions = [],
  selectedWardId = null,
  onWardFilterChange,
  wardsLoading = false,
}: IIpdBedWardFilterProps) => {
  const wardSelectOptions: Option[] = useMemo(
    () => [
      { value: ALL_WARDS_VALUE, label: "All Wards" },
      ...wardOptions.map((w) => ({ value: w.value, label: w.label })),
    ],
    [wardOptions]
  );

  const wardSelectValue: Option | null = useMemo(() => {
    if (!selectedWardId) {
      return wardSelectOptions[0] ?? null;
    }
    return wardSelectOptions.find((o) => o.value === selectedWardId) ?? null;
  }, [selectedWardId, wardSelectOptions]);

  const handleWardChange = (option: Option | null) => {
    if (!onWardFilterChange) return;
    const wardId =
      !option?.value || option.value === ALL_WARDS_VALUE ? null : option.value;
    onWardFilterChange(wardId);
  };

  if (!onWardFilterChange) return null;

  return (
    <div
      className="d-flex align-items-center gap-2 flex-shrink-0 ms-md-auto"
      style={{ minWidth: "140px", maxWidth: "220px", width: "100%" }}
    >
      <span className="form-label mb-0 fw-medium fs-13 text-nowrap text-muted flex-shrink-0">
        Ward
      </span>
      <div className="flex-grow-1 ipd-ward-filter-select" style={{ minWidth: 0 }}>
        <CommonSelect
          options={wardSelectOptions}
          value={wardSelectValue}
          onChange={handleWardChange}
          placeholder="All"
          isLoading={wardsLoading}
        />
      </div>
    </div>
  );
};

const IpdBedSelectionStep = ({
  data,
  loading = false,
  error = "",
  selectedBedId,
  onSelectBed,
}: IIpdBedSelectionStepProps) => {
  const summary = useMemo(() => {
    if (!data?.wards?.length) return null;
    return data.summary ?? computeBedSummary(data.wards);
  }, [data]);

  if (loading) {
    return (
      <div className={shellClass}>
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading beds…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.wards?.length) {
    return (
      <div className={shellClass}>
        {error ? <div className="alert alert-warning py-2 mb-0">{error}</div> : null}
        {!error ? <div className="alert alert-info mb-0">No beds available to display.</div> : null}
      </div>
    );
  }

  return (
    <div className={shellClass}>
      {error ? <div className="alert alert-warning py-2 mb-3">{error}</div> : null}
      <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 gap-md-3 mb-4 pb-2">
        {(Object.keys(BED_STATUS_STYLES) as IpdBedStatus[]).map((status) => {
          const style = BED_STATUS_STYLES[status];
          const count = summary?.[style.countKey] ?? 0;
          return (
            <div
              key={status}
              className="d-flex align-items-center gap-2 bg-white rounded-2 px-2 py-1 border"
            >
              <span
                className="rounded-1 d-inline-block flex-shrink-0"
                style={{ width: 12, height: 12, backgroundColor: style.bg }}
                aria-hidden
              />
              <span className="fs-13 text-dark fw-medium text-nowrap">
                {style.label}{" "}
                <span className="fw-bold">({count})</span>
              </span>
            </div>
          );
        })}
        {summary ? (
          <>
            <span className="d-none d-md-inline text-muted">|</span>
            <span className="fs-13 text-dark fw-medium text-nowrap">
              Total <span className="fw-bold">({summary.total})</span>
            </span>
            <span className="fs-13 text-muted text-nowrap">
              Occupancy <span className="fw-bold text-dark">{summary.occupancyPercent}%</span>
            </span>
          </>
        ) : null}
      </div>

      <div className="d-flex flex-column gap-4">
        {data.wards.map((ward) => (
          <div key={ward._id}>
            <h6 className="fw-bold mb-2 mb-md-3" style={{ color: "#1e2a5a" }}>
              {ward.name}
            </h6>
            <div className="d-flex flex-wrap gap-2 gap-md-3">
              {ward.beds.map((bed) => {
                const isSelectable = bed.status === "available";
                const isSelected = selectedBedId === bed._id;
                const style = BED_STATUS_STYLES[bed.status];
                return (
                  <button
                    key={bed._id}
                    type="button"
                    disabled={!isSelectable}
                    onClick={() => isSelectable && onSelectBed(bed)}
                    className="border-0 rounded-2 text-white text-start d-flex flex-column justify-content-center"
                    style={{
                      backgroundColor: style.bg,
                      minWidth: "100px",
                      width: "100px",
                      minHeight: "88px",
                      padding: "10px 12px",
                      cursor: isSelectable ? "pointer" : "not-allowed",
                      opacity: isSelectable ? 1 : 0.92,
                      boxShadow: isSelected
                        ? "0 0 0 3px #1e2a5a, 0 0 0 5px #fff"
                        : undefined,
                      transform: isSelected ? "scale(1.03)" : undefined,
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                    aria-label={`Bed ${bed.bedCode}, ${style.label}`}
                    aria-pressed={isSelected}
                  >
                    <span className="fw-bold fs-14 lh-sm">{bed.bedCode}</span>
                    <span className="fs-12 mt-1 opacity-95 lh-sm">{getBedSubtitle(bed)}</span>
                    {bed.dayLabel ? (
                      <span className="fs-11 mt-1 opacity-90">{bed.dayLabel}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedBedId ? (
        <div className="mt-3 text-center">
          <span
            className="badge ipd-selected-bed-badge fs-13 px-3 py-2"
            style={{ color: "#ffffff", backgroundColor: "#2E37A4" }}
          >
            Selected:{" "}
            {data.wards.flatMap((w) => w.beds).find((b) => b._id === selectedBedId)?.bedCode ??
              selectedBedId}
          </span>
        </div>
      ) : (
        <p className="text-center text-muted fs-13 mb-0 mt-3">
          Select an available (green) bed to continue.
        </p>
      )}
    </div>
  );
};

export default IpdBedSelectionStep;
