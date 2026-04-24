import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BASE_URL,
  fetchOptions: {credentials: 'include'},
})

export const { signIn, signUp, useSession } = authClient;