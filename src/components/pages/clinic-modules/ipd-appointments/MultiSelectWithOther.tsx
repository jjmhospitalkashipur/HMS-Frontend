"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import type { InputActionMeta, SingleValue } from "react-select";

export interface IMultiSelectWithOtherOption {
  value: string;
  label: string;
  /** Stored string fragment when selected */
  text: string;
}

interface IMultiSelectWithOtherProps {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  placeholder?: string;
  options: IMultiSelectWithOtherOption[];
  /** The option value that represents the "Other" choice */
  otherValue: string;
}

const MultiSelectWithOther = ({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Select options...",
  options,
  otherValue,
}: IMultiSelectWithOtherProps) => {
  const otherOption = useMemo(
    () => options.find((o) => o.value === otherValue),
    [options, otherValue]
  );

  const optionByText = useMemo(() => {
    const map = new Map<string, IMultiSelectWithOtherOption>();
    options.forEach((o) => map.set(o.text, o));
    return map;
  }, [options]);

  const [otherText, setOtherText] = useState("");
  const [otherSelected, setOtherSelected] = useState(false);
  const normalizedValue = (value ?? "").trim();
  const selectedOption = useMemo(() => {
    if (!normalizedValue) return null;
    const matched = optionByText.get(normalizedValue);
    if (matched && matched.value !== otherValue) return matched;
    return otherSelected ? otherOption ?? null : null;
  }, [normalizedValue, optionByText, otherOption, otherSelected, otherValue]);

  useEffect(() => {
    if (!normalizedValue) {
      setOtherSelected(false);
      setOtherText("");
      return;
    }
    const matched = optionByText.get(normalizedValue);
    if (matched && matched.value !== otherValue) {
      setOtherSelected(false);
      setOtherText("");
      return;
    }
    if (matched && matched.value === otherValue) {
      setOtherSelected(true);
      setOtherText("");
      return;
    }
    setOtherSelected(true);
    setOtherText(normalizedValue);
  }, [normalizedValue, optionByText, otherValue]);

  const [inputValue, setInputValue] = useState("");

  const handleChange = useCallback(
    (selected: SingleValue<IMultiSelectWithOtherOption>) => {
      if (!selected) {
        setOtherSelected(false);
        setOtherText("");
        onChange("");
        return;
      }
      if (selected.value === otherValue) {
        setOtherSelected(true);
        onChange(selected.text);
        return;
      }
      setOtherSelected(false);
      setOtherText("");
      onChange(selected.text);
    },
    [onChange, otherText, otherValue]
  );

  const handleInputChange = useCallback((newValue: string, actionMeta: InputActionMeta) => {
    if (actionMeta.action !== "input-change") return;
    setInputValue(newValue);
  }, []);

  const handleOtherTextChange = useCallback(
    (next: string) => {
      setOtherText(next);
      if (!otherSelected) return;
      onChange(next.trim());
    },
    [onChange, otherSelected]
  );

  const isOtherSelectedInUi = otherSelected;

  const reactSelectStyles = useMemo(
    () => ({
      option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
        ...base,
        backgroundColor: state.isSelected || state.isFocused ? "#2e37a4" : "white",
        color: state.isSelected || state.isFocused ? "#ffffff" : "#333",
        cursor: "pointer",
        padding: "8px 12px",
      }),
      menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
      menu: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
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
    <div className="row g-2 align-items-start">
      <div className={isOtherSelectedInUi ? "col-12 col-md-7" : "col-12"}>
        <Select<IMultiSelectWithOtherOption, false>
          inputId={id}
          instanceId={id}
          isSearchable
          isClearable
          isDisabled={disabled}
          options={options}
          value={selectedOption}
          onChange={handleChange}
          onInputChange={handleInputChange}
          placeholder={placeholder}
          styles={reactSelectStyles}
          menuPortalTarget={typeof window !== "undefined" ? document.body : null}
          menuPosition="fixed"
          noOptionsMessage={() => (inputValue.trim() ? "No matches" : "Type to search")}
        />
      </div>

      {isOtherSelectedInUi ? (
        <div className="col-12 col-md-5">
          <input
            type="text"
            className="form-control text-dark"
            placeholder="Type other..."
            value={otherText}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            disabled={disabled}
            aria-label={otherOption?.label ? `Other: ${otherOption.label}` : "Other"}
          />
        </div>
      ) : null}
    </div>
  );
};

export default MultiSelectWithOther;

