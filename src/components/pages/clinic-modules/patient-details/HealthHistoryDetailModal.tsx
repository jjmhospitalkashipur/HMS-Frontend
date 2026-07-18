"use client";

import type { CSSProperties, ReactNode } from "react";
import dayjs from "dayjs";

interface IHealthHistoryDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: Record<string, unknown> | null;
  title?: string;
}

const OFFCANVAS_STYLE: CSSProperties = {
  visibility: "visible",
  width: "min(720px, 100vw - 1rem)",
  zIndex: 1045,
  top: 0,
  right: 0,
  height: "100vh",
};

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const readString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const readCodeableText = (value: unknown): string | null => {
  const obj = asObject(value);
  if (!obj) return null;
  const text = readString(obj.text);
  if (text) return text;
  if (Array.isArray(obj.coding)) {
    for (const codingItem of obj.coding) {
      const coding = asObject(codingItem);
      const display = readString(coding?.display);
      if (display) return display;
      const code = readString(coding?.code);
      if (code) return code;
    }
  }
  return null;
};

const readHumanName = (resource: Record<string, unknown> | null): string | null => {
  if (!resource) return null;
  if (Array.isArray(resource.name)) {
    for (const nameItem of resource.name) {
      const nameObj = asObject(nameItem);
      const text = readString(nameObj?.text);
      if (text) return text;
    }
  }
  return readString(resource.name);
};

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD MMM YYYY, HH:mm") : value;
};

const getResources = (item: Record<string, unknown>): Record<string, unknown>[] => {
  const fhirBundle = asObject(item.fhirBundle);
  if (!fhirBundle || !Array.isArray(fhirBundle.entry)) return [];
  return fhirBundle.entry
    .map((entryItem) => asObject(asObject(entryItem)?.resource))
    .filter((resource): resource is Record<string, unknown> => Boolean(resource));
};

const findByType = (
  resources: Record<string, unknown>[],
  resourceType: string
): Record<string, unknown> | null =>
  resources.find((item) => readString(item.resourceType) === resourceType) ?? null;

const filterByType = (
  resources: Record<string, unknown>[],
  resourceType: string
): Record<string, unknown>[] =>
  resources.filter((item) => readString(item.resourceType) === resourceType);

interface IDetailRowProps {
  label: string;
  value?: string | null;
}

const DetailRow = ({ label, value }: IDetailRowProps) => {
  if (!value?.trim()) return null;
  return (
    <div className="col-12 col-md-6">
      <span className="text-muted fs-12 d-block mb-1">{label}</span>
      <span className="text-dark fw-medium fs-14">{value}</span>
    </div>
  );
};

interface ISectionCardProps {
  title: string;
  children: ReactNode;
}

const SectionCard = ({ title, children }: ISectionCardProps) => (
  <div className="border rounded-3 mb-3 overflow-hidden">
    <div className="bg-light px-3 py-2 border-bottom">
      <h6 className="fw-bold mb-0 text-dark fs-14">{title}</h6>
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const HealthHistoryDetailModal = ({
  open,
  onClose,
  item,
  title = "Health History Details",
}: IHealthHistoryDetailModalProps) => {
  if (!open || !item) return null;

  const resources = getResources(item);
  const composition = findByType(resources, "Composition");
  const patient = findByType(resources, "Patient");
  const practitioner = findByType(resources, "Practitioner");
  const organization = findByType(resources, "Organization");
  const encounter = findByType(resources, "Encounter");
  const carePlans = filterByType(resources, "CarePlan");
  const conditions = filterByType(resources, "Condition");
  const allergies = filterByType(resources, "AllergyIntolerance");
  const observations = filterByType(resources, "Observation");
  const familyHistory = filterByType(resources, "FamilyMemberHistory");
  const medications = filterByType(resources, "MedicationRequest");

  const fhirBundle = asObject(item.fhirBundle);
  const documentTitle =
    readString(composition?.title) ||
    readCodeableText(composition?.type) ||
    title;
  const documentType = readCodeableText(composition?.type);
  const documentDate =
    readString(composition?.date) ||
    readString(fhirBundle?.timestamp) ||
    readString(asObject(fhirBundle?.meta)?.lastUpdated);
  const documentStatus = readString(composition?.status);

  const patientName = readHumanName(patient);
  const patientGender = readString(patient?.gender);
  const patientPhone = Array.isArray(patient?.telecom)
    ? readString(asObject(patient.telecom[0])?.value)
    : null;
  const patientMrd = Array.isArray(patient?.identifier)
    ? readString(asObject(patient.identifier[0])?.value)
    : null;
  const patientAddress = Array.isArray(patient?.address)
    ? readString(asObject(patient.address[0])?.text)
    : null;

  const encounterClassObj = asObject(encounter?.class);
  const encounterClass =
    readString(encounterClassObj?.display) || readString(encounterClassObj?.code);
  const encounterPeriod = asObject(encounter?.period);
  const encounterStart = readString(encounterPeriod?.start);
  const encounterEnd = readString(encounterPeriod?.end);
  const encounterId = Array.isArray(encounter?.identifier)
    ? readString(asObject(encounter.identifier[0])?.value)
    : null;

  const dischargeDisposition = readCodeableText(
    asObject(asObject(encounter?.hospitalization)?.dischargeDisposition)
  );

  return (
    <>
      <div
        className="offcanvas-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
        aria-hidden="true"
      />
      <div
        className="offcanvas offcanvas-end show d-flex flex-column"
        style={OFFCANVAS_STYLE}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="health_history_detail_title"
      >
        <div className="offcanvas-header border-bottom flex-shrink-0">
          <div>
            <h5 id="health_history_detail_title" className="offcanvas-title fw-bold text-dark mb-1">
              {documentTitle}
            </h5>
            {documentType && documentType !== documentTitle ? (
              <span className="text-muted fs-13">{documentType}</span>
            ) : null}
          </div>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>

        <div className="offcanvas-body overflow-auto flex-grow-1">
          <SectionCard title="Document">
            <div className="row g-3">
              <DetailRow label="Status" value={documentStatus} />
              <DetailRow label="Date" value={formatDate(documentDate)} />
            </div>
          </SectionCard>

          {(patientName || patientMrd || patientPhone || patientGender || patientAddress) && (
            <SectionCard title="Patient">
              <div className="row g-3">
                <DetailRow label="Name" value={patientName} />
                <DetailRow label="MRD" value={patientMrd} />
                <DetailRow label="Gender" value={patientGender} />
                <DetailRow label="Phone" value={patientPhone} />
                <DetailRow label="Address" value={patientAddress} />
              </div>
            </SectionCard>
          )}

          {(readHumanName(practitioner) || readString(organization?.name)) && (
            <SectionCard title="Care Team">
              <div className="row g-3">
                <DetailRow label="Doctor" value={readHumanName(practitioner)} />
                <DetailRow label="Department" value={readString(organization?.name)} />
              </div>
            </SectionCard>
          )}

          {encounter ? (
            <SectionCard title="Encounter">
              <div className="row g-3">
                <DetailRow label="Encounter ID" value={encounterId} />
                <DetailRow label="Status" value={readString(encounter.status)} />
                <DetailRow label="Class" value={encounterClass} />
                <DetailRow
                  label="Period"
                  value={
                    encounterStart || encounterEnd
                      ? `${encounterStart ? dayjs(encounterStart).format("DD MMM YYYY") : "—"} – ${encounterEnd ? dayjs(encounterEnd).format("DD MMM YYYY") : "—"}`
                      : null
                  }
                />
                <DetailRow label="Discharge Disposition" value={dischargeDisposition} />
              </div>
            </SectionCard>
          ) : null}

          {conditions.length > 0 ? (
            <SectionCard title="Conditions / Complaints">
              <ul className="list-unstyled mb-0">
                {conditions.map((condition, index) => {
                  const text =
                    readCodeableText(condition.code) ||
                    readString(asObject(condition.text)?.div)?.replace(/<[^>]+>/g, "") ||
                    "—";
                  const status = readCodeableText(condition.clinicalStatus);
                  return (
                    <li
                      key={readString(condition.id) || `condition-${index}`}
                      className="d-flex align-items-start justify-content-between gap-2 py-2 border-bottom border-light"
                    >
                      <span className="text-dark fs-14">{text}</span>
                      {status ? (
                        <span className="badge badge-soft-primary text-capitalize">{status}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          ) : null}

          {allergies.length > 0 ? (
            <SectionCard title="Allergies">
              <ul className="list-unstyled mb-0">
                {allergies.map((allergy, index) => (
                  <li
                    key={readString(allergy.id) || `allergy-${index}`}
                    className="text-dark fs-14 py-2 border-bottom border-light"
                  >
                    {readCodeableText(allergy.code) || "—"}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {observations.length > 0 ? (
            <SectionCard title="Observations">
              <ul className="list-unstyled mb-0">
                {observations.map((observation, index) => {
                  const label = readCodeableText(observation.code) || "Observation";
                  const value =
                    readString(observation.valueString) ||
                    readString(asObject(observation.valueQuantity)?.value) ||
                    "—";
                  return (
                    <li
                      key={readString(observation.id) || `observation-${index}`}
                      className="d-flex align-items-start justify-content-between gap-2 py-2 border-bottom border-light"
                    >
                      <span className="text-muted fs-14">{label}</span>
                      <span className="text-dark fw-medium fs-14 text-end">{value}</span>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          ) : null}

          {familyHistory.length > 0 ? (
            <SectionCard title="Family History">
              <ul className="list-unstyled mb-0">
                {familyHistory.map((history, index) => {
                  const note = Array.isArray(history.note)
                    ? readString(asObject(history.note[0])?.text)
                    : null;
                  return (
                    <li
                      key={readString(history.id) || `family-${index}`}
                      className="text-dark fs-14 py-2 border-bottom border-light"
                    >
                      {note || "—"}
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          ) : null}

          {medications.length > 0 ? (
            <SectionCard title="Medications">
              <ul className="list-unstyled mb-0">
                {medications.map((medication, index) => {
                  const medCode =
                    readCodeableText(asObject(medication.medicationCodeableConcept)) ||
                    readString(asObject(medication.medicationReference)?.display) ||
                    "Medication";
                  return (
                    <li
                      key={readString(medication.id) || `med-${index}`}
                      className="text-dark fs-14 py-2 border-bottom border-light"
                    >
                      {medCode}
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          ) : null}

          {carePlans.length > 0 ? (
            <SectionCard title="Care Plan / Advice">
              <ul className="list-unstyled mb-0">
                {carePlans.map((plan, index) => (
                  <li
                    key={readString(plan.id) || `careplan-${index}`}
                    className="text-dark fs-14 py-2 border-bottom border-light"
                  >
                    {readString(plan.description) || "—"}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {!resources.length ? (
            <p className="text-muted mb-0">No structured health record details available.</p>
          ) : null}
        </div>

        <div className="offcanvas-footer border-top flex-shrink-0 p-3 d-flex justify-content-end">
          <button type="button" className="btn btn-light" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default HealthHistoryDetailModal;
