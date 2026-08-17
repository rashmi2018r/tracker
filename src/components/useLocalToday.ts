"use client";

import { useEffect, useState } from "react";
import { localToday } from "@/records";

export function useLocalToday() {
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(localToday());
  }, []);

  return today;
}
