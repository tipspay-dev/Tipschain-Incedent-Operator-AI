import { PrismaClient } from "@prisma/client";

declare global {
  var __tipspayPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__tipspayPrisma__ ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__tipspayPrisma__ = prisma;
}
