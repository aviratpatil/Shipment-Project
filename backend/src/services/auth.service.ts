import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/error.middleware";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "default_development_jwt_secret_key";
const JWT_EXPIRES_IN = "24h";
const SALT_ROUNDS = 10;

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Register User
// ─────────────────────────────────────────────────────────────────────────────
export async function registerUser(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new AppError(409, "User with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      role: (data.role as UserRole) ?? UserRole.USER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// Login User
// ─────────────────────────────────────────────────────────────────────────────
export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw new AppError(401, "Invalid email or password.");
  }

  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get User Profile
// ─────────────────────────────────────────────────────────────────────────────
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return user;
}
