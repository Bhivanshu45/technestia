import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/utils/hashPassword";
import generateUsername from "@/utils/usernameGenerator";
import logger from "@/lib/logger";

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

        logger.info("nextauth.credentials.authorization_started",{identifier});

        try {
          logger.info("nextauth.credentials.finding_user",{identifierType: identifier.includes("@") ? "email" : "username", identifier });
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ username: identifier }, { email: identifier }],
            },
          });

          if (!user) {
            logger.warn("nextauth.credentials.user_not_found",{identifier });
            throw new Error("No user found with these credentials");
          }

          if (!user.isVerified) {
            logger.warn("nextauth.credentials.user_not_verified",{identifier });
            throw new Error("Please verify your email before logging in.");
          }

          if (!user.password) {
            logger.warn("nextauth.credentials.password_missing",{identifier});
            throw new Error(
              "This user has not set a password. Please use OAuth to log in.",
            );
          }

          logger.info("nextauth,credentials.password_verification_started",{identifier});

          const hashedPassword = user.password;
          const isPasswordMatch = await comparePassword(
            password,
            hashedPassword,
          );
          if (!isPasswordMatch) {
            logger.warn("nextauth.credentials.incorrect_password",{identifier});
            throw new Error("Incorrect password. Please try again.");
          }

          logger.info("nextauth.credentials.login_successful",{identifier});

          return {
            id: user.id,
            username: user.username,
            isVerified: user.isVerified,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error: any) {
          logger.error("nextauth.credentials.authorization_error", {
            identifier,
            errorMessage: error.message,
          });
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
    async signIn({ user, account, profile }) {
      logger.info("nextauth.signin_started", {
        provider: account?.provider,
        email: user.email,
      });
      logger.info("nextauth.signin_lookup_started", {
        email: user.email,
      });
      try {
        if (!user.email) {
          logger.warn("nextauth.signin.user_email_missing", {
            userId: user.id,
          });
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

          logger.info("nextauth.signin_oauth_user_created", {
            userId: newUser.id,
            email: newUser.email,
            provider: account?.provider,
          });

          return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            image: newUser.image,
          };
        }

        logger.info("nextauth.signin_existing_user", {
          userId: existingUser.id,
          email: existingUser.email,
          provider: account?.provider,
        });

        return {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          image: existingUser.image,
        };
      } catch (error) {
        logger.error("nextauth.signin_failed", {
          error: String(error),
          provider: account?.provider,
          email: user?.email,
        });
        return false;
      }
    },
    async jwt({ token, user, account }) {
      logger.info("nextauth.jwt_started", { hasUser: !!user, provider: account?.provider });
      if (user) {
        if (account?.provider === "credentials") {
          logger.info("nextauth.jwt_credentials_branch", { userId: user.id });
          token.id = user.id;
          token.username = user.username;
          token.isVerified = user.isVerified;
        } else {
          logger.info("nextauth.jwt_oauth_db_lookup_started", { email: user.email });
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: {
              id: true,
              username: true,
              isVerified: true,
            },
          });
          if (dbUser) {
            logger.info("nextauth.jwt_oauth_db_user_found", { userId: dbUser.id, email: user.email });
            token.id = dbUser.id;
            token.username = dbUser.username;
            token.isVerified = dbUser.isVerified;
          } else {
            logger.error("nextauth.jwt_oauth_db_user_missing", { email: user.email });
            throw new Error("User not found in database.");
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      logger.info("nextauth.session_started", { hasToken: !!token, hasSessionUser: !!session.user });
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.isVerified = token.isVerified;
      }
      logger.info("nextauth.session_populated", { userId: session.user?.id, username: session.user?.username });
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
