"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import type { InputActionMeta, MultiValue } from "react-select";

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

const splitValueLines = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const joinValueLines = (lines: string[]): string =>
  lines.map((line) => line.trim()).filter(Boolean).join("\n");

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
    () => options.find((o) => o.value === otherValue) ?? null,
    [options, otherValue]
  );

  const presetOptions = useMemo(
    () => options.filter((o) => o.value !== otherValue),
    [options, otherValue]
  );

  const optionByText = useMemo(() => {
    const map = new Map<string, IMultiSelectWithOtherOption>();
    presetOptions.forEach((o) => map.set(o.text, o));
    return map;
  }, [presetOptions]);

  const [otherText, setOtherText] = useState("");
  const [otherSelected, setOtherSelected] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const selectedOptions = useMemo(() => {
    const lines = splitValueLines(value);
    const matched: IMultiSelectWithOtherOption[] = [];
    let hasCustom = false;

    lines.forEach((line) => {
      const option = optionByText.get(line);
      if (option) {
        matched.push(option);
        return;
      }
      hasCustom = true;
    });

    if ((otherSelected || hasCustom) && otherOption) {
      matched.push(otherOption);
    }

    return matched;
  }, [optionByText, otherOption, otherSelected, value]);

  useEffect(() => {
    const lines = splitValueLines(value);
    if (!lines.length) {
      setOtherSelected(false);
      setOtherText("");
      return;
    }

    const unmatched = lines.filter((line) => !optionByText.has(line));
    if (!unmatched.length) {
      setOtherSelected(false);
      setOtherText("");
      return;
    }

    setOtherSelected(true);
    setOtherText(unmatched.join("\n"));
  }, [optionByText, value]);

  const emitChange = useCallback(
    (selected: IMultiSelectWithOtherOption[], nextOtherText: string, nextOtherSelected: boolean) => {
      const lines = selected
        .filter((option) => option.value !== otherValue)
        .map((option) => option.text);
      if (nextOtherSelected) {
        const custom = nextOtherText.trim();
        if (custom) lines.push(custom);
      }
      onChange(joinValueLines(lines));
    },
    [onChange, otherValue]
  );

  const handleChange = useCallback(
    (selected: MultiValue<IMultiSelectWithOtherOption>) => {
      const next = [...selected];
      const hasOther = next.some((option) => option.value === otherValue);
      setOtherSelected(hasOther);
      if (!hasOther) {
        setOtherText("");
        emitChange(next, "", false);
        return;
      }
      emitChange(next, otherText, true);
    },
    [emitChange, otherText, otherValue]
  );

  const handleInputChange = useCallback((newValue: string, actionMeta: InputActionMeta) => {
    if (actionMeta.action !== "input-change") return;
    setInputValue(newValue);
  }, []);

  const handleOtherTextChange = useCallback(
    (next: string) => {
      setOtherText(next);
      if (!otherSelected) return;
      emitChange(selectedOptions, next, true);
    },
    [emitChange, otherSelected, selectedOptions]
  );

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
      <div className={otherSelected ? "col-12 col-md-7" : "col-12"}>
        <Select<IMultiSelectWithOtherOption, true>
          inputId={id}
          instanceId={id}
          isMulti
          isSearchable
          isClearable
          isDisabled={disabled}
          options={options}
          value={selectedOptions}
          onChange={handleChange}
          onInputChange={handleInputChange}
          placeholder={placeholder}
          styles={reactSelectStyles}
          menuPortalTarget={typeof window !== "undefined" ? document.body : null}
          menuPosition="fixed"
          closeMenuOnSelect={false}
          noOptionsMessage={() => (inputValue.trim() ? "No matches" : "Type to search")}
        />
      </div>

      {otherSelected ? (
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
