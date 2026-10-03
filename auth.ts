import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getRequiredEnv } from "@/lib/env";

const googleClientId = getRequiredEnv("AUTH_GOOGLE_ID");
const googleClientSecret = getRequiredEnv("AUTH_GOOGLE_SECRET");
const authSecret = getRequiredEnv("AUTH_SECRET");

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
