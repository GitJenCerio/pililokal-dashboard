const REQUIRED_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "SESSION_SECRET",
] as const;

const PLACEHOLDER_VALUES = [
  "your-32-char-secret-here-change-in-production",
  "your-secret-here",
  "change-me",
  "localhost",
];

export function validateEnvironment(): void {
  if (process.env.NODE_ENV !== "production") return; // Only validate in production

  const errors: string[] = [];

  for (const varName of REQUIRED_VARS) {
    const val = process.env[varName];
    if (!val) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }
    if (PLACEHOLDER_VALUES.some((p) => val.includes(p))) {
      errors.push(`${varName} still has placeholder value — set a real value`);
    }
  }

  // Validate NEXTAUTH_URL points to HTTPS in production
  const authUrl = process.env.NEXTAUTH_URL ?? "";
  if (authUrl && !authUrl.startsWith("https://")) {
    errors.push("NEXTAUTH_URL must start with https:// in production");
  }

  // Validate secrets are long enough
  if ((process.env.NEXTAUTH_SECRET?.length ?? 0) < 32) {
    errors.push("NEXTAUTH_SECRET must be at least 32 characters");
  }
  if ((process.env.SESSION_SECRET?.length ?? 0) < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters");
  }

  if (errors.length > 0) {
    console.error("\n❌ ENVIRONMENT VALIDATION FAILED:\n");
    errors.forEach((e) => console.error(`  • ${e}`));
    console.error("\nFix these issues before deploying.\n");
    process.exit(1);
  }

  console.log("✅ Environment validation passed");
}
