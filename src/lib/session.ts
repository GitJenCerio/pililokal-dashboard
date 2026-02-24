import { sealData, unsealData } from "iron-session";

const SESSION_COOKIE = "pililokal_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type IronSessionData = {
  userId: string;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters. Generate with: openssl rand -base64 32"
    );
  }
  return secret;
}

export async function sealSession(data: IronSessionData): Promise<string> {
  return sealData(data, {
    password: getSessionSecret(),
    ttl: SESSION_MAX_AGE,
  });
}

export async function unsealSession(cookieValue: string): Promise<IronSessionData | null> {
  try {
    const data = await unsealData<IronSessionData>(cookieValue, {
      password: getSessionSecret(),
      ttl: SESSION_MAX_AGE,
    });
    return data && typeof data.userId === "string" ? data : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
