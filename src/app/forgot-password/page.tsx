import Image from "next/image";
import Link from "next/link";
import { ForgotPasswordForm } from "./form";

export default function ForgotPasswordPage() {
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
            Forgot Password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
