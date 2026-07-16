"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Select, { type InputActionMeta } from "react-select";
import { searchIcdDiagnoses } from "@/core/api/icdApi";
import type { IFinalDiagnosisRow } from "@/components/pages/clinic-modules/ipd-appointments/ipdDischargeSummaryTypes";

interface IIcdDiagnosisOption {
  value: string;
  label: string;
  icdCode: string;
  diagnosisName: string;
}

interface IIcdDiagnosisMultiSelectProps {
  value: IFinalDiagnosisRow[];
  onChange: (value: IFinalDiagnosisRow[]) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}

const toOptionValue = (row: IFinalDiagnosisRow): string =>
  `${row.icdCode.trim()}::${row.diagnosisName.trim()}`;

const fromOptionValue = (option: IIcdDiagnosisOption): IFinalDiagnosisRow => ({
  icdCode: option.icdCode,
  diagnosisName: option.diagnosisName,
});

const toOption = (row: IFinalDiagnosisRow): IIcdDiagnosisOption => {
  const icdCode = row.icdCode.trim();
  const diagnosisName = row.diagnosisName.trim();
  const label = icdCode ? `${icdCode} — ${diagnosisName}` : diagnosisName;
  return {
    value: toOptionValue(row),
    label,
    icdCode,
    diagnosisName,
  };
};

const IcdDiagnosisMultiSelect = ({
  value,
  onChange,
  id,
  placeholder = "Search ICD diagnosis...",
  disabled = false,
}: IIcdDiagnosisMultiSelectProps) => {
  const reactId = useId();
  const instanceId = id ?? `icd-diagnosis-multi-${reactId}`;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchOptions, setSearchOptions] = useState<IIcdDiagnosisOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedOptions = useMemo(
    () => value.filter((row) => row.icdCode.trim() || row.diagnosisName.trim()).map(toOption),
    [value]
  );

  const mergedOptions = useMemo(() => {
    const seen = new Set<string>();
    const next: IIcdDiagnosisOption[] = [];
    [...selectedOptions, ...searchOptions].forEach((option) => {
      if (seen.has(option.value)) return;
      seen.add(option.value);
      next.push(option);
    });
    return next;
  }, [searchOptions, selectedOptions]);

  const fetchDiagnoses = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setSearchOptions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchIcdDiagnoses(trimmed);
      setSearchOptions(results.map(toOption));
    } catch {
      setSearchOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (inputValue: string, actionMeta: InputActionMeta) => {
      if (actionMeta.action !== "input-change") return;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      debounceRef.current = setTimeout(() => {
        void fetchDiagnoses(inputValue);
      }, 300);
    },
    [fetchDiagnoses]
  );

  const handleChange = useCallback(
    (options: readonly IIcdDiagnosisOption[]) => {
      onChange(options.map(fromOptionValue));
    },
    [onChange]
  );

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    []
  );

  const customStyles = useMemo(
    () => ({
      option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
        ...base,
        backgroundColor: state.isSelected || state.isFocused ? "#2e37a4" : "white",
        color: state.isSelected || state.isFocused ? "#ffffff" : "#333",
        cursor: "pointer",
        padding: "8px 12px",
      }),
      menuPortal: (base: Record<string, unknown>) => ({
        ...base,
        zIndex: 9999,
      }),
      menu: (base: Record<string, unknown>) => ({
        ...base,
        zIndex: 9999,
      }),
      multiValue: (base: Record<string, unknown>) => ({
        ...base,
        backgroundColor: "#eef0ff",
      }),
      multiValueLabel: (base: Record<string, unknown>) => ({
        ...base,
        color: "#2e37a4",
        fontSize: "0.875rem",
      }),
    }),
    []
  );

  return (
    <div className="common-select-wrapper">
      <Select<IIcdDiagnosisOption, true>
        classNamePrefix="react-select"
        instanceId={instanceId}
        inputId={id}
        isMulti
        isSearchable
        isDisabled={disabled}
        isLoading={isLoading}
        options={mergedOptions}
        value={selectedOptions}
        onChange={handleChange}
        onInputChange={handleInputChange}
        placeholder={placeholder}
        noOptionsMessage={({ inputValue }) =>
          inputValue.trim() ? "No diagnoses found" : "Type to search ICD diagnoses"
        }
        styles={customStyles}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
      />
    </div>
  );
};

export default IcdDiagnosisMultiSelect;
