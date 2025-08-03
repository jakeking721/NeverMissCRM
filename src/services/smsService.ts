// src/services/smsService.ts
// ------------------------------------------------------------------------------------
// Local, fake SMS service that mimics what a Twilio (or similar) wrapper will look like.
// Used by Dashboard (test send), CampaignBuilder, etc.
// - Estimates credits by message length & recipient count
// - "Sends" and "schedules" are just logged to localStorage for now
//
// TODO:
// - Replace with real provider (Twilio/etc.)
// - Server-side scheduling, delivery status, retries
// ------------------------------------------------------------------------------------

import { DEFAULT_SMS_COST_PER_SEGMENT } from "@/utils/credits";

export type SmsSendResult = {
  success: boolean;
  id?: string;
  scheduledFor?: string;
};

export interface SmsService {
  /**
   * Estimate credits needed for the message.
   * Default calc: (segments * recipients * COST_PER_SEGMENT)
   */
  estimateCredits: (message: string, recipients: number) => number;

  /** Immediate bulk send (fake/local). */
  sendBulk: (phones: string[], message: string) => Promise<SmsSendResult>;

  /** Schedule a future bulk send (fake/local). */
  scheduleBulk: (phones: string[], message: string, whenISO: string) => Promise<SmsSendResult>;

  /** One-off test send to a single recipient (fake/local). */
  sendTest: (to: string, message: string) => Promise<SmsSendResult>;
}

const COST_PER_SEGMENT = DEFAULT_SMS_COST_PER_SEGMENT;

function smsLogKey(userKey: string | null | undefined) {
  return `sms_log_${userKey ?? "anonymous"}`;
}

function readLog(userKey: string | null | undefined): any[] {
  try {
    const raw = localStorage.getItem(smsLogKey(userKey));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLog(userKey: string | null | undefined, entries: any[]) {
  localStorage.setItem(smsLogKey(userKey), JSON.stringify(entries));
}

function logSend(
  userKey: string | null | undefined,
  entry: {
    id: string;
    type: "bulk" | "test" | "schedule";
    phones: string[];
    message: string;
    createdAt: string;
    scheduledFor?: string;
    segments: number;
    creditsEstimated: number;
  }
) {
  const list = readLog(userKey);
  list.push(entry);
  writeLog(userKey, list);
}

function countSegments(message: string): number {
  // Super naive 160-char hard split. Real world: GSM-7/Unicode, UDH, etc.
  return Math.max(1, Math.ceil((message ?? "").length / 160));
}

export function getSmsService(userKey: string | null | undefined): SmsService {
  return {
    estimateCredits(message: string, recipients: number) {
      const segments = countSegments(message);
      return segments * Math.max(0, recipients) * COST_PER_SEGMENT;
    },

    async sendBulk(phones: string[], message: string) {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const segments = countSegments(message);
      const creditsEstimated = segments * phones.length * COST_PER_SEGMENT;

      // Log locally (fake)
      logSend(userKey, {
        id,
        type: "bulk",
        phones,
        message,
        createdAt: new Date().toISOString(),
        segments,
        creditsEstimated,
      });

      // Simulate network
      await sleep(200);
      alert("No SMS sent - Feature coming soon");
      return { success: true, id };
    },

    async scheduleBulk(phones: string[], message: string, whenISO: string) {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const segments = countSegments(message);
      const creditsEstimated = segments * phones.length * COST_PER_SEGMENT;

      logSend(userKey, {
        id,
        type: "schedule",
        phones,
        message,
        createdAt: new Date().toISOString(),
        scheduledFor: whenISO,
        segments,
        creditsEstimated,
      });

      await sleep(200);
      alert("No SMS sent - Feature coming soon");
      return { success: true, id, scheduledFor: whenISO };
    },

    async sendTest(to: string, message: string) {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const segments = countSegments(message);
      const creditsEstimated = segments * 1 * COST_PER_SEGMENT;

      logSend(userKey, {
        id,
        type: "test",
        phones: [to],
        message,
        createdAt: new Date().toISOString(),
        segments,
        creditsEstimated,
      });

      await sleep(150);
      alert("No SMS sent - Feature coming soon");
      return { success: true, id };
    },
  };
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
