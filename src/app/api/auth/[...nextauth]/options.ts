import {  NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/utils/hashPassword";
import generateUsername from "@/utils/usernameGenerator";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: {
          label: "Email or Username",
          type: "text",
          placeholder: "Enter your email or username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials) {
          throw new Error("No credentials provided.");
        }

        const { identifier, password } = credentials;

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ username: identifier }, { email: identifier }],
            },
          });

          if (!user) {
            throw new Error("No user found with these credentials");
          }

          if (!user.isVerified) {
            throw new Error("Please verify your email before logging in.");
          }

          if (!user.password) {
            throw new Error(
              "This user has not set a password. Please use OAuth to log in."
            );
          }

          const hashedPassword = user.password;
          const isPasswordMatch = await comparePassword(
            password,
            hashedPassword
          );
          if (!isPasswordMatch) {
            throw new Error("Incorrect password. Please try again.");
          }

          return {
            id: user.id,
            username: user.username,
            isVerified: user.isVerified,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error: any) {
          throw new Error(error.message || "Something went wrong.");
        }
      },
    }),
    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // GitHub Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({user, account, profile }) {
      try {
        if (!user.email) {
          throw new Error("Email is missing from user object.");
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Create new user if not exists
          const generatedUsername = await generateUsername(user.email);

          const newUser = await prisma.user.create({
            data: {
              name: user.name || "",
              email: user.email!,
              username: generatedUsername,
              password: "",
              image: user.image || null,
              isVerified: true, // OAuth user considered verified
            },
          });
        }

        return true;
        
      } catch (error) {
        console.error("SignIn Callback Error:", error);
        return false;
      }
    },
    async jwt({ token, user,account }) {
      if (user) {
        token.id = user.id;
        if (account?.provider === "credentials") {
          token.username = user.username;
          token.isVerified = user.isVerified;
        }else{
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: {
              username: true,
              isVerified: true,
            },
          });
          if (dbUser) {
            token.username = dbUser.username;
            token.isVerified = dbUser.isVerified;
          } else {
            throw new Error("User not found in database.");
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.isVerified = token.isVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Refresh token every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // JWT expiry time - 30 days
  },
  secret: process.env.NEXTAUTH_SECRET!,
};
