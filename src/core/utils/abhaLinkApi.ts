import axios from "axios";
import dayjs from "dayjs";

export type IAbhaLinkVisitType = "OPD" | "Daycare" | "IPD";

export interface IAbhaLinkParams {
  abhaAddress: string;
  abhaNumber: string;
  name: string;
  gender?: string;
  dob?: dayjs.Dayjs | Date | string | null;
  ageYears?: string | number;
  visitType: IAbhaLinkVisitType;
}

const HOSPITAL_DISPLAY = "JJM Hospital Kashipur";

const VISIT_CONFIG: Record<IAbhaLinkVisitType, { display: string; hiType: string }> = {
  OPD: { display: "visit", hiType: "OPConsultation" },
  Daycare: { display: "daycare", hiType: "OPConsultation" },
  IPD: { display: "ipd", hiType: "OPConsultation" },
};

export const mapGenderToAbdm = (gender?: string): string => {
  const g = gender?.trim().toLowerCase();
  if (g === "male") return "M";
  if (g === "female") return "F";
  if (g === "others") return "O";
  return "";
};

export const resolveYearOfBirth = (
  dob?: dayjs.Dayjs | Date | string | null,
  ageYears?: string | number
): string => {
  if (dob) {
    const d = dayjs.isDayjs(dob) ? dob : dayjs(dob);
    if (d.isValid()) return d.format("YYYY");
  }
  const age =
    typeof ageYears === "number" ? ageYears : parseInt(String(ageYears ?? ""), 10);
  if (Number.isFinite(age) && age > 0) {
    return String(new Date().getFullYear() - age);
  }
  return "";
};

const generateUuid = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const validateAbhaLinkFields = (params: {
  enabled: boolean;
  abhaAddress: string;
  abhaNumber: string;
  name: string;
  gender?: string;
  dob?: dayjs.Dayjs | Date | string | null;
  ageYears?: string | number;
}): string | null => {
  if (!params.enabled) return null;
  if (!params.abhaAddress.trim()) return "Please enter ABHA address.";
  if (!params.abhaNumber.trim()) return "Please enter ABHA number.";
  if (!params.name.trim()) return "Patient name is required to link ABHA.";
  if (!mapGenderToAbdm(params.gender)) {
    return "Please select a valid gender to link ABHA.";
  }
  if (!resolveYearOfBirth(params.dob, params.ageYears)) {
    return "Date of birth or age is required to link ABHA.";
  }
  return null;
};

export const linkAbhaSingle = async (
  apiBaseUrl: string,
  params: IAbhaLinkParams
): Promise<void> => {
  const config = VISIT_CONFIG[params.visitType];
  await axios.post(`${apiBaseUrl}/hospital/abdm/m2/link/single`, {
    abhaAddress: params.abhaAddress.trim(),
    abhaNumber: params.abhaNumber.trim(),
    name: params.name.trim(),
    gender: mapGenderToAbdm(params.gender),
    yearOfBirth: resolveYearOfBirth(params.dob, params.ageYears),
    patient: [
      {
        referenceNumber: generateUuid(),
        display: HOSPITAL_DISPLAY,
        careContexts: [
          {
            referenceNumber: generateUuid(),
            display: config.display,
          },
        ],
        hiType: config.hiType,
        count: 1,
      },
    ],
  });
};
