"use client";

import React, { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface SearchBarProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onSubmit?: (value: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
  onSubmit,
  onFocus,
  onBlur,
  onKeyDown,
}) => {
  const [internalValue, setInternalValue] = useState("");
  const currentValue = value ?? internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }

    onChange?.(e);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(currentValue.trim());
  };

  return (
    <form
      className="md:max-w-[500px] w-full flex items-center justify-between"
      onSubmit={handleSubmit}
    >
      <Input
        className="rounded-r-none border-gray-700 bg-[#111111] text-white placeholder:text-zinc-500"
        placeholder={placeholder || "Search for relevant projects"}
        value={currentValue}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      <Button
        type="submit"
        variant="secondary"
        className="bg-cyan-500 hover:bg-cyan-400 font-bold text-xl rounded-l-none text-slate-950"
      >
        <SearchIcon />
      </Button>
    </form>
  );
};

export default SearchBar;
