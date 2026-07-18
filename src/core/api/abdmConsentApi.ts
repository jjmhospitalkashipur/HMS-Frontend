import axios from "axios";
import { API_BASE_URL } from "@/environment";
import type { TFhirHiType } from "@/core/types/fhirHealthRecord";

export interface IConsentInitParams {
  patientId: string;
  dateRangeFrom: string;
  dateRangeTo: string;
  dataEraseAt: string;
  hiTypes: TFhirHiType[];
  requesterName: string;
}

export interface IConsentCareContext {
  patientReference?: string;
  careContextReference?: string;
}

export interface IConsentListItem {
  consentId: string | null;
  consentRequestId: string | null;
  outboundRequestId: string | null;
  status: string | null;
  purpose: string | null;
  purposeCode: string | null;
  requesterName: string | null;
  hipName: string | null;
  hiTypes: string[];
  dateRangeFrom: string | null;
  dateRangeTo: string | null;
  dataEraseAt: string | null;
  initiatedAt: string | null;
  grantedAt: string | null;
  deniedAt: string | null;
  revokedAt: string | null;
  careContexts: IConsentCareContext[];
}

export interface IConsentStatusResult {
  status: string | null;
  consents: IConsentListItem[];
  abhaAddress: string | null;
  abhaNumber: string | null;
  raw: unknown;
}

const getAxiosMessage = (err: unknown, fallback: string): string => {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data as { message?: unknown; error?: unknown } | undefined;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  return fallback;
};

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const readStatusString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const readOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const readCareContexts = (value: unknown): IConsentCareContext[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asObject(item);
      if (!row) return null;
      return {
        patientReference: readOptionalString(row.patientReference) ?? undefined,
        careContextReference: readOptionalString(row.careContextReference) ?? undefined,
      };
    })
    .filter((item): item is IConsentCareContext => Boolean(item));
};

const mapConsentItem = (value: unknown): IConsentListItem | null => {
  const consent = asObject(value);
  if (!consent) return null;

  const detail = asObject(consent.consentDetail);
  const purposeObj = asObject(detail?.purpose);
  const hip = asObject(detail?.hip);
  const permission = asObject(detail?.permission);
  const dateRange = asObject(permission?.dateRange);

  return {
    consentId:
      readOptionalString(consent.consentId) ||
      readOptionalString(detail?.consentId) ||
      null,
    consentRequestId: readOptionalString(consent.consentRequestId),
    outboundRequestId: readOptionalString(consent.outboundRequestId),
    status: readStatusString(consent.status) || readStatusString(consent.consentStatus),
    purpose:
      readOptionalString(consent.purpose) ||
      readOptionalString(purposeObj?.text) ||
      null,
    purposeCode:
      readOptionalString(consent.purposeCode) ||
      readOptionalString(purposeObj?.code) ||
      null,
    requesterName: readOptionalString(consent.requesterName),
    hipName: readOptionalString(hip?.name),
    hiTypes: readStringArray(consent.hiTypes).length
      ? readStringArray(consent.hiTypes)
      : readStringArray(detail?.hiTypes),
    dateRangeFrom:
      readOptionalString(consent.dateRangeFrom) ||
      readOptionalString(dateRange?.from) ||
      null,
    dateRangeTo:
      readOptionalString(consent.dateRangeTo) ||
      readOptionalString(dateRange?.to) ||
      null,
    dataEraseAt:
      readOptionalString(consent.dataEraseAt) ||
      readOptionalString(permission?.dataEraseAt) ||
      null,
    initiatedAt: readOptionalString(consent.initiatedAt),
    grantedAt: readOptionalString(consent.grantedAt),
    deniedAt: readOptionalString(consent.deniedAt),
    revokedAt: readOptionalString(consent.revokedAt),
    careContexts: readCareContexts(detail?.careContexts),
  };
};

export const extractConsents = (payload: unknown): IConsentListItem[] => {
  const root = asObject(payload);
  if (!root) return [];

  const data = asObject(root.data) ?? root;
  const candidates: unknown[] = [];

  if (Array.isArray(data.hiuConsents)) candidates.push(...data.hiuConsents);
  if (Array.isArray(data.consents)) candidates.push(...data.consents);
  if (data.hiuConsent) candidates.push(data.hiuConsent);
  if (data.consent) candidates.push(data.consent);

  const mapped = candidates
    .map((item) => mapConsentItem(item))
    .filter((item): item is IConsentListItem => Boolean(item));

  const seen = new Set<string>();
  return mapped.filter((item) => {
    const key =
      item.consentId ||
      item.consentRequestId ||
      item.outboundRequestId ||
      `${item.status ?? ""}-${item.initiatedAt ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const extractConsentStatus = (payload: unknown): string | null => {
  const consents = extractConsents(payload);
  if (consents.length) {
    const granted = consents.find(
      (item) => item.status?.trim().toUpperCase() === "GRANTED"
    );
    if (granted?.status) return granted.status;
    return consents[0]?.status ?? null;
  }

  const root = asObject(payload);
  if (!root) return null;
  const data = asObject(root.data) ?? root;
  return readStatusString(data.status) || readStatusString(root.status) || null;
};

export const isConsentGranted = (status: string | null | undefined): boolean =>
  status?.trim().toUpperCase() === "GRANTED";

export const validateConsentInitFields = (params: IConsentInitParams): string | null => {
  if (!params.patientId?.trim()) return "Patient ID is required.";
  if (!params.dateRangeFrom?.trim()) return "Please select date range from.";
  if (!params.dateRangeTo?.trim()) return "Please select date range to.";
  if (!params.dataEraseAt?.trim()) return "Please select data erase date.";
  if (!params.hiTypes?.length) return "Please select at least one HI type.";
  if (!params.requesterName?.trim()) return "Requester name is required.";

  const from = new Date(params.dateRangeFrom);
  const to = new Date(params.dateRangeTo);
  const eraseAt = new Date(params.dataEraseAt);

  if (Number.isNaN(from.getTime())) return "Invalid date range from.";
  if (Number.isNaN(to.getTime())) return "Invalid date range to.";
  if (Number.isNaN(eraseAt.getTime())) return "Invalid data erase date.";
  if (from > to) return "Date range from must be before date range to.";
  if (eraseAt < to) return "Data erase date must be on or after date range to.";

  return null;
};

export const initConsent = async (params: IConsentInitParams): Promise<unknown> => {
  if (!API_BASE_URL) throw new Error("API base URL is not configured.");

  try {
    const res = await axios.post(`${API_BASE_URL}/hospital/abdm/m3/consent/init`, {
      patientId: params.patientId.trim(),
      dateRangeFrom: params.dateRangeFrom,
      dateRangeTo: params.dateRangeTo,
      dataEraseAt: params.dataEraseAt,
      hiTypes: params.hiTypes,
      requesterName: params.requesterName.trim(),
    });
    return res.data?.data ?? res.data;
  } catch (err: unknown) {
    throw new Error(getAxiosMessage(err, "Failed to initiate consent request."));
  }
};

export const getConsentStatus = async (patientId: string): Promise<IConsentStatusResult> => {
  if (!API_BASE_URL) throw new Error("API base URL is not configured.");
  if (!patientId?.trim()) {
    return { status: null, consents: [], abhaAddress: null, abhaNumber: null, raw: null };
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/hospital/abdm/m3/consent`, {
      params: { patientId: patientId.trim() },
    });
    const payload = res.data;
    const data = asObject(asObject(payload)?.data) ?? asObject(payload);
    return {
      status: extractConsentStatus(payload),
      consents: extractConsents(payload),
      abhaAddress: readOptionalString(data?.abhaAddress),
      abhaNumber: readOptionalString(data?.abhaNumber),
      raw: payload,
    };
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return {
        status: null,
        consents: [],
        abhaAddress: null,
        abhaNumber: null,
        raw: err.response?.data ?? null,
      };
    }
    throw new Error(getAxiosMessage(err, "Failed to fetch consent status."));
  }
};

export const getConsentStatusBadgeClass = (status: string | null): string => {
  const normalized = status?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return "badge-soft-secondary border-secondary text-secondary";
  }
  if (
    ["granted", "approved", "active", "completed", "success"].some((value) =>
      normalized.includes(value)
    )
  ) {
    return "badge-soft-success border-success text-success";
  }
  if (
    ["denied", "rejected", "expired", "revoked", "failed", "error"].some((value) =>
      normalized.includes(value)
    )
  ) {
    return "badge-soft-danger border-danger text-danger";
  }
  if (
    ["requested", "pending", "initiated", "in-progress", "inprogress", "processing"].some(
      (value) => normalized.includes(value)
    )
  ) {
    return "badge-soft-warning border-warning text-warning";
  }
  return "badge-soft-info border-info text-info";
};
