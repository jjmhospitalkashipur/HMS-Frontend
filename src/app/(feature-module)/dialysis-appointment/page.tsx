"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { all_routes } from "@/routes/all_routes";

const sectionIds = [
  "general-information",
  "pre-dialysis-assessment",
  "dialysis-monitoring",
  "post-dialysis-assessment",
  "complications-during-dialysis",
  "treatment-given",
] as const;

const DialysisAppointmentPage = () => {
  const sectionRefs: Record<(typeof sectionIds)[number], React.RefObject<HTMLDivElement | null>> = {
    "general-information": useRef<HTMLDivElement>(null),
    "pre-dialysis-assessment": useRef<HTMLDivElement>(null),
    "dialysis-monitoring": useRef<HTMLDivElement>(null),
    "post-dialysis-assessment": useRef<HTMLDivElement>(null),
    "complications-during-dialysis": useRef<HTMLDivElement>(null),
    "treatment-given": useRef<HTMLDivElement>(null),
  };

  const handleScrollTo = (id: (typeof sectionIds)[number]) => {
    const target = sectionRefs[id].current;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content dialysis-page">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="fw-bold mb-0">Dialysis Form</h4>
          <Link href={all_routes.appointments} className="btn btn-outline-primary">
            Back to Appointments
          </Link>
        </div>

        <div className="row g-2 dialysis-form-row">
          {/* Left: section navigation */}
          <div className="col-md-2 col-lg-2 mb-2 d-flex">
            <div className="card shadow-sm flex-grow-1 d-flex flex-column">
              <div className="card-header">
                <h6 className="fw-bold mb-0">Sections</h6>
              </div>
              <div className="card-body p-2 flex-grow-1 overflow-y-auto">
                <ul className="list-group list-group-flush">
                  <li
                    className="list-group-item list-group-item-action cursor-pointer"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleScrollTo("general-information")}
                  >
                    General Information
                  </li>
                  <li
                    className="list-group-item list-group-item-action cursor-pointer"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleScrollTo("pre-dialysis-assessment")}
                  >
                    Pre-Dialysis Assessment
                  </li>
                  <li
                    className="list-group-item list-group-item-action cursor-pointer"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleScrollTo("dialysis-monitoring")}
                  >
                    Dialysis Monitoring
                  </li>
                  <li
                    className="list-group-item list-group-item-action cursor-pointer"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleScrollTo("post-dialysis-assessment")}
                  >
                    Post Dialysis Assessment
                  </li>
                  <li
                    className="list-group-item list-group-item-action cursor-pointer"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleScrollTo("complications-during-dialysis")}
                  >
                    Complications During Dialysis
                  </li>
                  <li
                    className="list-group-item list-group-item-action cursor-pointer"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleScrollTo("treatment-given")}
                  >
                    Treatment Given
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right: dialysis form sections */}
          <div className="col-md-10 col-lg-10 d-flex">
            <div className="card shadow-sm flex-grow-1 d-flex flex-column min-h-0">
              <div className="card-body flex-grow-1 overflow-y-auto" style={{ minHeight: "75vh", maxHeight: "85vh" }}>
                {/* General Information */}
                <div ref={sectionRefs["general-information"]} id="general-information" className="mb-4">
                  <h5 className="fw-bold mb-3">General Information</h5>
                  <div className="border rounded p-3">
                    <div className="row g-2">
                      {/* Row 1 */}
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Machine Number</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">UHID</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Technician Name</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Fiber Volume</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>

                      {/* Row 2 */}
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Heparin Use</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Pre HD Weight Today</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Last Post HD Weight</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Weight Gain</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>

                      {/* Row 3 */}
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Target Weight Loss</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Post HD Weight Today</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Actual Weight Loss</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Remain Weight Loss</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>

                      {/* Row 4 */}
                      <div className="col-12">
                        <label className="form-label mb-1 fw-medium">Target Dry Weight</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>

                      {/* Row 5: checkbox rows start */}
                      <div className="col-md-4 col-12">
                        <label className="form-label mb-1 fw-medium">Dialyzer Usage Type</label>
                        <div className="d-flex flex-wrap gap-2">
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="dialyzer-single-use" />
                            <label
                              className="form-check-label"
                              htmlFor="dialyzer-single-use"
                              style={{ color: "#000" }}
                            >
                              Single Use
                            </label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="dialyzer-reuse" />
                            <label className="form-check-label" htmlFor="dialyzer-reuse" style={{ color: "#000" }}>
                              Reuse
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 col-12">
                        <label className="form-label mb-1 fw-medium d-block">Vascular Access</label>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="vascular-access" />
                          <label
                            className="form-check-label"
                            htmlFor="vascular-access"
                            style={{ color: "#000" }}
                          >
                            Present
                          </label>
                        </div>
                      </div>
                      <div className="col-md-2 col-12">
                        <label className="form-label mb-1 fw-medium">Times Reused</label>
                        <input type="text" className="form-control form-control-sm" style={{ maxWidth: "100px" }} />
                      </div>
                      <div className="col-md-3 col-12">
                        <label className="form-label mb-1 fw-medium">Central Line</label>
                        <div className="d-flex flex-wrap gap-2">
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="central-line-yes" />
                            <label className="form-check-label" htmlFor="central-line-yes" style={{ color: "#000" }}>
                              Yes
                            </label>
                          </div>
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="central-line-no" />
                            <label className="form-check-label" htmlFor="central-line-no" style={{ color: "#000" }}>
                              No
                            </label>
                          </div>
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="central-line-ijv" />
                            <label className="form-check-label" htmlFor="central-line-ijv" style={{ color: "#000" }}>
                              IJV
                            </label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="central-line-femoral" />
                            <label
                              className="form-check-label"
                              htmlFor="central-line-femoral"
                              style={{ color: "#000" }}
                            >
                              Femoral
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Row 6: checkbox row */}
                      <div className="col-md-4 col-12">
                        <label className="form-label mb-1 fw-medium">AVF / AVG / IJV / Femoral</label>
                        <div className="d-flex flex-wrap gap-2">
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="avf" />
                            <label className="form-check-label" htmlFor="avf" style={{ color: "#000" }}>
                              AVF
                            </label>
                          </div>
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="avg" />
                            <label className="form-check-label" htmlFor="avg" style={{ color: "#000" }}>
                              AVG
                            </label>
                          </div>
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="ijv" />
                            <label className="form-check-label" htmlFor="ijv" style={{ color: "#000" }}>
                              IJV
                            </label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="femoral" />
                            <label className="form-check-label" htmlFor="femoral" style={{ color: "#000" }}>
                              Femoral
                            </label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="tunneled-catheter" />
                            <label
                              className="form-check-label"
                              htmlFor="tunneled-catheter"
                              style={{ color: "#000" }}
                            >
                              Tunneled Catheter
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <label className="form-label mb-1 fw-medium">AVF Needle Size</label>
                        <div className="d-flex flex-wrap gap-2">
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="needle-16g" />
                            <label className="form-check-label" htmlFor="needle-16g" style={{ color: "#000" }}>
                              16G
                            </label>
                          </div>
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="needle-17g" />
                            <label className="form-check-label" htmlFor="needle-17g" style={{ color: "#000" }}>
                              17G
                            </label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="needle-others" />
                            <label className="form-check-label" htmlFor="needle-others" style={{ color: "#000" }}>
                              Others
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <label className="form-label mb-1 fw-medium">Bruit / Thrill</label>
                        <div className="d-flex flex-wrap gap-2">
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="bruit-present" />
                            <label className="form-check-label" htmlFor="bruit-present" style={{ color: "#000" }}>
                              Present
                            </label>
                          </div>
                          <div className="form-check me-2">
                            <input className="form-check-input" type="checkbox" id="bruit-absent" />
                            <label className="form-check-label" htmlFor="bruit-absent" style={{ color: "#000" }}>
                              Absent
                            </label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="bruit-na" />
                            <label className="form-check-label" htmlFor="bruit-na" style={{ color: "#000" }}>
                              Not Applicable
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pre-Dialysis Assessment */}
                <div ref={sectionRefs["pre-dialysis-assessment"]} id="pre-dialysis-assessment" className="mb-4">
                  <h5 className="fw-bold mb-3">Pre-Dialysis Assessment</h5>
                  <div className="border rounded p-3">
                    <div className="row g-2">
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">BP at Start of HD</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">SPO2</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Body Temperature</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-3 col-6">
                        <label className="form-label mb-1 fw-medium">Pulse</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dialysis Monitoring */}
                <div ref={sectionRefs["dialysis-monitoring"]} id="dialysis-monitoring" className="mb-4">
                  <h5 className="fw-bold mb-3">Dialysis Monitoring</h5>
                  <div className="border rounded p-3">
                    <div className="table-responsive">
                      <table className="dialysis-table w-100 text-center">
                        <thead className="table-light">
                          <tr>
                            <th style={{ whiteSpace: "nowrap" }}>Time on HD</th>
                            <th>PR</th>
                            <th>BP</th>
                            <th>BFR</th>
                            <th>DFR</th>
                            <th>UFR</th>
                            <th>Total UF</th>
                            <th>Temp.</th>
                            <th>DyNa</th>
                            <th>Heparin</th>
                            <th>RBS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 8 }).map((_, index) => (
                            <tr key={index}>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="Time on HD"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="PR"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="BP"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="BFR"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="DFR"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="UFR"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="Total UF"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="Temperature"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="DyNa"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="Heparin"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px" }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  aria-label="RBS"
                                  style={{ fontSize: "16px" }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Post Dialysis Assessment */}
                <div ref={sectionRefs["post-dialysis-assessment"]} id="post-dialysis-assessment" className="mb-4">
                  <h5 className="fw-bold mb-3">Post Dialysis Assessment</h5>
                  <div className="border rounded p-3">
                    <div className="row g-2">
                      {/* Row 1: Pulse, BP, Body Temp */}
                      <div className="col-md-4 col-12 d-flex align-items-center gap-1">
                        <label className="form-label mb-1 fw-medium mb-0">Pulse</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-4 col-12 d-flex align-items-center gap-1">
                        <label className="form-label mb-1 fw-medium mb-0">BP</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>
                      <div className="col-md-4 col-12 d-flex align-items-center gap-1">
                        <label className="form-label mb-1 fw-medium mb-0">Body Temperature</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>

                      {/* Row 2: Post HD Weight (2 boxes), UF Removed */}
                      <div className="col-md-8 col-12">
                        <div className="d-flex align-items-center gap-1">
                          <label className="form-label mb-1 fw-medium mb-0">Post HD Weight</label>
                          <input type="text" className="form-control form-control-sm" />
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>
                      <div className="col-md-4 col-12 d-flex align-items-center gap-1">
                        <label className="form-label mb-1 fw-medium mb-0">UF Removed</label>
                        <input type="text" className="form-control form-control-sm" />
                      </div>

                      {/* Row 3: Prolonged bleeding (2 boxes) */}
                      <div className="col-12">
                        <div className="d-flex align-items-center gap-1">
                          <label className="form-label mb-1 fw-medium mb-0">
                            Prolonged Bleeding from Access Site
                          </label>
                          <input type="text" className="form-control form-control-sm" />
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>

                      {/* Row 4: Bruit/Thrill (3 boxes) */}
                      <div className="col-12">
                        <div className="d-flex align-items-center gap-1">
                          <label className="form-label mb-1 fw-medium mb-0">Bruit/Thrill (AVF/AVG)</label>
                          <input type="text" className="form-control form-control-sm" />
                          <input type="text" className="form-control form-control-sm" />
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>

                      {/* Row 5: KT/V Achieved (single long) */}
                      <div className="col-12">
                        <div className="d-flex align-items-center gap-1">
                          <label className="form-label mb-1 fw-medium mb-0">KT / V Achieved</label>
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complications During Dialysis */}
                <div
                  ref={sectionRefs["complications-during-dialysis"]}
                  id="complications-during-dialysis"
                  className="mb-4"
                >
                  <h5 className="fw-bold mb-3">Complications During Dialysis</h5>
                  <div className="border rounded p-3">
                    <div className="row g-2">
                      {/* All as checkboxes */}
                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-hypotension" />
                          <label className="form-check-label" htmlFor="comp-hypotension" style={{ color: "#000" }}>
                            Hypotension
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-fever" />
                          <label className="form-check-label" htmlFor="comp-fever" style={{ color: "#000" }}>
                            Fever
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-headache" />
                          <label className="form-check-label" htmlFor="comp-headache" style={{ color: "#000" }}>
                            Headache
                          </label>
                        </div>
                      </div>

                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-rigor" />
                          <label className="form-check-label" htmlFor="comp-rigor" style={{ color: "#000" }}>
                            Rigor
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-cramps" />
                          <label className="form-check-label" htmlFor="comp-cramps" style={{ color: "#000" }}>
                            Cramps
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-rash" />
                          <label className="form-check-label" htmlFor="comp-rash" style={{ color: "#000" }}>
                            Rash
                          </label>
                        </div>
                      </div>

                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-vomiting" />
                          <label className="form-check-label" htmlFor="comp-vomiting" style={{ color: "#000" }}>
                            Vomiting
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-chest-pain" />
                          <label className="form-check-label" htmlFor="comp-chest-pain" style={{ color: "#000" }}>
                            Chest Pain
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-dyspnea" />
                          <label className="form-check-label" htmlFor="comp-dyspnea" style={{ color: "#000" }}>
                            Dyspnea
                          </label>
                        </div>
                      </div>

                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-pruritus" />
                          <label className="form-check-label" htmlFor="comp-pruritus" style={{ color: "#000" }}>
                            Pruritus
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-dialyzer-reaction" />
                          <label
                            className="form-check-label"
                            htmlFor="comp-dialyzer-reaction"
                            style={{ color: "#000" }}
                          >
                            Dialyzer Reaction
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4 col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="comp-seizures" />
                          <label className="form-check-label" htmlFor="comp-seizures" style={{ color: "#000" }}>
                            Seizures
                          </label>
                        </div>
                      </div>

                      <div className="col-12 mt-2">
                        <label className="form-label mb-1 fw-medium">Other Complications During Dialysis</label>
                        <textarea className="form-control" rows={3} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Treatment Given */}
                <div ref={sectionRefs["treatment-given"]} id="treatment-given" className="mb-4">
                  <h5 className="fw-bold mb-3">Treatment Given</h5>
                  <div className="border rounded p-3">
                    <div className="row g-2">
                      {/* Row 1 */}
                      <div className="col-md-6 col-12">
                        <div className="d-flex align-items-center gap-2">
                          <label
                            className="form-label mb-1 fw-medium mb-0 dialysis-label"
                            style={{ minWidth: "200px" }}
                          >
                            EPO Dosage
                          </label>
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>
                      <div className="col-md-6 col-12">
                        <div className="d-flex align-items-center gap-2">
                          <label
                            className="form-label mb-1 fw-medium mb-0 dialysis-label"
                            style={{ minWidth: "200px" }}
                          >
                            Blood Transfusion
                          </label>
                          <input type="text" className="form-control form-control-sm" />
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="col-md-6 col-12">
                        <div className="d-flex align-items-center gap-2">
                          <label
                            className="form-label mb-1 fw-medium mb-0 dialysis-label"
                            style={{ minWidth: "200px" }}
                          >
                            EPO Given By
                          </label>
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>
                      <div className="col-md-6 col-12">
                        <div className="d-flex align-items-center gap-2">
                          <label
                            className="form-label mb-1 fw-medium mb-0 dialysis-label"
                            style={{ minWidth: "200px" }}
                          >
                            Number of Unit
                          </label>
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>

                      {/* Row 3 */}
                      <div className="col-md-6 col-12">
                        <div className="d-flex align-items-center gap-2">
                          <label
                            className="form-label mb-1 fw-medium mb-0 dialysis-label"
                            style={{ minWidth: "200px" }}
                          >
                            Patient Signature
                          </label>
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>
                      <div className="col-md-6 col-12">
                        <div className="d-flex align-items-center gap-2">
                          <label
                            className="form-label mb-1 fw-medium mb-0 dialysis-label"
                            style={{ minWidth: "200px" }}
                          >
                            Blood Bank Name
                          </label>
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>

                      {/* Row 4 */}
                      <div className="col-md-6 col-12">
                        <div className="d-flex align-items-center gap-2">
                          <label
                            className="form-label mb-1 fw-medium mb-0 dialysis-label"
                            style={{ minWidth: "200px" }}
                          >
                            IV Iron Dose
                          </label>
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>
                      <div className="col-md-6 col-12">
                        <div className="d-flex align-items-center gap-2">
                          <label
                            className="form-label mb-1 fw-medium mb-0 dialysis-label"
                            style={{ minWidth: "200px" }}
                          >
                            Type of Blood
                          </label>
                          <input type="text" className="form-control form-control-sm" />
                        </div>
                      </div>

                      {/* Other Treatment */}
                      <div className="col-12 mt-2">
                        <label className="form-label mb-1 fw-bold">Other Treatment Given Drug</label>
                        <textarea className="form-control" rows={4} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <div className="card-footer text-end bg-white border-top">
                <button type="button" className="btn btn-primary dialysis-save-btn">
                  Save Dialysis Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialysisAppointmentPage;

