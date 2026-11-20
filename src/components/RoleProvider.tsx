"use client";
import { createContext, useContext } from "react";
import type { Role } from "@/types";

const Ctx = createContext<Role>("DRIVER");
export const RoleProvider = ({ role, children }: { role: Role; children: React.ReactNode }) => <Ctx.Provider value={role}>{children}</Ctx.Provider>;
export const useRole = () => useContext(Ctx);
