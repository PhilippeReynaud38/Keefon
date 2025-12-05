// -*- coding: utf-8 -*-
// Keefon — API Admin : envoi d’avertissements par SMTP (IONOS)
// Règles : robuste, simple, maintenable, commentaires conservés, 100% UTF-8.

import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

// Client Supabase côté serveur (Service Role) pour vérifier l’admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ok = { ok: true };
type Err = { error: string; detail?: string };

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { to, subject, body, bcc } = req.body || {};

  if (!to || typeof to !== "string" || !isEmail(to)) {
    return res.status(400).json({ error: "invalid_to" });
  }
  if (!subject || typeof subject !== "string") {
    return res.status(400).json({ error: "invalid_subject" });
  }
  if (!body || typeof body !== "string") {
    return res.status(400).json({ error: "invalid_body" });
  }

  // --- Auth: uniquement admin / superadmin ---
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "missing_token" });
  }

  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  const user = userRes?.user;
  if (userErr || !user) {
    return res
      .status(401)
      .json({ error: "invalid_token", detail: userErr?.message });
  }

  const { data: pr, error: prErr } = await supabase
    .from("profiles")
    .select("is_admin, is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (prErr) {
    return res
      .status(500)
      .json({ error: "profile_lookup_failed", detail: prErr.message });
  }
  if (!pr?.is_admin && !pr?.is_superadmin) {
    return res.status(403).json({ error: "forbidden" });
  }

  // --- Config SMTP IONOS ---
  const smtpHost = process.env.IONOS_SMTP_HOST || "smtp.ionos.fr"; // fallback
  const smtpPort = Number(process.env.IONOS_SMTP_PORT || 587);
  const smtpUser = process.env.IONOS_SMTP_USER;
  const smtpPass = process.env.IONOS_SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    return res.status(500).json({
      error: "smtp_config_missing",
      detail: "IONOS_SMTP_USER ou IONOS_SMTP_PASS manquant",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,          // ← ICI on force bien smtp.ionos.fr
      port: smtpPort,          // 587 par défaut
      secure: smtpPort === 465, // false pour 587 (STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const toClean = to.trim();
    const bccClean =
      typeof bcc === "string" && bcc.trim().length ? bcc.trim() : undefined;
    const sub = subject.toString().trim().slice(0, 200);
    const txt = body.toString().trim();

    await transporter.sendMail({
      from: `"Keefon" <${smtpUser}>`,
      to: toClean,
      bcc: bccClean,
      subject: sub,
      text: txt,
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("SMTP error:", e);
    return res.status(500).json({
      error: "smtp_send_failed",
      detail: e?.message || String(e),
    });
  }
}
