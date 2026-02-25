import { redirect } from "next/navigation";
import Image from "next/image";
import { getServerSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function HomePage() {
  const session = await getServerSession();
  if (session) {
    redirect("/dashboard");
  }
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
            Pililokal Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to view merchant progress
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
