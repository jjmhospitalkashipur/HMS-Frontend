import axios from "axios";
import { API_BASE_URL } from "@/environment";
import {
  MOCK_IPD_BED_BLOCK_VIEW,
  computeBedSummary,
  normalizeBedStatus,
  type IIpdBed,
  type IIpdBedBlockViewData,
  type IIpdWard,
} from "./ipdBedTypes";

const mapBed = (raw: Record<string, unknown>): IIpdBed => ({
  _id: String(raw._id ?? raw.id ?? raw.bedId ?? ""),
  bedCode: String(raw.bedCode ?? raw.code ?? raw.bedId ?? raw.name ?? "—"),
  status: normalizeBedStatus(raw.status),
  patientName: raw.patientName != null ? String(raw.patientName) : undefined,
  dayLabel: raw.dayLabel != null ? String(raw.dayLabel) : raw.days != null ? `Day ${raw.days}` : undefined,
  conditionLabel:
    raw.conditionLabel != null
      ? String(raw.conditionLabel)
      : raw.condition != null
        ? String(raw.condition)
        : undefined,
});

const mapWard = (raw: Record<string, unknown>): IIpdWard => {
  const bedsRaw = raw.beds ?? raw.bedList;
  const beds = Array.isArray(bedsRaw)
    ? bedsRaw.map((b) => mapBed(b as Record<string, unknown>))
    : [];
  return {
    _id: String(raw._id ?? raw.id ?? raw.name ?? ""),
    name: String(raw.name ?? raw.wardName ?? raw.label ?? "Ward"),
    beds,
  };
};

export const fetchIpdBedBlockView = async (): Promise<IIpdBedBlockViewData> => {
  if (!API_BASE_URL) {
    return MOCK_IPD_BED_BLOCK_VIEW;
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/hospital/beds/block-view`);
    const payload = res.data?.data ?? res.data;
    const wardsRaw = payload?.wards ?? payload?.wardList ?? payload;
    const wards = Array.isArray(wardsRaw)
      ? wardsRaw.map((w) => mapWard(w as Record<string, unknown>))
      : [];

    if (!wards.length) {
      return MOCK_IPD_BED_BLOCK_VIEW;
    }

    const summaryRaw = payload?.summary;
    const summary =
      summaryRaw && typeof summaryRaw === "object"
        ? {
            total: Number((summaryRaw as { total?: number }).total) || 0,
            available: Number((summaryRaw as { available?: number }).available) || 0,
            occupied: Number((summaryRaw as { occupied?: number }).occupied) || 0,
            reserved: Number((summaryRaw as { reserved?: number }).reserved) || 0,
            maintenance: Number((summaryRaw as { maintenance?: number }).maintenance) || 0,
            occupancyPercent:
              Number((summaryRaw as { occupancyPercent?: number }).occupancyPercent) || 0,
          }
        : computeBedSummary(wards);

    return { wards, summary };
  } catch {
    return MOCK_IPD_BED_BLOCK_VIEW;
  }
};
