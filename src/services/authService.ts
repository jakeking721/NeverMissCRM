// src/services/authService.ts
import {
  getCurrentUser,
  saveCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "../utils/auth";
import type { User } from "../utils/auth";

export const authService = {
  getCurrentUser,
  saveCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
};
export type { User };
