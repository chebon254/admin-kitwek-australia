import { prisma } from "@/lib/prisma";

function isSmsEnabled(): boolean {
  return (
    process.env.TWILIO_ENABLED === "true" &&
    Boolean(process.env.TWILIO_ACCOUNT_SID) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.TWILIO_PHONE_NUMBER)
  );
}

function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const normalized = trimmed.startsWith("+")
    ? `+${trimmed.slice(1).replace(/\D/g, "")}`
    : `+${trimmed.replace(/\D/g, "")}`;

  return normalized.length > 1 ? normalized : null;
}

async function resolveRecipientPhone(email?: string, directPhone?: string): Promise<string | null> {
  const direct = normalizePhoneNumber(directPhone);
  if (direct) return direct;
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { phone: true },
  });

  return normalizePhoneNumber(user?.phone ?? null);
}

export async function sendSmsIfPossible(params: {
  email?: string;
  phone?: string;
  message: string;
}): Promise<void> {
  if (!isSmsEnabled()) return;
  if (!params.message?.trim()) return;

  const to = await resolveRecipientPhone(params.email, params.phone);
  if (!to) return;

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: params.message.trim().slice(0, 1600),
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio SMS error: ${response.status} - ${errorText}`);
  }
}

