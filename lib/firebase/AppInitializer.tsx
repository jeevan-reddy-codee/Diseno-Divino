"use client";

import { useEffect } from "react";
import { ensureDatabaseInitialized } from "@/lib/services/seedService";

export const AppInitializer = () => {
  useEffect(() => {
    ensureDatabaseInitialized();
  }, []);

  return null;
};
