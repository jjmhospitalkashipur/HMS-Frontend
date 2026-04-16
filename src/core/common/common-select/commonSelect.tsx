import React, { useEffect, useState, useId, useMemo } from "react";
import Select, { InputActionMeta } from "react-select";

export type Option = {
  value: string;
  label: string;
};

export interface SelectProps {
  options: Option[];
  defaultValue?: Option;
  value?: Option | null;
  onChange?: (option: Option | null) => void;
  className?: string;
  styles?: any;
  instanceId?: string;
  disabled?: boolean;
  placeholder?: string;
  /** For async search: called when user types in the select input */
  onInputChange?: (newValue: string, actionMeta: InputActionMeta) => void;
  /** For async search: called when dropdown menu opens */
  onMenuOpen?: () => void;
  /** Show loading indicator while options are being fetched */
  isLoading?: boolean;
}

const CommonSelect: React.FC<SelectProps> = ({
  options,
  defaultValue,
  value,
  onChange,
  className,
  instanceId,
  disabled,
  placeholder,
  onInputChange,
  onMenuOpen,
  isLoading = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(value || defaultValue);
  const reactId = useId();
  const stableInstanceId = instanceId || `common-select-${reactId}`;

  const customStyles = useMemo(() => ({
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor:
        state.isSelected || state.isFocused ? "#2e37a4" : "white",
      color: state.isSelected || state.isFocused ? "#ffffff" : "#333",
      cursor: "pointer",
      padding: "8px 12px",
      ":active": {
        ...base[":active"],
        backgroundColor: "#2e37a4",
        color: "#ffffff",
      },
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
  }), []);

  const handleChange = (option: Option | null) => {
    if (onChange) {
      onChange(option);
    } else {
      setSelectedOption(option || undefined);
    }
  };

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setSelectedOption(value);
    } else if (defaultValue) {
      setSelectedOption(defaultValue);
    } else {
      setSelectedOption(undefined);
    }
  }, [value, defaultValue]);

  return (
    <div className="common-select-wrapper">
      <Select
        classNamePrefix="react-select"
        className={className}
        styles={customStyles}
        options={options}
        instanceId={stableInstanceId}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder ?? "Select"}
        isDisabled={disabled}
        key={stableInstanceId}
        onInputChange={onInputChange}
        onMenuOpen={onMenuOpen}
        isLoading={isLoading}
        isSearchable={true}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
      />
    </div>
  );
};

export default CommonSelect;
