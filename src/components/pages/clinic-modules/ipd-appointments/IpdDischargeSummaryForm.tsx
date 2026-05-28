"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import ImageWithBasePath from "@/core/imageWithBasePath";
import {
  buildDischargeSummaryPayload,
  emptyDischargeSummaryForm,
  normalizeDischargeSummaryFromApi,
  type IDischargeSummaryFormState,
} from "@/components/pages/clinic-modules/ipd-appointments/ipdDischargeSummaryTypes";

interface IProps {
  ipdId: string;
  ipdStatus?: string;
  initialSummary?: unknown;
  open: boolean;
  onClose: () => void;
  onDischargeComplete?: () => void;
}

const LABEL_CLASS = "form-label mb-1 fw-medium text-dark fs-14";

const OFFCANVAS_STYLE = {
  visibility: "visible" as const,
  width: "min(900px, 100vw - 1rem)",
  zIndex: 1045,
  top: 0,
  right: 0,
  height: "100vh",
};
const COMPACT_TEXTAREA_STYLE = {
  minHeight: "38px",
  resize: "vertical" as const,
};

const getAxiosMessage = (err: unknown, fallback: string) => {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data as
    | {
        message?: unknown;
        data?: { error?: { message?: unknown } };
      }
    | undefined;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  const nestedMessage = data?.data?.error?.message;
  if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;
  return fallback;
};

const IpdDischargeSummaryForm = ({
  ipdId,
  ipdStatus,
  initialSummary,
  open,
  onClose,
  onDischargeComplete,
}: IProps) => {
  const [form, setForm] = useState<IDischargeSummaryFormState>(emptyDischargeSummaryForm);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingFinal, setSavingFinal] = useState(false);
  const [showFinalConfirmDialog, setShowFinalConfirmDialog] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "danger"; text: string } | null>(
    null
  );

  const isDischarged =
    ipdStatus === "Completed" ||
    ipdStatus === "Discharged" ||
    ipdStatus?.toLowerCase() === "discharged";

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const normalized = normalizeDischargeSummaryFromApi(initialSummary);
      if (normalized) {
        setForm(normalized);
        return;
      }
      setForm(emptyDischargeSummaryForm());
    } finally {
      setLoading(false);
    }
  }, [initialSummary]);

  useEffect(() => {
    if (!open) return;
    setFeedback(null);
    void loadSummary();
  }, [open, loadSummary]);

  const handleSaveDraft = async () => {
    if (!API_BASE_URL || !ipdId) return;
    if (!form.dischargeDate) {
      setFeedback({ type: "danger", text: "Discharge date is required." });
      return;
    }
    try {
      setSavingDraft(true);
      setFeedback(null);
      const payload = buildDischargeSummaryPayload(form);
      const res = await axios.put(
        `${API_BASE_URL}/hospital/ipd/${ipdId}/discharge-summary`,
        payload
      );
      if (res.data?.code === 200 || (res.status >= 200 && res.status < 300)) {
        onDischargeComplete?.();
        onClose();
      } else {
        setFeedback({
          type: "danger",
          text: res.data?.message ?? "Failed to save discharge summary draft.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "danger",
        text: getAxiosMessage(err, "Failed to save discharge summary draft."),
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSaveFinal = async () => {
    if (!API_BASE_URL || !ipdId) return;
    if (!form.dischargeDate) {
      setFeedback({ type: "danger", text: "Discharge date is required." });
      return;
    }
    setShowFinalConfirmDialog(true);
  };

  const handleConfirmSaveFinal = async () => {
    if (!API_BASE_URL || !ipdId) return;
    try {
      setSavingFinal(true);
      setShowFinalConfirmDialog(false);
      setFeedback(null);
      const payload = buildDischargeSummaryPayload(form);
      await axios.put(`${API_BASE_URL}/hospital/ipd/${ipdId}/discharge-summary`, payload);
      const res = await axios.post(`${API_BASE_URL}/hospital/ipd/${ipdId}/discharge`, payload);
      if (res.data?.code === 200 || (res.status >= 200 && res.status < 300)) {
        setFeedback({
          type: "success",
          text: res.data?.message ?? "Patient discharged successfully.",
        });
        onDischargeComplete?.();
        onClose();
      } else {
        setFeedback({
          type: "danger",
          text: res.data?.message ?? "Failed to complete discharge.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "danger",
        text: getAxiosMessage(err, "Failed to complete discharge."),
      });
    } finally {
      setSavingFinal(false);
    }
  };

  const updateField = <K extends keyof IDischargeSummaryFormState>(
    key: K,
    value: IDischargeSummaryFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addFinalDiagnosis = () => {
    setForm((prev) => ({
      ...prev,
      finalDiagnosis: [...prev.finalDiagnosis, { icdCode: "", diagnosisName: "" }],
    }));
  };

  const removeFinalDiagnosis = (index: number) => {
    setForm((prev) => ({
      ...prev,
      finalDiagnosis:
        prev.finalDiagnosis.length > 1
          ? prev.finalDiagnosis.filter((_, i) => i !== index)
          : [{ icdCode: "", diagnosisName: "" }],
    }));
  };

  const addMedicine = () => {
    setForm((prev) => ({
      ...prev,
      medicinesOnDischarge: [
        ...prev.medicinesOnDischarge,
        { medicineName: "", duration: "", dosage: "", instructions: "" },
      ],
    }));
  };

  const removeMedicine = (index: number) => {
    setForm((prev) => ({
      ...prev,
      medicinesOnDischarge:
        prev.medicinesOnDischarge.length > 1
          ? prev.medicinesOnDischarge.filter((_, i) => i !== index)
          : [{ medicineName: "", duration: "", dosage: "", instructions: "" }],
    }));
  };

  if (!open) return null;

  return (
    <>
      {showFinalConfirmDialog ? (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="final_discharge_confirm_title"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFinalConfirmDialog(false);
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
                  <span className="avatar avatar-lg bg-warning text-white">
                    <i className="ti ti-alert-triangle fs-24" aria-hidden />
                  </span>
                </div>
                <h5 id="final_discharge_confirm_title" className="fw-bold mb-1">
                  Save final discharge?
                </h5>
                <p className="mb-3 text-muted small">
                  This will complete the IPD admission and cannot be undone from this form.
                </p>
                <div className="d-flex justify-content-center flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowFinalConfirmDialog(false)}
                    disabled={savingFinal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmSaveFinal}
                    disabled={savingFinal}
                  >
                    {savingFinal ? "Saving…" : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ zIndex: 1040, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        aria-hidden
        onClick={onClose}
      />
      <div
        className="offcanvas offcanvas-end show position-fixed d-flex flex-column"
        style={OFFCANVAS_STYLE}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
        aria-labelledby="ipd-discharge-summary-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="offcanvas-header border-bottom flex-shrink-0">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h5 id="ipd-discharge-summary-title" className="offcanvas-title fw-bold text-dark mb-0">
              Discharge Summary
            </h5>
            {isDischarged ? (
              <span className="badge badge-soft-success">Discharged</span>
            ) : null}
          </div>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>

        <div className="offcanvas-body overflow-y-auto flex-grow-1 text-dark">
          {loading ? (
            <div className="text-center text-muted py-4">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Loading discharge summary…
            </div>
          ) : (
            <>
              {feedback ? (
                <div
                  className={`alert alert-${feedback.type === "success" ? "success" : "danger"} py-2 fs-14 mb-3`}
                  role="alert"
                >
                  {feedback.text}
                </div>
              ) : null}

              <fieldset disabled={isDischarged || savingDraft || savingFinal}>
                <div className="row g-2 mb-2">
                  <div className="col-sm-6 col-12">
                    <label className={LABEL_CLASS} htmlFor="ipd-discharge-date">
                      Discharge Date<span className="text-danger">*</span>
                    </label>
                    <input
                      id="ipd-discharge-date"
                      type="date"
                      className="form-control"
                      value={form.dischargeDate}
                      onChange={(e) => updateField("dischargeDate", e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6 col-12">
                    <label className={LABEL_CLASS} htmlFor="ipd-condition-on-discharge">
                      Condition on Discharge
                    </label>
                    <input
                      id="ipd-condition-on-discharge"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Stable"
                      value={form.conditionOnDischarge}
                      onChange={(e) => updateField("conditionOnDischarge", e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className={LABEL_CLASS} htmlFor="ipd-clinical-summary">
                    Clinical Summary
                  </label>
                  <textarea
                    id="ipd-clinical-summary"
                    className="form-control"
                    rows={1}
                    style={COMPACT_TEXTAREA_STYLE}
                    value={form.clinicalSummary}
                    onChange={(e) => updateField("clinicalSummary", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className={LABEL_CLASS} htmlFor="ipd-provisional-diagnosis">
                    Provisional Diagnosis
                  </label>
                  <input
                    id="ipd-provisional-diagnosis"
                    type="text"
                    className="form-control"
                    value={form.provisionalDiagnosis}
                    onChange={(e) => updateField("provisionalDiagnosis", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className={`${LABEL_CLASS} mb-0`}>Final Diagnosis</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary py-0 px-2"
                      onClick={addFinalDiagnosis}
                    >
                      <i className="ti ti-plus me-1" />
                      Add
                    </button>
                  </div>
                  {form.finalDiagnosis.map((row, index) => (
                    <div className="row g-2 mb-2 align-items-end" key={`diag-${index}`}>
                      <div className="col-4 col-sm-3">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="ICD code"
                          value={row.icdCode}
                          onChange={(e) => {
                            const next = [...form.finalDiagnosis];
                            next[index] = { ...next[index], icdCode: e.target.value };
                            updateField("finalDiagnosis", next);
                          }}
                          aria-label={`ICD code ${index + 1}`}
                        />
                      </div>
                      <div className="col">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Diagnosis name"
                          value={row.diagnosisName}
                          onChange={(e) => {
                            const next = [...form.finalDiagnosis];
                            next[index] = { ...next[index], diagnosisName: e.target.value };
                            updateField("finalDiagnosis", next);
                          }}
                          aria-label={`Diagnosis name ${index + 1}`}
                        />
                      </div>
                      <div className="col-auto">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFinalDiagnosis(index)}
                          aria-label="Remove diagnosis row"
                        >
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <label className={LABEL_CLASS} htmlFor="ipd-course-in-hospital">
                    Course in Hospital
                  </label>
                  <textarea
                    id="ipd-course-in-hospital"
                    className="form-control"
                    rows={1}
                    style={COMPACT_TEXTAREA_STYLE}
                    value={form.courseInHospital}
                    onChange={(e) => updateField("courseInHospital", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className={LABEL_CLASS} htmlFor="ipd-treatment-given">
                    Treatment Given
                  </label>
                  <textarea
                    id="ipd-treatment-given"
                    className="form-control"
                    rows={1}
                    style={COMPACT_TEXTAREA_STYLE}
                    value={form.treatmentGiven}
                    onChange={(e) => updateField("treatmentGiven", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className={`${LABEL_CLASS} mb-0`}>Medicines on Discharge</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary py-0 px-2"
                      onClick={addMedicine}
                    >
                      <i className="ti ti-plus me-1" />
                      Add
                    </button>
                  </div>
                  {form.medicinesOnDischarge.map((med, index) => (
                    <div className="border rounded p-2 mb-2 bg-light" key={`med-${index}`}>
                      <div className="row g-2 align-items-center">
                        <div className="col-12 col-md-5">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Medicine name"
                            value={med.medicineName}
                            onChange={(e) => {
                              const next = [...form.medicinesOnDischarge];
                              next[index] = { ...next[index], medicineName: e.target.value };
                              updateField("medicinesOnDischarge", next);
                            }}
                          />
                        </div>
                        <div className="col-6 col-md-3">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Duration"
                            value={med.duration}
                            onChange={(e) => {
                              const next = [...form.medicinesOnDischarge];
                              next[index] = { ...next[index], duration: e.target.value };
                              updateField("medicinesOnDischarge", next);
                            }}
                          />
                        </div>
                        <div className="col-6 col-md-3">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Dosage (e.g. 1-0-1)"
                            value={med.dosage}
                            onChange={(e) => {
                              const next = [...form.medicinesOnDischarge];
                              next[index] = { ...next[index], dosage: e.target.value };
                              updateField("medicinesOnDischarge", next);
                            }}
                          />
                        </div>
                        <div className="col-auto ms-md-auto">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeMedicine(index)}
                            aria-label="Remove medicine"
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                        <div className="col-12">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Instructions (optional)"
                            value={med.instructions ?? ""}
                            onChange={(e) => {
                              const next = [...form.medicinesOnDischarge];
                              next[index] = { ...next[index], instructions: e.target.value };
                              updateField("medicinesOnDischarge", next);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <label className={LABEL_CLASS} htmlFor="ipd-advice-on-discharge">
                    Advice on Discharge
                  </label>
                  <textarea
                    id="ipd-advice-on-discharge"
                    className="form-control"
                    rows={1}
                    style={COMPACT_TEXTAREA_STYLE}
                    placeholder="Enter advice for the patient on discharge"
                    value={form.adviceOnDischarge}
                    onChange={(e) => updateField("adviceOnDischarge", e.target.value)}
                  />
                </div>

                <div className="mb-0">
                  <label className={LABEL_CLASS} htmlFor="ipd-follow-up">
                    Follow Up
                  </label>
                  <textarea
                    id="ipd-follow-up"
                    className="form-control"
                    rows={1}
                    style={COMPACT_TEXTAREA_STYLE}
                    value={form.followUp}
                    onChange={(e) => updateField("followUp", e.target.value)}
                  />
                </div>
              </fieldset>
            </>
          )}
        </div>

        {!loading && !isDischarged ? (
          <div className="offcanvas-footer border-top d-flex flex-wrap justify-content-end gap-2 p-3 flex-shrink-0">
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
              disabled={savingDraft || savingFinal}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleSaveDraft}
              disabled={savingDraft || savingFinal}
            >
              {savingDraft ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                  Saving draft…
                </>
              ) : (
                "Save as Draft"
              )}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveFinal}
              disabled={savingDraft || savingFinal}
            >
              {savingFinal ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                  Discharging…
                </>
              ) : (
                "Save Final Discharge"
              )}
            </button>
          </div>
        ) : null}

        {!loading && isDischarged ? (
          <div className="offcanvas-footer border-top d-flex justify-content-end p-3 flex-shrink-0">
            <button type="button" className="btn btn-light" onClick={onClose}>
              Close
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default IpdDischargeSummaryForm;
