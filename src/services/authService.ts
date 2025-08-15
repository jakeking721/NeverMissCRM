// src/services/authService.ts
import { loginUser, registerUser, logoutUser, saveCurrentUser } from "../utils/auth";
import type { User } from "../utils/auth";

export const authService = {
  loginUser,
  registerUser,
  logoutUser,
  saveCurrentUser,
};
export type { User };
