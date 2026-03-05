import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, getUserByEmail } from "@/server/repositories/users";
import { jsonError } from "@/server/api";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid input", 400, parsed.error.flatten());
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await getUserByEmail(email);
    if (existing) {
      return jsonError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await createUser({
      email,
      passwordHash,
      name: parsed.data.name,
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    return jsonError("Failed to register", 500, error instanceof Error ? error.message : error);
  }
}
