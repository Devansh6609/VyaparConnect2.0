// src/lib/socket.ts
import { Server as IOServer } from "socket.io";

export function getIO(): IOServer | undefined {
  return (global as any).io as IOServer | undefined;
}
