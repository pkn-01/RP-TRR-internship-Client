"use client";

import React, { useState, useCallback } from "react";
import { Search, X } from "lucide-react";

interface SearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  debounceMs?: number;
}

export default function SearchBox({
  placeholder = "ค้นหา...",
  onSearch,
  onClear,
  debounceMs = 300,
}: SearchBoxProps) {
  const [value, setValue] = useState("");
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (timer) clearTimeout(timer);

      const newTimer = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);

      setTimer(newTimer);
    },
    [debounceMs, onSearch, timer],
  );

  const handleClear = () => {
    setValue("");
    if (timer) clearTimeout(timer);
    if (onClear) {
      onClear();
    } else {
      onSearch("");
    }
  };

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={18}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
