import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { ensureIndexes, type UserDoc } from "@/lib/db-schema";
import { getDb } from "@/lib/mongodb";
import { setSessionCookie } from "@/lib/session";

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: { params: { scope: "read:user user:email" } },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !user.email) return false;
      try {
        await ensureIndexes();
        const db = await getDb();
        const now = new Date();
        const providerId = account.providerAccountId ?? (profile as any)?.id?.toString() ?? "";
        const image = (profile as any)?.picture ?? (profile as any)?.avatar_url ?? user.image ?? "";

        // Upsert user document
        const result = await db.collection<UserDoc>("users").findOneAndUpdate(
          { provider: account.provider, providerId },
          {
            $set: {
              email: user.email,
              name: user.name ?? user.email,
              image,
              updatedAt: now,
            },
            $setOnInsert: {
              provider: account.provider,
              providerId,
              createdAt: now,
            },
          },
          { upsert: true, returnDocument: "after" },
        );

        const doc = result as any;
        // Attach the MongoDB _id so the jwt callback can use it
        (user as any).dbId = doc?._id?.toString() ?? "";

        return true;
      } catch (err) {
        console.error("[auth] signIn error:", err);
        return false;
      }
    },

    async jwt({ token, user, account, profile }) {
      if (account && user) {
        token.provider = account.provider;
        token.dbId = (user as any).dbId ?? "";
        const picture = (profile as any)?.picture ?? (profile as any)?.avatar_url ?? user.image;
        token.picture = picture ?? token.picture;
      }
      return token;
    },

    async session({ session, token }) {
      const u = (session.user ?? {}) as any;
      u.image = (token as any).picture ?? u.image;
      u.provider = (token as any).provider;
      u.id = (token as any).dbId ?? token.sub ?? "";
      session.user = u;

      // Set httpOnly session cookie for our own API layer
      try {
        setSessionCookie({
          userId: u.id,
          email: u.email ?? "",
          name: u.name ?? "",
          image: u.image ?? "",
          provider: u.provider ?? "",
        });
      } catch {
        // cookies() only works in certain contexts; ignore if not available
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
