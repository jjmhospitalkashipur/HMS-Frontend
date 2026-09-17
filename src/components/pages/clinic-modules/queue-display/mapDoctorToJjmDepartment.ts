export type IJjmDepartmentKey =
  | "physiotherapy"
  | "radiology"
  | "paediatrics"
  | "orthopaedics"
  | "nephrology"
  | "anaesthesiology"
  | "emergency_medicine"
  | "neurosurgery"
  | "general_surgery"
  | "medicine"
  | "obg";

const DEPARTMENT_ALIASES: Array<{ alias: string; key: IJjmDepartmentKey }> = [
  { alias: "emergency medicine", key: "emergency_medicine" },
  { alias: "physical medicine", key: "physiotherapy" },
  { alias: "internal medicine", key: "medicine" },
  { alias: "general medicine", key: "medicine" },
  { alias: "general surgery", key: "general_surgery" },
  { alias: "obstetrics & gynaecology", key: "obg" },
  { alias: "obstetrics and gynaecology", key: "obg" },
  { alias: "obstetrics & gynecology", key: "obg" },
  { alias: "radio diagnosis", key: "radiology" },
  { alias: "physiotherapy", key: "physiotherapy" },
  { alias: "anaesthesiology", key: "anaesthesiology" },
  { alias: "anesthesiology", key: "anaesthesiology" },
  { alias: "anaesthesia", key: "anaesthesiology" },
  { alias: "anesthesia", key: "anaesthesiology" },
  { alias: "neurosurgery", key: "neurosurgery" },
  { alias: "orthopaedics", key: "orthopaedics" },
  { alias: "orthopedics", key: "orthopaedics" },
  { alias: "paediatrics", key: "paediatrics" },
  { alias: "pediatrics", key: "paediatrics" },
  { alias: "paediatric", key: "paediatrics" },
  { alias: "pediatric", key: "paediatrics" },
  { alias: "nephrology", key: "nephrology" },
  { alias: "radiology", key: "radiology" },
  { alias: "gynaecology", key: "obg" },
  { alias: "gynecology", key: "obg" },
  { alias: "obstetrics", key: "obg" },
  { alias: "physio", key: "physiotherapy" },
  { alias: "dialysis", key: "nephrology" },
  { alias: "imaging", key: "radiology" },
  { alias: "trauma", key: "emergency_medicine" },
  { alias: "emergency", key: "emergency_medicine" },
  { alias: "surgeon", key: "general_surgery" },
  { alias: "surgery", key: "general_surgery" },
  { alias: "ortho", key: "orthopaedics" },
  { alias: "medicine", key: "medicine" },
  { alias: "neuro", key: "neurosurgery" },
  { alias: "obg", key: "obg" },
];

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9& ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const mapDoctorToJjmDepartment = (
  ...fields: Array<string | null | undefined>
): IJjmDepartmentKey | null => {
  for (const field of fields) {
    if (!field?.trim()) continue;
    const normalized = normalize(field);

    const exact = DEPARTMENT_ALIASES.find((entry) => entry.alias === normalized);
    if (exact) return exact.key;

    const partial = DEPARTMENT_ALIASES.find(
      (entry) => normalized.includes(entry.alias) || entry.alias.includes(normalized)
    );
    if (partial) return partial.key;
  }

  return null;
};
