import axios from "axios";
import { API_BASE_URL } from "@/environment";

export interface IMedicineItem {
  id: string;
  name: string;
}

const asMedicineItem = (value: unknown): IMedicineItem | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const name = String(row.name ?? row.medicineName ?? row.genericName ?? "").trim();
  if (!name) return null;
  const id = String(row._id ?? row.id ?? name).trim();
  return { id, name };
};

const extractMedicineArray = (payload: unknown): IMedicineItem[] => {
  if (Array.isArray(payload)) {
    return payload
      .map(asMedicineItem)
      .filter((item): item is IMedicineItem => item != null);
  }
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  const nested = data.medicines ?? data.items ?? data.records ?? data.results;
  if (Array.isArray(nested)) {
    return nested
      .map(asMedicineItem)
      .filter((item): item is IMedicineItem => item != null);
  }
  return [];
};

export const searchMedicines = async (
  search: string,
  page = 1,
  limit = 20
): Promise<IMedicineItem[]> => {
  if (!API_BASE_URL) throw new Error("API configuration error");
  const trimmed = search.trim();
  if (!trimmed) return [];

  const res = await axios.get(`${API_BASE_URL}/hospital/medicines`, {
    params: { search: trimmed, page, limit },
  });

  const payload = res.data?.data ?? res.data;
  return extractMedicineArray(payload);
};

const getAxiosMessage = (err: unknown, fallback: string): string => {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data as { message?: unknown } | undefined;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  return fallback;
};

export const importMedicinesExcel = async (file: File): Promise<string> => {
  if (!API_BASE_URL) throw new Error("API configuration error");
  if (!file) throw new Error("Please select a file to import.");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.post(`${API_BASE_URL}/hospital/medicines/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const data = res.data as { message?: unknown } | undefined;
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
    return "Medicines imported successfully.";
  } catch (err) {
    throw new Error(getAxiosMessage(err, "Failed to import medicines."));
  }
};
