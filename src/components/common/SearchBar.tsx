"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface SearchBarProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div className="md:max-w-[500px] w-full flex items-center justify-between">
      <Input
        className="rounded-r-none border-gray-700"
        placeholder={placeholder || "Search for relevant projects"}
        value={value}
        onChange={onChange}
      />
      <Button
        variant="secondary"
        className="bg-blue-600 hover:bg-blue-400 font-bold text-xl rounded-l-none"
      >
        <SearchIcon />
      </Button>
    </div>
  );
};

export default SearchBar;
