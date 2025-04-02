/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import User from "@/app/models/User";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                await connectDB();

                const user = await User.findOne({ email: credentials?.email });
                if (!user) throw new Error("Invalid credentials");
                console.log("user", user)

                if (!user || !(await compare(credentials.password, user.password))) {
                    throw new Error("Invalid credentials");
                }

                return { id: user.id, email: user.email, profileImage: user.profileImage };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.profileImage = user.profileImage
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                (session.user as any).id = token.id as string;
                (session.user as any).profileImage = token.profileImage as string;
            }
            return session;
        }
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };