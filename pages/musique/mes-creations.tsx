import Head from "next/head";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient, Session } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AuthMode = "login" | "signup";

type MusicProfile = {
  id: string;
  user_id: string;
  email: string;
  public_name: string;
  role: "creator" | "admin" | "super_admin";
  creator_status: "new" | "trusted" | "limited" | "blocked";
};

type MusicCreation = {
  id: string;
  creator_id: string | null;
  title: string;
  public_author_name: string;
  description: string;
  author_note: string | null;
  external_url: string;
  embed_url: string | null;
  platform: string;
  creation_type: string;
  album_slug: string | null;
  album_title: string | null;
  track_number: number | null;
  status:
    | "pending"
    | "published"
    | "rejected"
    | "removed_user"
    | "removed_admin"
    | "flagged";
  rejection_reason: string | null;
  created_at: string;
  published_at: string | null;
  removed_at: string | null;
};

function statusLabel(status: MusicCreation["status"]) {
  switch (status) {
    case "pending":
      return "En attente de validation";
    case "published":
      return "Publiée";
    case "rejected":
      return "Refusée";
    case "removed_user":
      return "Retirée par vous";
    case "removed_admin":
      return "Retirée par Keefon";
    case "flagged":
      return "Signalée / à vérifier";
    default:
      return status;
  }
}

function statusClass(status: MusicCreation["status"]) {
  switch (status) {
    case "published":
      return "status published";
    case "pending":
      return "status pending";
    case "rejected":
    case "removed_admin":
      return "status rejected";
    case "removed_user":
      return "status removed";
    case "flagged":
      return "status flagged";
    default:
      return "status";
  }
}

function creationTypeLabel(type: string) {
  switch (type) {
    case "song":
      return "Chanson";
    case "clip":
      return "Clip";
    case "visual_album":
      return "Album visuel";
    case "soundscape":
      return "Paysage sonore";
    case "ai_experiment":
      return "Expérimentation IA";
    default:
      return "Autre";
  }
}

function isPasswordStrong(password: string) {
  const hasMinimumLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

  return hasMinimumLength && hasUppercase && hasSpecialCharacter;
}

export default function MesCreationsMusiquePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MusicProfile | null>(null);
  const [creations, setCreations] = useState<MusicCreation[]>([]);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [pageMessage, setPageMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const canCreateSpace = useMemo(() => {
    return Boolean(session && !profile && !isLoading);
  }, [session, profile, isLoading]);

  useEffect(() => {
    loadInitialData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession) {
        loadProfileThenCreations(newSession);
      } else {
        setProfile(null);
        setCreations([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadInitialData() {
    setIsLoading(true);
    setErrorMessage("");
    setPageMessage("");

    const { data } = await supabase.auth.getSession();

    setSession(data.session);

    if (data.session) {
      await loadProfileThenCreations(data.session);
    }

    setIsLoading(false);
  }

  async function loadProfileThenCreations(currentSession: Session) {
    const foundProfile = await loadExistingMusicProfile(currentSession);

    if (foundProfile) {
      await loadCreations(foundProfile.id);
    } else {
      setCreations([]);
    }
  }

  async function loadExistingMusicProfile(currentSession: Session) {
    const user = currentSession.user;

    if (!user.email) {
      setErrorMessage("Impossible de récupérer l’email du compte connecté.");
      return null;
    }

    const { data, error } = await supabase
      .from("zz_music_profiles_createurs")
      .select("id, user_id, email, public_name, role, creator_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setErrorMessage(
        `Impossible de vérifier le profil créateur. Compte connecté : ${user.email}.`
      );
      return null;
    }

    const foundProfile = (data as MusicProfile) || null;
    setProfile(foundProfile);

    return foundProfile;
  }

  async function loadCreations(profileId: string) {
    const { data, error } = await supabase
      .from("zz_music_creations_deposees")
      .select(
        "id, creator_id, title, public_author_name, description, author_note, external_url, embed_url, platform, creation_type, album_slug, album_title, track_number, status, rejection_reason, created_at, published_at, removed_at"
      )
      .eq("creator_id", profileId)
      .order("album_slug", { ascending: true, nullsFirst: false })
      .order("track_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMessage("Impossible de charger vos créations.");
      return;
    }

    setCreations((data || []) as MusicCreation[]);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsAuthLoading(true);
    setErrorMessage("");
    setPageMessage("");

    if (!authEmail.trim() || !authPassword.trim()) {
      setErrorMessage("Indique un email et un mot de passe.");
      setIsAuthLoading(false);
      return;
    }

    if (!isPasswordStrong(authPassword)) {
      setErrorMessage(
        "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 caractère spécial."
      );
      setIsAuthLoading(false);
      return;
    }

    if (authMode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      setIsAuthLoading(false);

      if (error) {
        console.error(error);
        setErrorMessage(
          "Connexion impossible. Vérifie l’email et le mot de passe."
        );
        return;
      }

      setSession(data.session);
      setPageMessage("Connexion réussie.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
    });

    setIsAuthLoading(false);

    if (error) {
      console.error(error);
      setErrorMessage(`Création du compte impossible : ${error.message}`);
      return;
    }

    if (!data.session) {
      setPageMessage(
        "Compte créé. Si une confirmation email est demandée, il faudra confirmer le compte ou désactiver la confirmation email dans Supabase Auth."
      );
      return;
    }

    setSession(data.session);
    setPageMessage("Compte créé. Vous pouvez créer votre espace créateur.");
  }

  async function handleCreateCreatorSpace() {
    setIsCreatingProfile(true);
    setErrorMessage("");
    setPageMessage("");

    const { data, error } = await supabase
      .rpc("zz_music_create_creator_profile")
      .single();

    setIsCreatingProfile(false);

    if (error) {
      console.error(error);
      setErrorMessage(
        `Impossible de créer l’espace créateur. Erreur : ${error.message}`
      );
      return;
    }

    const createdProfile = data as MusicProfile;
    setProfile(createdProfile);
    setPageMessage("Espace créateur créé.");
    await loadCreations(createdProfile.id);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setCreations([]);
    setPageMessage("");
    setErrorMessage("");
  }

  async function handleRemoveCreation(creation: MusicCreation) {
    if (!profile) return;

    const confirmed = window.confirm(
      `Retirer "${creation.title}" de Keefon Music ?\n\nLa création ne sera plus affichée publiquement sur Keefon, mais votre lien d’origine restera inchangé sur sa plateforme.`
    );

    if (!confirmed) return;

    setIsUpdating(true);
    setErrorMessage("");
    setPageMessage("");

    const { error } = await supabase
      .from("zz_music_creations_deposees")
      .update({
        status: "removed_user",
        removed_at: new Date().toISOString(),
      })
      .eq("id", creation.id)
      .eq("creator_id", profile.id);

    setIsUpdating(false);

    if (error) {
      console.error(error);
      setErrorMessage(`Impossible de retirer la fiche. Erreur : ${error.message}`);
      return;
    }

    setPageMessage("La fiche a été retirée de Keefon Music.");
    await loadCreations(profile.id);
  }

  return (
    <>
      <Head>
        <title>Mes créations — Keefon Music</title>
        <meta
          name="description"
          content="Espace créateur Keefon Music : voir et gérer ses créations."
        />
      </Head>

      <main className="page">
        <header className="header">
          <a href="/musique" className="brand">
            Keefon Music
          </a>

          <nav>
            <a href="/musique">Retour musique</a>
            <a href="/musique/proposer">Proposer</a>

            {session && (
              <button type="button" onClick={handleLogout}>
                Déconnexion
              </button>
            )}
          </nav>
        </header>

        <section className="box">
          <p className="label">Espace créateur</p>

          <h1>Mes créations</h1>

          <p>
            Retrouvez ici les créations que vous avez proposées à Keefon Music.
            Vous pouvez suivre leur statut et retirer vous-même une fiche Keefon
            quand vous le souhaitez.
          </p>

          <div className="infoBox">
            <h2>Important</h2>

            <p>
              Retirer une fiche de Keefon Music ne supprime pas votre création
              d’origine sur YouTube, Suno, SoundCloud, Bandcamp, Spotify,
              TikTok ou une autre plateforme.
            </p>

            <p>
              Cela retire uniquement la fiche affichée sur Keefon Music. Vous
              gardez vos droits, vos plateformes et vos statistiques.
            </p>
          </div>

          {isLoading && <p className="notice">Chargement...</p>}
          {errorMessage && <p className="error">{errorMessage}</p>}
          {pageMessage && <p className="success">{pageMessage}</p>}

          {!session && !isLoading && (
            <div className="authBox">
              <div className="authTabs">
                <button
                  type="button"
                  className={authMode === "login" ? "tab active" : "tab"}
                  onClick={() => setAuthMode("login")}
                >
                  Se connecter
                </button>

                <button
                  type="button"
                  className={authMode === "signup" ? "tab active" : "tab"}
                  onClick={() => setAuthMode("signup")}
                >
                  Créer un compte
                </button>
              </div>

              <form onSubmit={handleAuth} className="loginForm">
                <h2>
                  {authMode === "login"
                    ? "Connexion créateur"
                    : "Créer un compte créateur"}
                </h2>

                <label>
                  Email
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="adresse@email.com"
                    required
                  />
                </label>

                <label>
                  Mot de passe
                  <div className="passwordField">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authPassword}
                      onChange={(event) =>
                        setAuthPassword(event.target.value)
                      }
                      placeholder="Minimum 8 caractères, 1 majuscule, 1 symbole"
                      required
                    />

                    <button
                      type="button"
                      className="passwordToggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      title={showPassword ? "Masquer" : "Afficher"}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </label>

                <p className="passwordHelp">
                  Le mot de passe doit contenir au moins 8 caractères, une
                  majuscule et un caractère spécial.
                </p>

                <button
                  type="submit"
                  className="primary"
                  disabled={isAuthLoading}
                >
                  {isAuthLoading
                    ? "Patiente..."
                    : authMode === "login"
                    ? "Se connecter"
                    : "Créer mon compte"}
                </button>
              </form>
            </div>
          )}

          {canCreateSpace && (
            <div className="connectedBox">
              <h2>Créer mon espace créateur</h2>

              <p>
                Vous êtes connecté, mais aucun espace créateur Keefon Music
                n’est encore associé à ce compte.
              </p>

              <p className="notice">
                Cet espace permet de proposer des créations, de suivre leur
                validation et de retirer vous-même vos fiches Keefon.
              </p>

              <button
                type="button"
                className="primary"
                onClick={handleCreateCreatorSpace}
                disabled={isCreatingProfile}
              >
                {isCreatingProfile
                  ? "Création en cours..."
                  : "Créer mon espace créateur"}
              </button>
            </div>
          )}

          {session && profile && (
            <div className="connectedBox">
              <p>
                Connecté comme <strong>{profile.public_name}</strong> —{" "}
                {profile.email}
              </p>

              <p className="notice">
                Rôle : {profile.role} — Statut créateur :{" "}
                {profile.creator_status}
              </p>
            </div>
          )}

          {session && profile && creations.length === 0 && (
            <div className="emptyBox">
              <h2>Aucune création pour le moment</h2>

              <p>
                Vous n’avez pas encore proposé de création sur Keefon Music.
              </p>

              <a href="/musique/proposer" className="primary">
                Proposer une création
              </a>
            </div>
          )}

          {session && profile && creations.length > 0 && (
            <div className="creationsList">
              {creations.map((creation) => {
                const canRemove =
                  creation.status === "published" ||
                  creation.status === "pending";

                return (
                  <article key={creation.id} className="creationCard">
                    <div className="creationHeader">
                      <div>
                        <p className="creationType">
                          {creationTypeLabel(creation.creation_type)}
                          {creation.album_title && (
                            <> · {creation.album_title}</>
                          )}
                          {creation.track_number && (
                            <> · Piste {creation.track_number}</>
                          )}
                        </p>

                        <h2>{creation.title}</h2>

                        <p className="notice">
                          Déposé le{" "}
                          {new Date(creation.created_at).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      </div>

                      <span className={statusClass(creation.status)}>
                        {statusLabel(creation.status)}
                      </span>
                    </div>

                    <p>{creation.description}</p>

                    {creation.author_note && (
                      <div className="authorNote">
                        <strong>Note de l’auteur</strong>
                        <p>{creation.author_note}</p>
                      </div>
                    )}

                    {creation.rejection_reason && (
                      <p className="error">
                        Motif de refus : {creation.rejection_reason}
                      </p>
                    )}

                    <div className="actions">
                      <a
                        href={creation.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="secondary"
                      >
                        Ouvrir le lien source
                      </a>

                      {canRemove && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleRemoveCreation(creation)}
                          disabled={isUpdating}
                        >
                          Retirer de Keefon
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }

          .page {
            min-height: 100vh;
            color: white;
            background-image: url("/musique/bg-musique.png");
            background-size: cover;
            background-position: center top;
            background-repeat: no-repeat;
            background-attachment: fixed;
            padding: 32px 24px 80px;
          }

          .header,
          .box {
            width: min(100%, 1050px);
            margin-left: auto;
            margin-right: auto;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            margin-bottom: 70px;
          }

          .brand {
            color: white;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 900;
          }

          nav {
            display: flex;
            gap: 16px;
            align-items: center;
            flex-wrap: wrap;
          }

          nav a,
          nav button {
            color: white;
            text-decoration: none;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.28);
            border-radius: 999px;
            padding: 9px 15px;
            cursor: pointer;
          }

          .box {
            background: rgba(0, 0, 0, 0.46);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 28px;
            padding: 42px;
          }

          .label,
          .creationType {
            color: #f5c76d;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-size: 0.8rem;
            font-weight: 800;
            margin-bottom: 14px;
          }

          h1 {
            font-size: clamp(2.6rem, 6vw, 5rem);
            line-height: 0.95;
            margin: 0 0 22px;
            font-weight: 500;
          }

          h2 {
            font-size: 1.7rem;
            margin: 0 0 16px;
          }

          p {
            line-height: 1.7;
          }

          .infoBox,
          .authBox,
          .loginForm,
          .connectedBox,
          .emptyBox,
          .creationCard {
            margin-top: 28px;
            padding: 24px;
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
          }

          .infoBox {
            background: rgba(245, 199, 109, 0.1);
            border: 1px solid rgba(245, 199, 109, 0.32);
          }

          .infoBox h2 {
            margin-bottom: 14px;
            font-size: 1.35rem;
          }

          .loginForm {
            margin-top: 18px;
          }

          .authTabs {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }

          .tab {
            min-height: 42px;
            padding: 0 18px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.28);
            background: rgba(0, 0, 0, 0.3);
            color: white;
            font-weight: 800;
            cursor: pointer;
          }

          .tab.active {
            background: #f5c76d;
            color: #111;
          }

          label {
            display: block;
            margin-bottom: 16px;
            font-weight: 800;
          }

          input {
            width: 100%;
            margin-top: 8px;
            padding: 13px 14px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.22);
            background: rgba(0, 0, 0, 0.44);
            color: white;
            font: inherit;
          }

          .passwordField {
            position: relative;
          }

          .passwordField input {
            padding-right: 56px;
          }

          .passwordToggle {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.22);
            background: rgba(0, 0, 0, 0.35);
            color: white;
            cursor: pointer;
            font-size: 1rem;
          }

          .passwordHelp {
            margin-top: -6px;
            margin-bottom: 18px;
            opacity: 0.78;
            font-size: 0.92rem;
          }

          .primary,
          .secondary,
          .danger {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 46px;
            padding: 0 22px;
            border-radius: 999px;
            text-decoration: none;
            font-weight: 900;
            cursor: pointer;
          }

          .primary {
            border: 0;
            background: #f5c76d;
            color: #111;
          }

          .secondary {
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.38);
            background: rgba(0, 0, 0, 0.22);
          }

          .danger {
            border: 1px solid rgba(255, 115, 115, 0.45);
            background: rgba(255, 70, 70, 0.16);
            color: white;
          }

          .primary:disabled,
          .danger:disabled {
            opacity: 0.6;
            cursor: wait;
          }

          .notice {
            opacity: 0.78;
          }

          .success,
          .error {
            padding: 14px 16px;
            border-radius: 16px;
            margin-top: 18px;
          }

          .success {
            background: rgba(80, 220, 140, 0.18);
            border: 1px solid rgba(80, 220, 140, 0.4);
          }

          .error {
            background: rgba(255, 90, 90, 0.18);
            border: 1px solid rgba(255, 90, 90, 0.42);
          }

          .creationsList {
            margin-top: 32px;
            display: grid;
            gap: 18px;
          }

          .creationHeader {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            align-items: flex-start;
          }

          .status {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 34px;
            padding: 0 12px;
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 900;
            white-space: nowrap;
          }

          .status.pending {
            background: rgba(245, 199, 109, 0.16);
            border: 1px solid rgba(245, 199, 109, 0.45);
          }

          .status.published {
            background: rgba(80, 220, 140, 0.16);
            border: 1px solid rgba(80, 220, 140, 0.45);
          }

          .status.rejected {
            background: rgba(255, 90, 90, 0.16);
            border: 1px solid rgba(255, 90, 90, 0.45);
          }

          .status.removed {
            background: rgba(170, 170, 170, 0.16);
            border: 1px solid rgba(220, 220, 220, 0.28);
          }

          .status.flagged {
            background: rgba(255, 145, 70, 0.16);
            border: 1px solid rgba(255, 145, 70, 0.45);
          }

          .authorNote {
            margin-top: 18px;
            padding: 16px;
            border-radius: 16px;
            background: rgba(0, 0, 0, 0.24);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 20px;
          }

          @media (max-width: 800px) {
            .page {
              background-attachment: scroll;
              padding: 24px 18px 60px;
            }

            .header {
              align-items: flex-start;
              flex-direction: column;
              margin-bottom: 45px;
            }

            .box {
              padding: 28px;
            }

            .creationHeader {
              flex-direction: column;
            }
          }
        `}</style>
      </main>
    </>
  );
}