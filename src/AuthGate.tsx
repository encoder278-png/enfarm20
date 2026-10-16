
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getClientAuth, getClientDb } from "./firebaseClient";

type UserRole = "admin" | "field_officer";

type Session = {
  organizationId: string;
  role: UserRole;
};

type AuthGateProps = {
  children: (session: Session) => ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // Restore an existing Firebase sign-in, if there is one.
    useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthStateChanged(getClientAuth(), (currentUser) => {
        setUser(currentUser);
        setChecking(false);
      });
    } catch (err) {
      console.error("Firebase initialization failed:", err);
      setError("Firebase setup failed. Check your .env configuration.");
      setChecking(false);
    }

    return () => unsubscribe?.();
  }, []);
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSession(null);

    try {
      const auth = getClientAuth();
      const db = getClientDb();

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      setUser(result.user);

      const orgId = organizationId.trim();

      if (!orgId) {
        throw new Error("Enter your organization ID.");
      }

      const membershipRef = doc(
        db,
        "memberships",
        `${result.user.uid}_${orgId}`
      );

      const membershipSnapshot = await getDoc(membershipRef);

      if (!membershipSnapshot.exists()) {
        throw new Error("No membership was found for this organization.");
      }

      const membership = membershipSnapshot.data();

      if (
        membership.userId !== result.user.uid ||
        membership.organizationId !== orgId ||
        membership.status !== "active" ||
        !["admin", "field_officer"].includes(membership.role)
      ) {
        throw new Error("Your organization membership is invalid or inactive.");
      }

      setSession({
        organizationId: orgId,
        role: membership.role as UserRole,
      });
    } catch (err) {
      console.error("Login failed:", err);

      const message =
        err instanceof Error ? err.message : "Unable to sign in.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setSession(null);
    setUser(null);

    try {
      await signOut(getClientAuth());
    } catch (err) {
      console.error("Sign-out failed:", err);
      setError("Could not sign out. Please try again.");
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-white flex items-center justify-center">
        Checking your sign-in...
      </div>
    );
  }

  if (session && user) {
    return (
      <div className="min-h-screen">
        <div className="bg-[#111827] text-white px-4 py-2 flex justify-between items-center">
          <span className="text-sm">
            Organization: {session.organizationId} · {session.role}
          </span>
          <button
            onClick={handleSignOut}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm"
          >
            Sign out
          </button>
        </div>

        {children(session)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold">EnFarm Organization Access</h1>

        <p className="text-sm text-slate-400">
          Sign in with your authorized organization account.
        </p>

        <label className="block text-sm">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-700 p-3"
            placeholder="you@organization.org"
          />
        </label>

        <label className="block text-sm">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-700 p-3"
            placeholder="Your password"
          />
        </label>

        <label className="block text-sm">
          Organization ID
          <input
            required
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-700 p-3"
            placeholder="Your organization's ID"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-400 break-words">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 p-3 font-semibold"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
