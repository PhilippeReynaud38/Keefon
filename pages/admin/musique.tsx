import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { createClient, Session } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  is_active: boolean;
  sort_order: number;
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
  category_id: string | null;
  status:
    | "pending"
    | "published"
    | "rejected"
    | "removed_user"
    | "removed_admin"
    | "flagged";
  is_featured: boolean;
  hearts_count: number;
  rights_confirmed: boolean;
  diffusion_agreed: boolean;
  no_payment_accepted: boolean;
  admin_note: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  removed_at: string | null;
};

function statusLabel(status: MusicCreation["status"]) {
  switch (status) {
    case "pending":
      return "En attente";
    case "published":
      return "Publiée";
    case "rejected":
      return "Refusée";
    case "removed_user":
      return "Retirée par le créateur";
    case "removed_admin":
      return "Retirée par admin";
    case "flagged":
      return "À vérifier";
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

function FakeNotFoundPage() {
  return (
    <>
      <Head>
        <title>Page introuvable — Keefon</title>
      </Head>

      <main className="page fakePage">
        <section className="fakeBox">
          <p className="fakeCode">404</p>
          <h1>Page introuvable</h1>
          <p>Cette page n’existe pas ou n’est plus disponible.</p>
          <a href="/musique" className="primary">
            Retour
          </a>
        </section>

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

          .fakePage {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .fakeBox {
            width: min(100%, 620px);
            padding: 42px;
            border-radius: 28px;
            background: rgba(0, 0, 0, 0.52);
            border: 1px solid rgba(255, 255, 255, 0.16);
            text-align: center;
          }

          .fakeCode {
            color: #f5c76d;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-weight: 900;
          }

          h1 {
            font-size: clamp(2.4rem, 6vw, 4.5rem);
            margin: 0 0 18px;
            line-height: 1;
          }

          p {
            line-height: 1.7;
            opacity: 0.82;
          }

          .primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 46px;
            padding: 0 22px;
            margin-top: 18px;
            border-radius: 999px;
            border: 0;
            background: #f5c76d;
            color: #111;
            font-weight: 900;
            text-decoration: none;
          }

          @media (max-width: 800px) {
            .page {
              background-attachment: scroll;
              padding: 24px 18px 60px;
            }

            .fakeBox {
              padding: 30px;
            }
          }
        `}</style>
      </main>
    </>
  );
}

export default function AdminMusiquePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MusicProfile | null>(null);
  const [categories, setCategories] = useState<MusicCategory[]>([]);
  const [creations, setCreations] = useState<MusicCreation[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [pageMessage, setPageMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = useMemo(() => {
    return profile?.role === "admin" || profile?.role === "super_admin";
  }, [profile]);

  const filteredCreations = useMemo(() => {
    return creations.filter((creation) => {
      const statusOk =
        statusFilter === "all" ? true : creation.status === statusFilter;

      const categoryOk =
        categoryFilter === "all"
          ? true
          : categoryFilter === "none"
          ? creation.category_id === null
          : creation.category_id === categoryFilter;

      return statusOk && categoryOk;
    });
  }, [creations, statusFilter, categoryFilter]);

  useEffect(() => {
    loadInitialData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession) {
        loadAdminData(newSession);
      } else {
        setProfile(null);
        setCreations([]);
        setIsLoading(false);
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
      await loadAdminData(data.session);
    }

    setIsLoading(false);
  }

  async function loadAdminData(currentSession: Session) {
    const foundProfile = await loadProfile(currentSession);

    if (!foundProfile) {
      setIsLoading(false);
      return;
    }

    if (foundProfile.role !== "admin" && foundProfile.role !== "super_admin") {
      setIsLoading(false);
      return;
    }

    await loadCategories();
    await loadCreations();

    setIsLoading(false);
  }

  async function loadProfile(currentSession: Session) {
    const user = currentSession.user;

    if (!user.email) {
      return null;
    }

    const { data, error } = await supabase
      .from("zz_music_profiles_createurs")
      .select("id, user_id, email, public_name, role, creator_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    const foundProfile = (data as MusicProfile) || null;
    setProfile(foundProfile);

    return foundProfile;
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from("zz_music_categories_modifiables")
      .select("id, name, slug, description, is_active, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      setErrorMessage("Impossible de charger les rubriques.");
      return;
    }

    setCategories((data || []) as MusicCategory[]);
  }

  async function loadCreations() {
    const { data, error } = await supabase
      .from("zz_music_creations_deposees")
      .select(
        "id, creator_id, title, public_author_name, description, author_note, external_url, embed_url, platform, creation_type, category_id, status, is_featured, hearts_count, rights_confirmed, diffusion_agreed, no_payment_accepted, admin_note, rejection_reason, created_at, updated_at, published_at, removed_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMessage("Impossible de charger les créations déposées.");
      return;
    }

    setCreations((data || []) as MusicCreation[]);
  }

  function getCategoryName(categoryId: string | null) {
    if (!categoryId) return "Non classée";

    const category = categories.find((item) => item.id === categoryId);
    return category?.name || "Rubrique inconnue";
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setCreations([]);
    setPageMessage("");
    setErrorMessage("");
  }

  async function updateCreation(
    creationId: string,
    patch: Partial<MusicCreation>
  ) {
    setIsUpdating(true);
    setErrorMessage("");
    setPageMessage("");

    const { error } = await supabase
      .from("zz_music_creations_deposees")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creationId);

    setIsUpdating(false);

    if (error) {
      console.error(error);
      setErrorMessage(`Modification impossible : ${error.message}`);
      return;
    }

    setPageMessage("Modification enregistrée.");
    await loadCreations();
  }

  async function publishCreation(creation: MusicCreation) {
    await updateCreation(creation.id, {
      status: "published",
      published_at: new Date().toISOString(),
      removed_at: null,
      rejection_reason: null,
    });
  }

  async function setPendingCreation(creation: MusicCreation) {
    await updateCreation(creation.id, {
      status: "pending",
      rejection_reason: null,
      removed_at: null,
    });
  }

  async function rejectCreation(creation: MusicCreation) {
    const reason = window.prompt(
      `Motif du refus pour : ${creation.title}`,
      creation.rejection_reason || ""
    );

    if (reason === null) return;

    await updateCreation(creation.id, {
      status: "rejected",
      rejection_reason: reason.trim() || "Création non retenue.",
      removed_at: null,
    });
  }

  async function removeByAdmin(creation: MusicCreation) {
    const confirmed = window.confirm(
      `Retirer "${creation.title}" de Keefon Music côté admin ?`
    );

    if (!confirmed) return;

    await updateCreation(creation.id, {
      status: "removed_admin",
      removed_at: new Date().toISOString(),
    });
  }

  async function toggleFeatured(creation: MusicCreation) {
    await updateCreation(creation.id, {
      is_featured: !creation.is_featured,
    });
  }

  async function changeCategory(creation: MusicCreation, categoryId: string) {
    await updateCreation(creation.id, {
      category_id: categoryId === "none" ? null : categoryId,
    });
  }

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Chargement — Keefon</title>
        </Head>

        <main className="page loadingPage">
          <p>Chargement...</p>

          <style jsx>{`
            .page {
              min-height: 100vh;
              color: white;
              background-image: url("/musique/bg-musique.png");
              background-size: cover;
              background-position: center top;
              background-repeat: no-repeat;
              background-attachment: fixed;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 32px 24px;
            }

            p {
              padding: 18px 24px;
              border-radius: 999px;
              background: rgba(0, 0, 0, 0.52);
              border: 1px solid rgba(255, 255, 255, 0.16);
            }
          `}</style>
        </main>
      </>
    );
  }

  if (!session || !profile || !isAdmin) {
    return <FakeNotFoundPage />;
  }

  return (
    <>
      <Head>
        <title>Admin musique — Keefon Music</title>
        <meta
          name="robots"
          content="noindex, nofollow, noarchive"
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
            <a href="/musique/mes-creations">Mes créations</a>

            <button type="button" onClick={handleLogout}>
              Déconnexion
            </button>
          </nav>
        </header>

        <section className="box">
          <p className="label">Administration</p>

          <h1>Admin musique</h1>

          <p>
            Valide, classe et modère les créations proposées sur Keefon Music.
          </p>

          {errorMessage && <p className="error">{errorMessage}</p>}
          {pageMessage && <p className="success">{pageMessage}</p>}

          <div className="connectedBox">
            <p>
              Connecté comme <strong>{profile.public_name}</strong> —{" "}
              {profile.email}
            </p>

            <p className="notice">
              Rôle : {profile.role} — Statut : {profile.creator_status}
            </p>
          </div>

          <div className="filters">
            <label>
              Statut
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="pending">En attente</option>
                <option value="published">Publiées</option>
                <option value="rejected">Refusées</option>
                <option value="removed_user">Retirées par créateur</option>
                <option value="removed_admin">Retirées par admin</option>
                <option value="flagged">À vérifier</option>
                <option value="all">Tout voir</option>
              </select>
            </label>

            <label>
              Rubrique
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Toutes les rubriques</option>
                <option value="none">Non classées</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" className="secondary" onClick={loadCreations}>
              Rafraîchir
            </button>
          </div>

          <div className="summary">
            <span>{filteredCreations.length} création(s) affichée(s)</span>
            <span>{creations.length} création(s) au total</span>
          </div>

          <div className="creationsList">
            {filteredCreations.map((creation) => (
              <article key={creation.id} className="creationCard">
                <div className="creationHeader">
                  <div>
                    <p className="creationType">
                      {creationTypeLabel(creation.creation_type)} ·{" "}
                      {creation.platform}
                    </p>

                    <h2>{creation.title}</h2>

                    <p className="notice">
                      Déposé par <strong>{creation.public_author_name}</strong>{" "}
                      le{" "}
                      {new Date(creation.created_at).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                  </div>

                  <div className="statusGroup">
                    {creation.is_featured && (
                      <span className="featured">Mis en avant</span>
                    )}

                    <span className={statusClass(creation.status)}>
                      {statusLabel(creation.status)}
                    </span>
                  </div>
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

                <div className="metaGrid">
                  <div>
                    <strong>Rubrique</strong>
                    <select
                      value={creation.category_id || "none"}
                      onChange={(event) =>
                        changeCategory(creation, event.target.value)
                      }
                      disabled={isUpdating}
                    >
                      <option value="none">Non classée</option>

                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <strong>Rubrique actuelle</strong>
                    <p>{getCategoryName(creation.category_id)}</p>
                  </div>

                  <div>
                    <strong>Coups de cœur</strong>
                    <p>{creation.hearts_count || 0}</p>
                  </div>
                </div>

                <div className="checks">
                  <span>Droits : {creation.rights_confirmed ? "OK" : "Non"}</span>
                  <span>
                    Diffusion : {creation.diffusion_agreed ? "OK" : "Non"}
                  </span>
                  <span>
                    Gratuité : {creation.no_payment_accepted ? "OK" : "Non"}
                  </span>
                </div>

                <div className="actions">
                  <a
                    href={creation.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="secondary"
                  >
                    Ouvrir la source
                  </a>

                  {creation.embed_url && (
                    <a
                      href={creation.embed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary"
                    >
                      Voir embed
                    </a>
                  )}

                  {creation.status !== "published" && (
                    <button
                      type="button"
                      className="primary"
                      onClick={() => publishCreation(creation)}
                      disabled={isUpdating}
                    >
                      Publier
                    </button>
                  )}

                  {creation.status !== "pending" && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setPendingCreation(creation)}
                      disabled={isUpdating}
                    >
                      Remettre en attente
                    </button>
                  )}

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => toggleFeatured(creation)}
                    disabled={isUpdating}
                  >
                    {creation.is_featured
                      ? "Retirer mise en avant"
                      : "Mettre en avant"}
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => rejectCreation(creation)}
                    disabled={isUpdating}
                  >
                    Refuser
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => removeByAdmin(creation)}
                    disabled={isUpdating}
                  >
                    Retirer admin
                  </button>
                </div>
              </article>
            ))}

            {filteredCreations.length === 0 && (
              <div className="emptyBox">
                <h2>Aucune création dans ce filtre</h2>
                <p>Change le filtre ou attends de nouveaux dépôts.</p>
              </div>
            )}
          </div>
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
            width: min(100%, 1150px);
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
            gap: 12px;
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

          .connectedBox,
          .filters,
          .emptyBox,
          .creationCard,
          .summary {
            margin-top: 28px;
            padding: 24px;
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
          }

          .filters {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 16px;
            align-items: end;
          }

          .summary {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
          }

          label {
            display: block;
            margin-bottom: 16px;
            font-weight: 800;
          }

          select {
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
          .secondary:disabled,
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

          .statusGroup {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .status,
          .featured {
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

          .featured {
            background: rgba(245, 199, 109, 0.2);
            border: 1px solid rgba(245, 199, 109, 0.45);
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

          .metaGrid {
            display: grid;
            grid-template-columns: 1.2fr 1fr 0.6fr;
            gap: 16px;
            margin-top: 18px;
          }

          .metaGrid strong {
            display: block;
            margin-bottom: 8px;
          }

          .checks {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 18px;
            opacity: 0.82;
          }

          .checks span {
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
          }

          .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 22px;
          }

          @media (max-width: 900px) {
            .filters,
            .metaGrid {
              grid-template-columns: 1fr;
            }
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

            .statusGroup {
              justify-content: flex-start;
            }
          }
        `}</style>
      </main>
    </>
  );
}