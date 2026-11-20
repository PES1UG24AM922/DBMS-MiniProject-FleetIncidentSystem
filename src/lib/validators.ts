import { z } from "zod";

export const Login = z.object({ username: z.string().min(3).max(50), password: z.string().min(6).max(100) });
export const Bus = z.object({
  regNumber: z.string().min(5).max(15), model: z.string().min(2).max(60),
  capacity: z.number().int().min(10).max(120), purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fuelType: z.enum(["DIESEL", "CNG", "ELECTRIC"]).default("DIESEL"),
});
export const BusUpdate = z.object({
  status: z.enum(["AVAILABLE", "ON_TRIP", "MAINTENANCE", "RETIRED"]).optional(),
  model: z.string().min(2).max(60).optional(), capacity: z.number().int().min(10).max(120).optional(),
});
export const Driver = z.object({
  fullName: z.string().min(2).max(100), licenseNo: z.string().min(6).max(20),
  phone: z.string().regex(/^[6-9]\d{9}$/, "10-digit Indian mobile number"), experienceYears: z.number().int().min(0).max(50),
});
export const Route = z.object({
  routeCode: z.string().min(2).max(10), routeName: z.string().min(3).max(150),
  origin: z.string().min(2).max(80), destination: z.string().min(2).max(80), distanceKm: z.number().positive().max(999),
});
export const Trip = z.object({
  routeId: z.number().int().positive(), busId: z.number().int().positive(), driverId: z.number().int().positive(),
  scheduledStart: z.string().min(16), scheduledEnd: z.string().min(16),
});
export const IncidentNew = z.object({
  tripId: z.number().int().positive(),
  type: z.enum(["BREAKDOWN", "ACCIDENT", "DELAY", "OVERCROWDING", "COMPLAINT"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  location: z.string().min(3).max(150), description: z.string().min(10).max(2000),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
  lng: z.number().min(-180).max(180).optional(), lat: z.number().min(-90).max(90).optional(),
});
export const Assign = z.object({ description: z.string().min(5).max(255), cost: z.number().min(0).max(10000000) });
export const ReportUpdate = z.object({ narrative: z.string().min(10).max(4000).optional(), tags: z.array(z.string().min(1).max(30)).max(15).optional() });
export const Comment = z.object({ text: z.string().min(2).max(1000) });
export const Telemetry = z.object({
  busId: z.number().int().positive(), speedKmph: z.number().min(0).max(150),
  engineTempC: z.number().min(0).max(300).optional(), fuelPct: z.number().min(0).max(100).optional(),
});
