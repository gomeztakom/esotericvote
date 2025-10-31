"use client";

import { useState, useCallback } from "react";

export const useInMemoryStorage = <T,>(initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue);

  const update = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const updated = typeof newValue === "function"
        ? (newValue as (prev: T) => T)(prev)
        : newValue;
      return updated;
    });
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    setValue: update,
    reset,
  };
};

