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

type MusicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

function detectPlatform(url: string) {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return "youtube";
  }

  if (lowerUrl.includes("suno.com")) return "suno";
  if (lowerUrl.includes("soundcloud.com")) return "soundcloud";
  if (lowerUrl.includes("bandcamp.com")) return "bandcamp";
  if (lowerUrl.includes("spotify.com")) return "spotify";
  if (lowerUrl.includes("tiktok.com")) return "tiktok";

  return "other";
}

function buildYoutubeEmbedUrl(url: string) {
  try {
    const cleanUrl = url.trim();

    if (cleanUrl.includes("youtu.be/")) {
      const id = cleanUrl.split("youtu.be/")[1]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    const parsedUrl = new URL(cleanUrl);
    const videoId = parsedUrl.searchParams.get("v");
    const playlistId = parsedUrl.searchParams.get("list");

    if (videoId) return `https://www.youtube.com/embed/${videoId}`;

    if (playlistId) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    }

    return "";
  } catch {
    return "";
  }
}

function buildEmbedUrl(url: string) {
  const platform = detectPlatform(url);

  if (platform === "youtube") {
    return buildYoutubeEmbedUrl(url);
  }

  return "";
}

function isPasswordStrong(password: string) {
  const hasMinimumLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

  return hasMinimumLength && hasUppercase && hasSpecialCharacter;
}

export default function ProposerCreationMusiquePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MusicProfile | null>(null);
  const [categories, setCategories] = useState<MusicCategory[]>([]);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [pageMessage, setPageMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(session && profile && profile.creator_status !== "blocked");
  }, [session, profile]);

  useEffect(() => {
    loadInitialData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession) {
        loadProfileAndCategories(newSession);
      } else {
        setProfile(null);
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
      await loadProfileAndCategories(data.session);
    } else {
      await loadCategories();
    }

    setIsLoading(false);
  }

  async function loadProfileAndCategories(currentSession: Session) {
    await loadExistingMusicProfile(currentSession);
    await loadCategories();
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from("zz_music_categories_modifiables")
      .select("id, name, slug, description, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      setErrorMessage("Impossible de charger les rubriques.");
      return;
    }

    setCategories(data || []);
  }

  async function loadExistingMusicProfile(currentSession: Session) {
    const user = currentSession.user;

    if (!user.email) {
      setErrorMessage("Impossible de récupérer l’email du compte connecté.");
      return;
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
      return;
    }

    setProfile((data as MusicProfile) || null);
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
    setPageMessage("Compte créé. Tu peux maintenant créer ton espace créateur.");
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

    setProfile(data as MusicProfile);
    setPageMessage(
      "Espace créateur créé. Tu peux maintenant proposer une création."
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setPageMessage("");
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPageMessage("");
    setErrorMessage("");

    if (!profile) {
      setErrorMessage("Tu dois avoir un espace créateur pour proposer une création.");
      return;
    }

    if (profile.creator_status === "blocked") {
      setErrorMessage("Ce compte ne peut pas proposer de création.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const title = String(formData.get("title") || "").trim();
    const publicAuthorName = String(
      formData.get("public_author_name") || ""
    ).trim();
    const description = String(formData.get("description") || "").trim();
    const authorNote = String(formData.get("author_note") || "").trim();
    const externalUrl = String(formData.get("external_url") || "").trim();
    const creationType = String(formData.get("creation_type") || "other");
    const categoryId = String(formData.get("category_id") || "");

    const rightsConfirmed = formData.get("rights_confirmed") === "on";
    const diffusionAgreed = formData.get("diffusion_agreed") === "on";
    const noPaymentAccepted = formData.get("no_payment_accepted") === "on";

    if (!title || !publicAuthorName || !description || !externalUrl) {
      setErrorMessage("Merci de remplir tous les champs obligatoires.");
      return;
    }

    if (!rightsConfirmed || !diffusionAgreed || !noPaymentAccepted) {
      setErrorMessage("Les confirmations obligatoires doivent être cochées.");
      return;
    }

    const platform = detectPlatform(externalUrl);
    const embedUrl = buildEmbedUrl(externalUrl);

    setIsSending(true);

    const { error } = await supabase.from("zz_music_creations_deposees").insert({
      creator_id: profile.id,
      title,
      public_author_name: publicAuthorName,
      description,
      author_note: authorNote || null,
      external_url: externalUrl,
      embed_url: embedUrl || null,
      platform,
      creation_type: creationType,
      category_id: categoryId || null,
      status: "pending",
      rights_confirmed: rightsConfirmed,
      diffusion_agreed: diffusionAgreed,
      no_payment_accepted: noPaymentAccepted,
    });

    setIsSending(false);

    if (error) {
      console.error(error);
      setErrorMessage(`Impossible d’envoyer la création. Erreur : ${error.message}`);
      return;
    }

    form.reset();

    setPageMessage(
      "Création envoyée. Elle apparaît maintenant en attente de validation admin."
    );
  }

  return (
    <>
      <Head>
        <title>Proposer une création — Keefon Music</title>
        <meta
          name="description"
          content="Proposer une chanson, un clip ou une création narrative sur Keefon Music."
        />
      </Head>

      <main className="page">
        <header className="header">
          <a href="/musique" className="brand">
            Keefon Music
          </a>

          <nav>
            <a href="/musique">Retour musique</a>
<a href="/musique/mes-creations">Mes créations</a>
            {session && (
              <button type="button" onClick={handleLogout}>
                Déconnexion
              </button>
            )}
          </nav>
        </header>

        <section className="box">
          <p className="label">Créateurs</p>

          <h1>Proposer une création</h1>

          <p>
            Keefon Music présente des créations qui racontent une histoire,
            installent une ambiance forte ou ouvrent une porte vers un univers
            original.
          </p>

          <p>
            Les fichiers restent hébergés sur YouTube, Suno, SoundCloud,
            Bandcamp, Spotify, TikTok ou une autre plateforme. Keefon affiche
            une fiche, une description et un lien vers la source.
          </p>

          <div className="infoBox">
            <h2>Comment fonctionne le dépôt ?</h2>

            <p>
              Keefon Music ne crée pas vos liens et n’héberge pas vos fichiers
              audio ou vidéo à votre place.
            </p>

            <p>
              Vous proposez un lien déjà existant vers votre création : YouTube,
              Suno, SoundCloud, Bandcamp, Spotify, TikTok ou toute autre
              plateforme adaptée.
            </p>

            <p>
              Keefon affiche uniquement une fiche de présentation avec votre
              titre, votre description, votre note d’auteur et un lien vers la
              création originale.
            </p>

            <p>
              Depuis votre espace créateur, vous pourrez retirer vous-même votre fiche Keefon quand vous le souhaitez. La création ne sera alors plus affichée publiquement sur Keefon Music.
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

          {session && !isLoading && !profile && (
            <div className="connectedBox">
              <h2>Créer mon espace créateur</h2>

              <p>
                Tu es connecté, mais aucun espace créateur Keefon Music n’est
                encore associé à ce compte.
              </p>

              <p className="notice">
                En créant cet espace, tu pourras proposer des créations, suivre
                leur validation et les retirer plus tard si besoin.
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

          {session && profile?.creator_status === "blocked" && (
            <p className="error">
              Ce compte est bloqué pour les dépôts de créations.
            </p>
          )}

          {canSubmit && (
            <form onSubmit={handleSubmit} className="proposalForm">
              <h2>Fiche de création</h2>

              <div className="formGrid">
                <label>
                  Titre de la création *
                  <input
                    name="title"
                    type="text"
                    placeholder="Ex : CALME — Piste 1 : 4H12"
                    required
                  />
                </label>

                <label>
                  Nom public du déposant *
                  <input
                    name="public_author_name"
                    type="text"
                    defaultValue={profile.public_name}
                    required
                  />
                </label>

                <label>
                  Type de création *
                  <select name="creation_type" defaultValue="song" required>
                    <option value="song">Chanson</option>
                    <option value="clip">Clip</option>
                    <option value="visual_album">Album visuel</option>
                    <option value="soundscape">Paysage sonore</option>
                    <option value="ai_experiment">Expérimentation IA</option>
                    <option value="other">Autre</option>
                  </select>
                </label>

                <label>
                  Rubrique souhaitée
                  <select name="category_id" defaultValue="">
                    <option value="">Aucune / à classer par Keefon</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Lien externe *
                <input
                  name="external_url"
                  type="url"
                  placeholder="YouTube, Suno, SoundCloud, Spotify..."
                  required
                />
              </label>

              <label>
                Description courte *
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Présente rapidement la création."
                  required
                />
              </label>

              <label>
                Note de l’auteur / info affichée au visiteur
                <textarea
                  name="author_note"
                  rows={5}
                  placeholder="Explique l’intention, l’histoire, l’ambiance ou le contexte de création."
                />
              </label>

              <div className="checks">
                <label>
                  <input name="rights_confirmed" type="checkbox" required />
                  <span>
                    Je confirme posséder les droits nécessaires sur cette
                    création.
                  </span>
                </label>

                <label>
                  <input name="diffusion_agreed" type="checkbox" required />
                  <span>
                    J’accepte que Keefon référence gratuitement cette création
                    avec une fiche et un lien externe.
                  </span>
                </label>

                <label>
                  <input
                    name="no_payment_accepted"
                    type="checkbox"
                    required
                  />
                  <span>
                    Je comprends que cette publication est gratuite et non
                    rémunérée par Keefon.
                  </span>
                </label>
              </div>

              <p className="notice">
                La création sera envoyée en attente de validation. Elle ne sera
                pas visible publiquement tant qu’elle n’est pas acceptée.
              </p>

              <button type="submit" className="primary" disabled={isSending}>
                {isSending ? "Envoi en cours..." : "Envoyer ma création"}
              </button>
            </form>
          )}
        </section>

        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }
        `}</style>

        <style jsx>{`
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

          .label {
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
            margin: 34px 0 16px;
          }

          p {
            line-height: 1.7;
          }

          .infoBox {
            margin-top: 26px;
            padding: 22px 24px;
            border-radius: 22px;
            background: rgba(245, 199, 109, 0.1);
            border: 1px solid rgba(245, 199, 109, 0.32);
          }

          .infoBox h2 {
            margin-top: 0;
            margin-bottom: 14px;
            font-size: 1.35rem;
          }

          .infoBox p {
            margin: 10px 0;
          }

          .authBox,
          .loginForm,
          .proposalForm,
          .connectedBox {
            margin-top: 28px;
            padding: 24px;
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
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

          .formGrid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          label {
            display: block;
            margin-bottom: 16px;
            font-weight: 800;
          }

          input,
          select,
          textarea {
            width: 100%;
            margin-top: 8px;
            padding: 13px 14px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.22);
            background: rgba(0, 0, 0, 0.44);
            color: white;
            font: inherit;
          }

          select option {
            color: black;
          }

          textarea {
            resize: vertical;
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

          .checks {
            margin: 24px 0;
          }

          .checks label {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            font-weight: 600;
          }

          .checks input {
            width: auto;
            margin-top: 6px;
          }

          .primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 46px;
            padding: 0 22px;
            border-radius: 999px;
            border: 0;
            background: #f5c76d;
            color: #111;
            font-weight: 900;
            cursor: pointer;
          }

          .primary:disabled {
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

            .formGrid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
    </>
  );
}