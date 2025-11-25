import { initTRPC } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { z } from "zod";
import * as db from "./db"; // Assuming db.ts is in the same directory or a sibling
import { User } from "../drizzle/schema"; // Assuming this path is correct

// You can use your existing createContext
import { createContext as createTRPCContext } from "./_core/context";

// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new Error("Unauthorized");
  }
  return opts.next({
    ctx: {
      user: ctx.user,
    },
  });
});

// --- Auth Router ---
const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string(), role: z.string() }))
    .mutation(async ({ input }) => {
      console.log("Mock login attempt:", input);
      // In a real app, you'd verify credentials and create a session token.
      // For now, return mock user data for any input.
      if (input.email === "test@example.com" && input.password === "password") {
        const mockUser: User = {
          id: 1,
          openId: "mock_open_id_123",
          name: "Mock User",
          email: "test@example.com",
          loginMethod: "mock",
          role: input.role as "user" | "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        };
        return {
          token: "mock_token",
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          businessId: mockUser.role === "admin" ? "1" : undefined, // Mock businessId for admin
        };
      }
      throw new Error("Invalid credentials (mock)");
    }),
  signup: publicProcedure
    .input(z.object({ email: z.string(), password: z.string(), name: z.string() }))
    .mutation(async ({ input }) => {
      console.log("Mock signup attempt:", input);
      // In a real app, you'd create a new user.
      return { message: "Mock signup successful!" };
    }),
  // Other auth procedures like logout, getSession, etc.
});

// --- Business Router ---
const businessRouter = router({
  getBusinesses: publicProcedure.query(async ({ ctx }) => {
    console.log("Fetching mock businesses. User:", ctx.user?.email || "Guest");
    // In a real app, you'd fetch from db.getBusinesses or similar
    return [
      { id: "1", name: "Mock Business A" },
      { id: "2", name: "Mock Business B" },
    ];
  }),
});

// --- Service Router ---
const serviceRouter = router({
  getServices: publicProcedure.query(async ({ ctx }) => {
    console.log("Fetching mock services. User:", ctx.user?.email || "Guest");
    // In a real app, you'd fetch from db.getServices or similar
    return [
      { id: "s1", name: "Mock Service X", price: "50" },
      { id: "s2", name: "Mock Service Y", price: "75" },
    ];
  }),
});

// --- Appointment Router ---
const appointmentRouter = router({
  createAppointment: publicProcedure
    .input(
      z.object({
        businessId: z.string(),
        serviceId: z.string(),
        clientName: z.string(),
        clientEmail: z.string().email(),
        appointmentDate: z.date(),
        durationMinutes: z.number(),
        specialNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("Mock create appointment:", input);
      // In a real app, you'd save to db.createAppointment
      return { id: "mock_apt_123" };
    }),
});

// --- Main App Router ---
export const appRouter = router({
  auth: authRouter,
  businesses: businessRouter,
  services: serviceRouter,
  appointments: appointmentRouter,
  // Add other routers here
});

export type AppRouter = typeof appRouter;
