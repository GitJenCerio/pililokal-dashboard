import Image from "next/image";
import Link from "next/link";
import { ResetPasswordForm } from "./form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  return (
    <main className="flex min-h-screen items-center justify-center bg-pililokal-cream">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-pililokal-brown/10 bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Pililokal"
            width={220}
            height={66}
            className="mb-4 h-16 w-auto object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight text-pililokal-brown">
            Reset Password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-center text-sm text-destructive">
            Invalid reset link.{" "}
            <Link href="/forgot-password" className="text-primary hover:underline">
              Request a new one
            </Link>
          </p>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
