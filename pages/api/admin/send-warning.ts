// -*- coding: utf-8 -*-
// Keefon — API Admin : envoi d’avertissements par SMTP (IONOS)
// Règles : robuste, simple, maintenable, commentaires conservés, 100% UTF-8.

import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

// --- Sécurité : client Supabase côté serveur, avec Service Role (validation admin) ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- utilitaire simple pour valider une adresse (suffisant pour usage interne admin) ---
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// --- Transport SMTP IONOS (STARTTLS sur 587) ---
const transporter = nodemailer.createTransport({
  host: process.env.IONOS_SMTP_HOST,
  port: Number(process.env.IONOS_SMTP_PORT || 587),
  secure: false, // STARTTLS
  auth: {
    user: process.env.IONOS_SMTP_USER,
    pass: process.env.IONOS_SMTP_PASS,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Méthode
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    // --- Authentification : JWT Supabase du demandeur ---
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "missing_token" });

    const { data: userRes } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (!user) return res.status(401).json({ error: "invalid_token" });

    // --- Vérifier rôle admin/superadmin ---
    const { data: pr, error: prErr } = await supabase
      .from("profiles")
      .select("is_admin, is_superadmin")
      .eq("id", user.id)
      .maybeSingle();

    if (prErr) return res.status(500).json({ error: "profile_lookup_failed" });
    if (!pr?.is_admin && !pr?.is_superadmin) return res.status(403).json({ error: "forbidden" });

    // --- Payload ---
    const { to, subject, body, bcc } = (req.body || {}) as {
      to: string; subject: string; body: string; bcc?: string | null;
    };

    if (!to || !isEmail(to)) return res.status(400).json({ error: "invalid_to" });
    if (!subject || typeof subject !== "string") return res.status(400).json({ error: "invalid_subject" });
    if (!body || typeof body !== "string") return res.status(400).json({ error: "invalid_body" });

    // *** Bornes anti-abus côté serveur (simples) ***
    const sub = subject.trim().slice(0, 200);
    const txt = body.trim().slice(0, 4000);
    const bccClean = bcc && isEmail(bcc) ? bcc : undefined;

    // --- Envoi ---
    await transporter.sendMail({
      from: `"Keefon" <${process.env.IONOS_SMTP_USER}>`,
      to,
      bcc: bccClean,          // archivage si fourni
      subject: sub,
      text: txt,              // texte brut pour simplicité/robustesse
      // html: txt.replace(/\n/g, "<br/>"), // si un jour tu veux de l’HTML
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    // Journaliser côté serveur si nécessaire (console.error)
    return res.status(500).json({ error: "smtp_send_failed", detail: e?.message || String(e) });
  }
}
