"use client";

import { Department } from "@/core/common/selectOption";
import CommonSelect from "@/core/common/common-select/commonSelect";
import { all_routes } from "../../../../routes/all_routes";
import Link from "next/link";

const AddProcedureComponent = () => {
  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-12">
              <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <Link href={all_routes.procedures}>
                      <i className="ti ti-chevron-left me-1 fs-14" />
                      Procedures
                    </Link>
                  </h6>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="border-bottom d-flex align-items-center justify-content-between pb-3 mb-3">
                    <h5 className="offcanvas-title fs-18 fw-bold text-primary">
                      New Procedure
                    </h5>
                  </div>
                  <form>
                    <div className="pb-0">
                      <div className="row">
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Procedure Name
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Department
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={Department}
                              className="select"
                              defaultValue={Department[0]}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Category
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={[
                                { value: "diagnostic", label: "Diagnostic" },
                                { value: "surgical", label: "Surgical" },
                                { value: "therapeutic", label: "Therapeutic" },
                                { value: "preventive", label: "Preventive" },
                              ]}
                              className="select"
                              defaultValue={{ value: "diagnostic", label: "Diagnostic" }}
                            />
                          </div>
                        </div>
                        <div className="col-lg-2">
                          <div className="mb-3">
                            <label className="form-label">Status</label>
                            <CommonSelect
                              options={[
                                { value: "active", label: "Active" },
                                { value: "inactive", label: "Inactive" },
                              ]}
                              className="select"
                              defaultValue={{ value: "active", label: "Active" }}
                            />
                          </div>
                        </div>
                        <div className="col-lg-2">
                          <div className="mb-3">
                            <label className="form-label">
                              Price
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <div className="input-group">
                              <input type="text" className="form-control" />
                              <span className="input-group-text bg-transparent text-dark fs-14">
                                ₹
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-2">
                          <div className="mb-3">
                            <label className="form-label">
                              Day Care Billing
                            </label>
                            <div className="input-group">
                              <input type="text" className="form-control" />
                              <span className="input-group-text bg-transparent text-dark fs-14">
                                ₹
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-2">
                          <div className="mb-3">
                            <label className="form-label">Consumables</label>
                            <CommonSelect
                              options={[
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                              ]}
                              className="select"
                              defaultValue={{ value: "no", label: "No" }}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">Nursing Charges</label>
                            <div className="input-group">
                              <input type="text" className="form-control" />
                              <span className="input-group-text bg-transparent text-dark fs-14">
                                ₹
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">Room Charges</label>
                            <div className="input-group">
                              <input type="text" className="form-control" />
                              <span className="input-group-text bg-transparent text-dark fs-14">
                                ₹
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">Meta Data</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              placeholder="Enter metadata information"
                            />
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea
                              className="form-control"
                              rows={4}
                              placeholder="Enter procedure description"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <Link
                        href={all_routes.procedures}
                        className="btn btn-light btm-md"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary btm-md"
                      >
                        Add Procedure
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link href="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default AddProcedureComponent;
