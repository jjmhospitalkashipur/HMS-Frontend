"use client";

import { useMemo } from "react";
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
  wardOptions?: IIpdWardOption[];
  selectedWardId?: string | null;
  onWardFilterChange?: (wardId: string | null) => void;
  wardsLoading?: boolean;
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

const formatWardCharge = (charge?: number): string | null => {
  if (charge == null || !Number.isFinite(charge)) return null;
  return `₹${charge.toLocaleString("en-IN")}/day`;
};

const formatWardHeading = (name: string, charge?: number): string => {
  const chargeLabel = formatWardCharge(charge);
  return chargeLabel ? `${name} · ${chargeLabel}` : name;
};

const shellClass = "px-3 px-md-4 pt-3 pb-4 w-100";

const EMPTY_BED_SUMMARY: IIpdBedSummary = {
  total: 0,
  available: 0,
  occupied: 0,
  reserved: 0,
  maintenance: 0,
  occupancyPercent: 0,
};

interface IBedStatusLegendProps {
  summary: IIpdBedSummary;
}

const BedStatusLegend = ({ summary }: IBedStatusLegendProps) => (
  <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 gap-md-3 mb-3">
    {(Object.keys(BED_STATUS_STYLES) as IpdBedStatus[]).map((status) => {
      const style = BED_STATUS_STYLES[status];
      const count = summary[style.countKey] ?? 0;
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
            {style.label} <span className="fw-bold">({count})</span>
          </span>
        </div>
      );
    })}
    <span className="d-none d-md-inline text-muted">|</span>
    <span className="fs-13 text-dark fw-medium text-nowrap">
      Total <span className="fw-bold">({summary.total})</span>
    </span>
    <span className="fs-13 text-muted text-nowrap">
      Occupancy <span className="fw-bold text-dark">{summary.occupancyPercent}%</span>
    </span>
  </div>
);

interface IIpdBedWardFilterProps {
  wardOptions?: IIpdWardOption[];
  selectedWardId?: string | null;
  onWardFilterChange?: (wardId: string | null) => void;
  wardsLoading?: boolean;
}

const wardPillClass = (active: boolean) =>
  `btn btn-sm rounded-pill flex-shrink-0 fs-12 fw-medium px-2 py-1 ${
    active ? "btn-primary" : "btn-outline-primary"
  }`;

export const IpdBedWardFilter = ({
  wardOptions = [],
  selectedWardId = null,
  onWardFilterChange,
  wardsLoading = false,
}: IIpdBedWardFilterProps) => {
  const handleSelect = (wardId: string | null) => {
    if (!onWardFilterChange || wardsLoading) return;
    onWardFilterChange(wardId);
  };

  if (!onWardFilterChange) return null;

  return (
    <div
      className="d-flex flex-nowrap gap-1 gap-sm-2 overflow-auto w-100"
      role="tablist"
      aria-label="Filter by ward"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!selectedWardId}
        disabled={wardsLoading}
        onClick={() => handleSelect(null)}
        className={wardPillClass(!selectedWardId)}
      >
        All
      </button>
      {wardOptions.map((ward) => {
        const isActive = selectedWardId === ward.value;
        return (
          <button
            key={ward.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={wardsLoading}
            onClick={() => handleSelect(ward.value)}
            className={wardPillClass(isActive)}
          >
            {ward.label}
          </button>
        );
      })}
      {wardsLoading ? (
        <span className="d-flex align-items-center px-2 flex-shrink-0">
          <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden />
        </span>
      ) : null}
    </div>
  );
};

const IpdBedSelectionStep = ({
  data,
  loading = false,
  error = "",
  selectedBedId,
  onSelectBed,
  wardOptions = [],
  selectedWardId = null,
  onWardFilterChange,
  wardsLoading = false,
}: IIpdBedSelectionStepProps) => {
  const wardChargeById = useMemo(
    () =>
      Object.fromEntries(
        wardOptions
          .filter((w) => w.chargePerDay != null)
          .map((w) => [w.value, w.chargePerDay as number])
      ),
    [wardOptions]
  );

  const summary = useMemo((): IIpdBedSummary => {
    if (data?.summary) return data.summary;
    if (data?.wards?.length) return computeBedSummary(data.wards);
    return EMPTY_BED_SUMMARY;
  }, [data]);

  const hasWards = (data?.wards?.length ?? 0) > 0;

  return (
    <div className={shellClass}>
      <div className="mb-3">
        <BedStatusLegend summary={summary} />
        <IpdBedWardFilter
          wardOptions={wardOptions}
          selectedWardId={selectedWardId}
          onWardFilterChange={onWardFilterChange}
          wardsLoading={wardsLoading || loading}
        />
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading beds…</span>
          </div>
        </div>
      ) : !hasWards ? (
        <>
          {error ? (
            <div className="alert alert-warning py-2 mb-0">{error}</div>
          ) : (
            <div className="alert alert-info mb-0">No beds available to display.</div>
          )}
        </>
      ) : (
        <>
          {error ? <div className="alert alert-warning py-2 mb-3">{error}</div> : null}
          <div className="d-flex flex-column gap-4">
            {data?.wards.map((ward) => {
          const chargePerDay = ward.chargePerDay ?? wardChargeById[ward._id];

          return (
            <div key={ward._id}>
              <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">
                {formatWardHeading(ward.name, chargePerDay)}
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
                          ? "0 0 0 3px var(--primary), 0 0 0 5px #fff"
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
          );
            })}
          </div>

          {selectedBedId ? (
            <div className="mt-3 text-center">
              <span className="badge badge-soft-primary border border-primary text-primary fs-13 px-3 py-2">
                Selected:{" "}
                {data?.wards
                  .flatMap((w) => w.beds)
                  .find((b) => b._id === selectedBedId)?.bedCode ?? selectedBedId}
              </span>
            </div>
          ) : (
            <p className="text-center text-muted fs-13 mb-0 mt-3">
              Select an available (green) bed to continue.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default IpdBedSelectionStep;
