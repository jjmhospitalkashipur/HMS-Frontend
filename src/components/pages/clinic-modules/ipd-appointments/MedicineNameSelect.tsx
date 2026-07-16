"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Select, { type InputActionMeta, type SingleValue } from "react-select";
import { searchMedicines } from "@/core/api/medicineApi";

interface IMedicineOption {
  value: string;
  label: string;
}

interface IMedicineNameSelectProps {
  id?: string;
  value: string;
  onChange: (medicineName: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const toOption = (name: string): IMedicineOption => ({
  value: name,
  label: name,
});

const MedicineNameSelect = ({
  id,
  value,
  onChange,
  placeholder = "Search medicine...",
  disabled = false,
}: IMedicineNameSelectProps) => {
  const reactId = useId();
  const instanceId = id ?? `medicine-name-select-${reactId}`;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchOptions, setSearchOptions] = useState<IMedicineOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedValue = (value ?? "").trim();

  const selectedOption = useMemo(() => {
    if (!normalizedValue) return null;
    return toOption(normalizedValue);
  }, [normalizedValue]);

  const mergedOptions = useMemo(() => {
    const seen = new Set<string>();
    const next: IMedicineOption[] = [];
    if (selectedOption) {
      seen.add(selectedOption.value);
      next.push(selectedOption);
    }
    searchOptions.forEach((option) => {
      if (seen.has(option.value)) return;
      seen.add(option.value);
      next.push(option);
    });
    return next;
  }, [searchOptions, selectedOption]);

  const fetchMedicines = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setSearchOptions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchMedicines(trimmed);
      setSearchOptions(results.map((item) => toOption(item.name)));
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
        void fetchMedicines(inputValue);
      }, 300);
    },
    [fetchMedicines]
  );

  const handleChange = useCallback(
    (option: SingleValue<IMedicineOption>) => {
      onChange(option?.label?.trim() ?? "");
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
      control: (base: Record<string, unknown>) => ({
        ...base,
        minHeight: "40px",
        fontSize: "0.9375rem",
      }),
    }),
    []
  );

  return (
    <div className="common-select-wrapper">
      <Select<IMedicineOption, false>
        classNamePrefix="react-select"
        instanceId={instanceId}
        inputId={id}
        isSearchable
        isClearable
        isDisabled={disabled}
        isLoading={isLoading}
        options={mergedOptions}
        value={selectedOption}
        onChange={handleChange}
        onInputChange={handleInputChange}
        placeholder={placeholder}
        noOptionsMessage={({ inputValue }) =>
          inputValue.trim() ? "No medicines found" : "Type to search medicines"
        }
        styles={customStyles}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
      />
    </div>
  );
};

export default MedicineNameSelect;
