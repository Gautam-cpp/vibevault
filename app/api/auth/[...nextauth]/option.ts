import { prisma } from "@/src/lib/prisma";
import { emailSchema, passwordSchema } from "@/src/schema/signInSchema";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: { email: string; password: string } | undefined): Promise<any | null> {
        if (!credentials) return null;

        try {
          const email = await emailSchema.parseAsync(credentials.email);
          const password = await passwordSchema.parseAsync(credentials.password);

          const user = await prisma.user.findUnique({ where: { email } });

          if (!user) throw new Error("User not found");

          const isPasswordCorrect = await bcrypt.compare(password, user.password || "");
          if (user.provider === "Credentials" && isPasswordCorrect) {
            return user;
          } else {
            throw new Error("Invalid credentials");
          }
        } catch (error) {
          if (error instanceof ZodError) {
            console.error("Validation error:", error.errors);
          } else {
            console.error("Authorization error:", error);
          }
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // For credential users, use the user.id directly
        if (!account) {
          token.id = user.id;
          token.provider = user.provider;
        } 
        // For OAuth providers, we need to find or create the user in our DB
        else if (account && account.provider === "Google") {
          token.provider = account.provider;
          
          // Find or create the user in the database
          const dbUser = await prisma.user.upsert({
            where: { email: user.email || "" },
            update: {}, 
            create: {
              email: user.email || "",
              name: user.name || user.email?.split("@")[0],
              password: null,
              provider: "Google", 
            },
            
            select: { id: true }
          });
          
          
          token.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        provider: token.provider as string,
      };
      return session;
    },
  },

  // Optional: Uncomment if you plan to add custom pages
  pages: {
    signIn: "/signin",
    error: "/auth/error", // Add custom error page if needed
  },
};
