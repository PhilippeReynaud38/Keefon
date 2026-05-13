import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  title: string;
  public_author_name: string;
  description: string;
  author_note: string | null;
  external_url: string;
  embed_url: string | null;
  thumbnail_url: string | null;
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
  album_slug: string | null;
  album_title: string | null;
  track_number: number | null;
  created_at: string;
  published_at: string | null;
};

type MusicAlbum = {
  album_slug: string;
  album_title: string;
  category_id: string | null;
  public_author_name: string;
  cover_thumbnail_url: string | null;
  platform: string;
  is_featured: boolean;
  hearts_count: number;
  tracks: MusicCreation[];
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function getYouTubeVideoId(url: string | null | undefined) {
  if (!url) return null;

  const patterns = [
    /youtu\.be\/([^?&#/]+)/,
    /[?&]v=([^?&#/]+)/,
    /youtube\.com\/embed\/([^?&#/]+)/,
    /youtube\.com\/shorts\/([^?&#/]+)/,
    /youtube\.com\/live\/([^?&#/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function platformLabel(platform: string) {
  switch (platform) {
    case "youtube":
      return "YouTube";
    case "suno":
      return "Suno";
    case "soundcloud":
      return "SoundCloud";
    case "bandcamp":
      return "Bandcamp";
    case "spotify":
      return "Spotify";
    case "tiktok":
      return "TikTok";
    default:
      return "Source";
  }
}

function creationTypeLabel(type: string) {
  const cleanType = normalizeRubriqueSlug(type) || type;

  switch (cleanType) {
    case "song":
    case "chansons-a-texte":
      return "Chansons à texte";
    case "clip":
      return "Clip";
    case "visual_album":
    case "ai_experiment":
    case "albums":
      return "Albums";
    case "soundscape":
    case "voyages-sonores":
      return "Voyages sonores";
    case "promos-keefon":
      return "Promos Keefon";
    default:
      return "Création musicale";
  }
}

function shortTrackTitle(title: string) {
  const cleaned = title
    .replace(/^.*?—\s*Piste\s*\d+\s*:\s*/i, "")
    .replace(/^Piste\s*\d+\s*:\s*/i, "")
    .trim();

  return cleaned || title;
}

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sortTracks(a: MusicCreation, b: MusicCreation) {
  const aTrack = a.track_number ?? 9999;
  const bTrack = b.track_number ?? 9999;

  if (aTrack !== bTrack) return aTrack - bTrack;

  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

// ==============================
// Rubriques officielles publiques
// ==============================
// Ces 4 rubriques sont celles affichées aux visiteurs.
// Les anciens noms venant de Supabase sont normalisés plus bas pour éviter les doublons.
const officialRubriques = [
  {
    id: "rubrique-chansons-a-texte",
    name: "Chansons à texte",
    slug: "chansons-a-texte",
  },
  {
    id: "rubrique-albums",
    name: "Albums",
    slug: "albums",
  },
  {
    id: "rubrique-promos-keefon",
    name: "Promos Keefon",
    slug: "promos-keefon",
  },
  {
    id: "rubrique-voyages-sonores",
    name: "Voyages sonores",
    slug: "voyages-sonores",
  },
];

const rubriqueAliasBySlug: Record<string, string> = {
  // Chansons à texte : chanson, clip, satire, slam ou rap narratif.
  chanson: "chansons-a-texte",
  chansons: "chansons-a-texte",
  song: "chansons-a-texte",
  clip: "chansons-a-texte",
  clips: "chansons-a-texte",
  satire: "chansons-a-texte",
  slam: "chansons-a-texte",
  rap: "chansons-a-texte",
  "chanson-a-texte": "chansons-a-texte",
  "chansons-a-texte": "chansons-a-texte",

  // Albums : ancien album narratif / visuel + anciennes expériences IA.
  album: "albums",
  albums: "albums",
  "album-narratif": "albums",
  "albums-narratifs": "albums",
  "album-visuel": "albums",
  "albums-visuels": "albums",
  "visual-album": "albums",
  "ai-experiment": "albums",
  "experience-ia": "albums",
  "experiences-ia": "albums",
  "experimentation-ia": "albums",
  "experimentations-ia": "albums",

  // Promos Keefon : anciennes rubriques créateurs invités / promotions.
  "promo-keefon": "promos-keefon",
  "promos-keefon": "promos-keefon",
  "promotion-keefon": "promos-keefon",
  "promotions-keefon": "promos-keefon",
  "createur-invite": "promos-keefon",
  "createurs-invites": "promos-keefon",

  // Voyages sonores : ambiances, paysages sonores, univers immersifs.
  "voyage-sonore": "voyages-sonores",
  "voyages-sonores": "voyages-sonores",
  "paysage-sonore": "voyages-sonores",
  "paysages-sonores": "voyages-sonores",
  "soundscape": "voyages-sonores",
  "univers-imaginaire": "voyages-sonores",
  "univers-imaginaires": "voyages-sonores",
};

function slugifyRubrique(value: string | null | undefined) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeRubriqueSlug(value: string | null | undefined) {
  const slug = slugifyRubrique(value);
  return rubriqueAliasBySlug[slug] || slug;
}

function getOfficialRubriqueName(slug: string, fallbackName = "Création musicale") {
  return officialRubriques.find((rubrique) => rubrique.slug === slug)?.name || fallbackName;
}

function getRubriqueSlugFromCreationType(type: string | null | undefined) {
  return normalizeRubriqueSlug(type);
}

export default function KeefonMusicPage() {
  const [creations, setCreations] = useState<MusicCreation[]>([]);
  const [categories, setCategories] = useState<MusicCategory[]>([]);

  const [selectedAlbum, setSelectedAlbum] = useState<MusicAlbum | null>(null);
  const [selectedAlbumInfo, setSelectedAlbumInfo] =
    useState<MusicAlbum | null>(null);

  const [selectedCreation, setSelectedCreation] =
    useState<MusicCreation | null>(null);
  const [selectedCreationInfo, setSelectedCreationInfo] =
    useState<MusicCreation | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const youtubePlayerRef = useRef<any>(null);
  const [isYouTubeApiReady, setIsYouTubeApiReady] = useState(false);

  const activeYouTubeVideoId = selectedCreation
    ? getYouTubeVideoId(selectedCreation.embed_url || selectedCreation.external_url)
    : null;

  // Rubriques visibles dans le panneau “Recherche & rubriques”.
  // On affiche uniquement la ligne éditoriale officielle, même si Supabase contient encore d’anciens noms.
  const rubriques = officialRubriques;

  const allAlbums = useMemo(() => {
    const albumsMap = new Map<string, MusicAlbum>();

    creations.forEach((creation) => {
      if (!creation.album_slug || !creation.album_title) return;

      const existingAlbum = albumsMap.get(creation.album_slug);

      if (!existingAlbum) {
        albumsMap.set(creation.album_slug, {
          album_slug: creation.album_slug,
          album_title: creation.album_title,
          category_id: creation.category_id,
          public_author_name: creation.public_author_name,
          cover_thumbnail_url: creation.thumbnail_url,
          platform: creation.platform,
          is_featured: creation.is_featured,
          hearts_count: creation.hearts_count || 0,
          tracks: [creation],
        });

        return;
      }

      existingAlbum.tracks.push(creation);
      existingAlbum.is_featured =
        existingAlbum.is_featured || creation.is_featured;
      existingAlbum.hearts_count += creation.hearts_count || 0;

      if (!existingAlbum.cover_thumbnail_url && creation.thumbnail_url) {
        existingAlbum.cover_thumbnail_url = creation.thumbnail_url;
      }

      const currentCoverTrack = existingAlbum.tracks.find(
        (track) => track.thumbnail_url === existingAlbum.cover_thumbnail_url
      );

      if (
        creation.track_number === 1 &&
        creation.thumbnail_url &&
        currentCoverTrack?.track_number !== 1
      ) {
        existingAlbum.cover_thumbnail_url = creation.thumbnail_url;
      }
    });

    return Array.from(albumsMap.values())
      .map((album) => ({
        ...album,
        tracks: [...album.tracks].sort(sortTracks),
      }))
      .sort((a, b) => {
        if (a.is_featured !== b.is_featured) {
          return a.is_featured ? -1 : 1;
        }

        return a.album_title.localeCompare(b.album_title, "fr");
      });
  }, [creations]);

  const allStandaloneCreations = useMemo(() => {
    return creations.filter((creation) => !creation.album_slug);
  }, [creations]);

  const filteredAlbums = useMemo(() => {
    const query = normalizeText(searchQuery);

    return allAlbums.filter((album) => {
      const categorySlug = getCategorySlug(album.category_id) || "albums";
      const matchCategory =
        selectedCategorySlug === "all" || categorySlug === selectedCategorySlug;

      const searchContent = normalizeText(
        [
          album.album_title,
          album.public_author_name,
          platformLabel(album.platform),
          getCategoryName(album.category_id, "Albums"),
          ...album.tracks.map((track) => track.title),
          ...album.tracks.map((track) => track.description),
          ...album.tracks.map((track) => track.author_note || ""),
        ].join(" ")
      );

      return matchCategory && (!query || searchContent.includes(query));
    });
  }, [allAlbums, searchQuery, selectedCategorySlug, categories]);

  const filteredStandaloneCreations = useMemo(() => {
    const query = normalizeText(searchQuery);

    return allStandaloneCreations.filter((creation) => {
      const categorySlug =
        getCategorySlug(creation.category_id) ||
        getRubriqueSlugFromCreationType(creation.creation_type);
      const matchCategory =
        selectedCategorySlug === "all" || categorySlug === selectedCategorySlug;

      const searchContent = normalizeText(
        [
          creation.title,
          creation.public_author_name,
          creation.description,
          creation.author_note,
          platformLabel(creation.platform),
          getCategoryName(
            creation.category_id,
            getOfficialRubriqueName(
              getRubriqueSlugFromCreationType(creation.creation_type)
            )
          ),
        ].join(" ")
      );

      return matchCategory && (!query || searchContent.includes(query));
    });
  }, [allStandaloneCreations, searchQuery, selectedCategorySlug, categories]);

  const hasActiveFilter =
    searchQuery.trim() !== "" || selectedCategorySlug !== "all";

  const totalResults =
    filteredAlbums.length + filteredStandaloneCreations.length;

  useEffect(() => {
    loadPublicMusicData();
  }, []);

  useEffect(() => {
    // =====================================================================
    // MODIFICATION PWA — KEEFON MUSIC
    // Sécurité utile si un manifeste global /manifest.json est injecté ailleurs
    // dans le site. Sur la page /musique, on force le manifeste Music afin que
    // Chrome affiche bien “Keefon Music” dans l’onglet Application.
    // =====================================================================
    if (typeof document === "undefined") return;

    const musicManifestHref = "/manifest-music.webmanifest";
    const manifestLinks = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="manifest"]')
    );

    if (manifestLinks.length === 0) {
      const manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      manifestLink.href = musicManifestHref;
      document.head.appendChild(manifestLink);
      return;
    }

    manifestLinks.forEach((manifestLink, index) => {
      if (index === 0) {
        manifestLink.href = musicManifestHref;
        return;
      }

      manifestLink.remove();
    });
  }, []);

  useEffect(() => {
    if (!activeYouTubeVideoId) return;
    if (typeof window === "undefined") return;

    if (window.YT?.Player) {
      setIsYouTubeApiReady(true);
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      setIsYouTubeApiReady(true);
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [activeYouTubeVideoId]);

  useEffect(() => {
    if (!activeYouTubeVideoId) return;
    if (!isYouTubeApiReady) return;
    if (typeof window === "undefined") return;
    if (!window.YT?.Player) return;

    const mountElement = document.getElementById("keefon-youtube-player");
    if (!mountElement) return;

    if (youtubePlayerRef.current?.destroy) {
      youtubePlayerRef.current.destroy();
      youtubePlayerRef.current = null;
    }

    youtubePlayerRef.current = new window.YT.Player("keefon-youtube-player", {
      videoId: activeYouTubeVideoId,
      playerVars: {
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          event.target?.playVideo?.();
        },

        onStateChange: (event: any) => {
          if (event.data !== window.YT.PlayerState.ENDED) return;
          if (!selectedAlbum || !selectedCreation) return;

          const currentIndex = selectedAlbum.tracks.findIndex(
            (track) => track.id === selectedCreation.id
          );

          const nextTrack = selectedAlbum.tracks[currentIndex + 1];

          if (nextTrack) {
            setSelectedCreation(nextTrack);
          }
        },
      },
    });

    return () => {
      if (youtubePlayerRef.current?.destroy) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [
    activeYouTubeVideoId,
    isYouTubeApiReady,
    selectedAlbum,
    selectedCreation,
  ]);

  async function loadPublicMusicData() {
    setIsLoading(true);
    setErrorMessage("");

    const [categoriesResult, creationsResult] = await Promise.all([
      supabase
        .from("zz_music_categories_modifiables")
        .select("id, name, slug, description, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("zz_music_creations_deposees")
        .select(
          "id, title, public_author_name, description, author_note, external_url, embed_url, thumbnail_url, platform, creation_type, category_id, status, is_featured, hearts_count, album_slug, album_title, track_number, created_at, published_at"
        )
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("album_slug", { ascending: true, nullsFirst: false })
        .order("track_number", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (categoriesResult.error) {
      console.error(categoriesResult.error);
      setErrorMessage("Impossible de charger les rubriques musicales.");
    } else {
      setCategories((categoriesResult.data || []) as MusicCategory[]);
    }

    if (creationsResult.error) {
      console.error(creationsResult.error);
      setErrorMessage("Impossible de charger les créations publiées.");
    } else {
      setCreations((creationsResult.data || []) as MusicCreation[]);
    }

    setIsLoading(false);
  }

  function getCategoryName(
    categoryId: string | null,
    fallbackName = "Création musicale"
  ) {
    const slug = getCategorySlug(categoryId);
    if (!slug) return fallbackName;

    return getOfficialRubriqueName(slug, fallbackName);
  }

  function getCategorySlug(categoryId: string | null) {
    if (!categoryId) return "";

    const category = categories.find((item) => item.id === categoryId);

    // On normalise à partir du slug ET du nom pour rattraper les anciennes rubriques Supabase.
    return normalizeRubriqueSlug(category?.slug || category?.name || "");
  }

  function openAlbum(album: MusicAlbum) {
    const firstTrack = album.tracks[0] || null;

    setSelectedAlbum(album);
    setSelectedCreation(firstTrack);
  }

  function openCreation(creation: MusicCreation) {
    setSelectedAlbum(null);
    setSelectedCreation(creation);
  }

  function closePlayerModal() {
    if (youtubePlayerRef.current?.destroy) {
      youtubePlayerRef.current.destroy();
      youtubePlayerRef.current = null;
    }

    setSelectedAlbum(null);
    setSelectedCreation(null);
  }

  function closeInfoModal() {
    setSelectedAlbumInfo(null);
    setSelectedCreationInfo(null);
  }

  return (
    <>
      <Head>
        <title>Keefon Music — Des chansons comme des scènes de cinéma</title>
        <meta
          name="description"
          content="Keefon Music présente des chansons à texte, albums, promos Keefon et voyages sonores."
        />

        {/* =====================================================================
            MODIFICATION PWA — KEEFON MUSIC
            Manifeste spécifique à /musique.
            Objectif : proposer un raccourci / une appli “Keefon Music”
            séparée visuellement de Keefon Rencontre.

            Fichiers nécessaires dans /public :
            - /manifest-music.webmanifest
            - /icons/keefon-music-192.png
            - /icons/keefon-music-512.png
            - /icons/keefon-music-maskable-512.png
        ====================================================================== */}
        <link
          rel="manifest"
          href="/manifest-music.webmanifest"
          key="keefon-music-manifest"
        />
        <meta name="theme-color" content="#050505" />
        <meta name="application-name" content="Keefon Music" />
        <meta name="apple-mobile-web-app-title" content="Keefon Music" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/icons/keefon-music-192.png" />
      </Head>

      <main className="page">
        <header className="header">
          {/* Identité Keefon Music + accès aux filtres.
              Sur mobile, le bouton de recherche reste sous le logo pour libérer la droite. */}
          <div className="brandBlock">
            <a href="/musique" className="brand">
              Keefon Music
            </a>

            <button
              type="button"
              className="searchToggle"
              onClick={() => setIsSearchOpen((value) => !value)}
              aria-expanded={isSearchOpen}
            >
              Recherche & rubriques
            </button>
          </div>

          {/* Liaison vers Keefon Rencontre. */}
          <div className="headerActions">
            <a href="/rencontres/france" className="rencontreLink">
              Keefon Rencontre
            </a>
          </div>
        </header>

        {isSearchOpen && (
          <section className="searchPanel">
            <label>
              Rechercher
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Titre, auteur, univers..."
              />
            </label>

            <div className="rubriquesArea">
              <p className="miniLabel">Rubriques</p>

              <div className="badges">
                <button
                  type="button"
                  className={
                    selectedCategorySlug === "all" ? "badge active" : "badge"
                  }
                  onClick={() => setSelectedCategorySlug("all")}
                >
                  Tout voir
                </button>

                {rubriques.map((rubrique) => (
                  <button
                    key={rubrique.id}
                    type="button"
                    className={
                      selectedCategorySlug === rubrique.slug
                        ? "badge active"
                        : "badge"
                    }
                    onClick={() => setSelectedCategorySlug(rubrique.slug)}
                  >
                    {rubrique.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Action secondaire : les résultats se mettent déjà à jour automatiquement. */}
            <div className="searchActions">
              <a href="/musique/proposer" className="secondary">
                Diffuser une création
              </a>
            </div>
          </section>
        )}

        <section className="hero">
          <h1>Des chansons comme des scènes de cinéma</h1>
        </section>

        <section id="creations" className="resultsSection">
          {hasActiveFilter && (
            <div className="filterLine">
              <span>
                {totalResults} résultat(s)
                {selectedCategorySlug !== "all" && " dans cette rubrique"}
              </span>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategorySlug("all");
                }}
              >
                Réinitialiser
              </button>
            </div>
          )}

          {isLoading && <p className="notice">Chargement des créations...</p>}

          {errorMessage && <p className="error">{errorMessage}</p>}

          {!isLoading && creations.length === 0 && (
            <div className="emptyBox">
              <h3>Aucune création publiée pour le moment</h3>
              <p>
                Les créations envoyées apparaîtront ici après validation admin.
              </p>
            </div>
          )}

          {!isLoading && creations.length > 0 && totalResults === 0 && (
            <div className="emptyBox">
              <h3>Aucun résultat</h3>
              <p>Essaie une autre recherche ou une autre rubrique.</p>
            </div>
          )}

          {filteredAlbums.length > 0 && (
            <div className="catalogList">
              {filteredAlbums.map((album) => (
                <AlbumCard
                  key={album.album_slug}
                  album={album}
                  onOpen={() => openAlbum(album)}
                  onInfo={() => setSelectedAlbumInfo(album)}
                />
              ))}
            </div>
          )}

          {filteredStandaloneCreations.length > 0 && (
            <div className="catalogList">
              {filteredStandaloneCreations.map((creation) => (
                <CreationCard
                  key={creation.id}
                  creation={creation}
                  onOpen={() => openCreation(creation)}
                  onInfo={() => setSelectedCreationInfo(creation)}
                />
              ))}
            </div>
          )}
        </section>

        <section id="proposer" className="box creatorBox">
          <p className="label">Créateurs</p>

          <h2>Diffusez vos créations sur Keefon</h2>

          <p>
            Vous pouvez proposer une création correspondant à nos rubriques : chanson à texte, album, promo Keefon ou voyage sonore. Le clip vidéo n’est pas obligatoire.

            Vous déposez simplement vos propres liens : YouTube, Suno, SoundCloud, Bandcamp, Spotify, TikTok ou autre plateforme.
          </p>

          <p>
            Keefon affiche une fiche de présentation, sans héberger vos fichiers audio ou vidéo. Vous gardez vos droits, vos plateformes, vos statistiques et vous pouvez retirer votre fiche vous-même quand vous le souhaitez.
          </p>

          <a href="/musique/proposer" className="primary">
            Proposer une création
          </a>
        </section>

        <section id="concept" className="box conceptBox">
          <p className="label">Le concept</p>

          <h2>Des créations comme des portes vers un univers</h2>

          <p>
            Keefon Music présente des créations qui racontent une histoire,
            installent une ambiance forte ou ouvrent une porte vers un univers
            original.
          </p>
        </section>

        {/* =====================================================================
            MODIFICATION — DROITS DES ŒUVRES
            Encadré ajouté pour rappeler que les créations présentées ne sont
            pas libres de droit. Il est placé près du bas de page pour informer
            sans alourdir la liste des créations.
        ====================================================================== */}
        <section className="rightsNotice" aria-label="Droits des œuvres présentées">
          <p className="rightsNoticeKicker">Droits des œuvres</p>
          <p className="rightsNoticeText">
            Les créations présentées sur Keefon Music ne sont pas libres de droit.
            Elles restent la propriété de leurs auteurs, créateurs, fabricants ou
            ayants droit. Keefon les met en lumière sans revendiquer de droit de
            propriété : toute reproduction, réutilisation, modification ou diffusion
            sans autorisation est interdite.
          </p>
        </section>

        {/* =====================================================================
            LIEN TRANSVERSAL — KEEFON MUSIC → KEEFON RENCONTRE
            Petit encart de bas de page.
            À garder discret : il sert à proposer le retour vers Keefon Rencontre
            sans voler la place aux créations musicales.
            Pour changer la destination, modifier uniquement le href ci-dessous.
        ====================================================================== */}
        <section className="rencontreBottomBox" aria-label="Découvrir Keefon Rencontre">
          <div>
            <p className="rencontreBottomKicker">Keefon Rencontre</p>
            {/* MODIFICATION TEXTE — correction de la phrase “Qui-phone ?”. */}
            <p className="rencontreBottomText">
              Découvre aussi Keefon Rencontre : un espace bienveillant, gratuit
              jusqu’à fin 2026 pour les 2000 premiers inscrits, avec messagerie,
              chat et contacts inclus. Keefon, ça se prononce “Qui-phone ?”
            </p>
          </div>

          <a href="/rencontres/france" className="rencontreBottomButton">
            Découvrir
          </a>
        </section>

        <footer className="footer">
          <p>Keefon Music — Projet créatif musical</p>
        </footer>

        {selectedCreation && (
          <div className="modalBackdrop" onClick={closePlayerModal}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="closeButton"
                onClick={closePlayerModal}
                aria-label="Fermer la fenêtre"
              >
                ×
              </button>

              {selectedAlbum ? (
                <>
                  <p className="label">Album narratif</p>

                  <h2>{selectedAlbum.album_title}</h2>

                  <p className="author">
                    {selectedAlbum.tracks.length} piste(s) · Auteur :{" "}
                    {selectedAlbum.public_author_name}
                  </p>

                  {activeYouTubeVideoId ? (
                    <div className="player">
                      <div id="keefon-youtube-player" />
                    </div>
                  ) : selectedCreation.embed_url ? (
                    <div className="player">
                      <iframe
                        src={selectedCreation.embed_url}
                        title={selectedCreation.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : selectedCreation.thumbnail_url ? (
                    <img
                      src={selectedCreation.thumbnail_url}
                      alt={selectedCreation.title}
                      className="modalThumbnail"
                    />
                  ) : (
                    <div className="noEmbedBox">
                      <p>
                        Cette plateforme ne permet pas encore la lecture
                        intégrée sur Keefon.
                      </p>
                    </div>
                  )}

                  <div className="trackList">
                    <p className="subLabel">Contenu de l’album</p>

                    {selectedAlbum.tracks.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        className={
                          selectedCreation.id === track.id
                            ? "trackButton active"
                            : "trackButton"
                        }
                        onClick={() => setSelectedCreation(track)}
                      >
                        <span>Piste {track.track_number ?? "?"}</span>
                        <strong>{shortTrackTitle(track.title)}</strong>
                      </button>
                    ))}
                  </div>

                  <div className="activeTrackBox">
                    <p className="subLabel">Piste sélectionnée</p>
                    <h3>{selectedCreation.title}</h3>
                    <p>{selectedCreation.description}</p>
                  </div>

                  {selectedCreation.author_note && (
                    <div className="authorNote">
                      <strong>Note de l’auteur</strong>
                      <p>{selectedCreation.author_note}</p>
                    </div>
                  )}

                  <a
                    href={selectedCreation.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="primary"
                  >
                    Ouvrir cette piste sur{" "}
                    {platformLabel(selectedCreation.platform)}
                  </a>
                </>
              ) : (
                <>
                  <p className="label">Création</p>

                  <h2>{selectedCreation.title}</h2>

                  <p className="author">
                    Auteur : {selectedCreation.public_author_name}
                  </p>

                  {activeYouTubeVideoId ? (
                    <div className="player">
                      <div id="keefon-youtube-player" />
                    </div>
                  ) : selectedCreation.embed_url ? (
                    <div className="player">
                      <iframe
                        src={selectedCreation.embed_url}
                        title={selectedCreation.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : selectedCreation.thumbnail_url ? (
                    <img
                      src={selectedCreation.thumbnail_url}
                      alt={selectedCreation.title}
                      className="modalThumbnail"
                    />
                  ) : (
                    <div className="noEmbedBox">
                      <p>
                        Cette plateforme ne permet pas encore la lecture
                        intégrée sur Keefon.
                      </p>
                    </div>
                  )}

                  <p>{selectedCreation.description}</p>

                  {selectedCreation.author_note && (
                    <div className="authorNote">
                      <strong>Note de l’auteur</strong>
                      <p>{selectedCreation.author_note}</p>
                    </div>
                  )}

                  <a
                    href={selectedCreation.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="primary"
                  >
                    Ouvrir sur {platformLabel(selectedCreation.platform)}
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {(selectedAlbumInfo || selectedCreationInfo) && (
          <div className="modalBackdrop" onClick={closeInfoModal}>
            <div
              className="infoModal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="closeButton"
                onClick={closeInfoModal}
                aria-label="Fermer les informations"
              >
                ×
              </button>

              {selectedAlbumInfo && (
                <>
                  <p className="label">Informations</p>

                  <h2>{selectedAlbumInfo.album_title}</h2>

                  <p>Auteur : {selectedAlbumInfo.public_author_name}</p>
                  <p>
                    Rubrique : {getCategoryName(selectedAlbumInfo.category_id, "Albums")}
                  </p>
                  <p>Type : Album</p>
                  <p>Plateforme : {platformLabel(selectedAlbumInfo.platform)}</p>
                  <p>Nombre de pistes : {selectedAlbumInfo.tracks.length}</p>

                  <div className="infoBlock">
                    <strong>Contenu</strong>

                    <ol>
                      {selectedAlbumInfo.tracks.map((track) => (
                        <li key={track.id}>
                          Piste {track.track_number ?? "?"} —{" "}
                          {shortTrackTitle(track.title)}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {selectedAlbumInfo.tracks[0]?.description && (
                    <div className="infoBlock">
                      <strong>Description</strong>
                      <p>{selectedAlbumInfo.tracks[0].description}</p>
                    </div>
                  )}

                  {selectedAlbumInfo.tracks[0]?.author_note && (
                    <div className="infoBlock">
                      <strong>Note de l’auteur</strong>
                      <p>{selectedAlbumInfo.tracks[0].author_note}</p>
                    </div>
                  )}

                  <div className="infoBlock">
                    <strong>Sources</strong>

                    <div className="sourceList">
                      {selectedAlbumInfo.tracks.map((track) => (
                        <a
                          key={track.id}
                          href={track.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="secondary"
                        >
                          Piste {track.track_number ?? "?"}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedCreationInfo && (
                <>
                  <p className="label">Informations</p>

                  <h2>{selectedCreationInfo.title}</h2>

                  <p>Auteur : {selectedCreationInfo.public_author_name}</p>
                  <p>
                    Rubrique :{" "}
                    {getCategoryName(
                      selectedCreationInfo.category_id,
                      getOfficialRubriqueName(
                        getRubriqueSlugFromCreationType(
                          selectedCreationInfo.creation_type
                        )
                      )
                    )}
                  </p>
                  <p>
                    Type :{" "}
                    {creationTypeLabel(selectedCreationInfo.creation_type)}
                  </p>
                  <p>
                    Plateforme : {platformLabel(selectedCreationInfo.platform)}
                  </p>

                  <div className="infoBlock">
                    <strong>Description</strong>
                    <p>{selectedCreationInfo.description}</p>
                  </div>

                  {selectedCreationInfo.author_note && (
                    <div className="infoBlock">
                      <strong>Note de l’auteur</strong>
                      <p>{selectedCreationInfo.author_note}</p>
                    </div>
                  )}

                  <div className="infoBlock">
                    <strong>Source</strong>

                    <a
                      href={selectedCreationInfo.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary"
                    >
                      Ouvrir la source
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <style jsx global>{`
          /* Base anti-débordement : évite les bandes blanches sur mobile. */
          *,
          *::before,
          *::after {
            box-sizing: border-box;
          }

          html {
            scroll-behavior: smooth;
            width: 100%;
            min-height: 100%;
            overflow-x: hidden;
          }

          body,
          #__next {
            width: 100%;
            min-height: 100%;
            margin: 0;
            overflow-x: hidden;
            background: #050505;
          }

          .page {
            width: 100%;
            min-height: 100vh;
            overflow-x: hidden;
            color: white;
            --yellowGreen: #E4FF02;
            --paleGreen: #59FF72;
            --tenderGreen: '#2CFF4B,
            background-image: url("/musique/bg-musique.png");
            background-size: cover;
            background-position: center top;
            background-repeat: no-repeat;
            background-attachment: scroll;
            padding: 18px 14px 56px;
          }

          .header,
          .hero,
          .resultsSection,
          .searchPanel,
          .box,
          .footer {
            width: 100%;
            max-width: 1050px;
            margin-left: auto;
            margin-right: auto;
          }

          /* Header : identité Music à gauche, lien Rencontre à droite.
             Le bouton de recherche est rangé sous Keefon Music pour alléger le haut mobile. */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 20px;
          }

          .brandBlock {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            min-width: 0;
          }

          .headerActions {
            display: flex;
            align-items: flex-start;
            justify-content: flex-end;
            gap: 8px;
            flex-shrink: 0;
          }

          /* Boutons du header : même forme, couleurs distinctes pour guider la navigation. */
          .brand,
          .searchToggle,
          .rencontreLink {
            min-height: 36px;
            padding: 0 12px;
            border-radius: 999px;
            font-weight: 900;
            cursor: pointer;
            font-size: 0.82rem;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
            transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
          }

          /* Boutons Keefon Music + Recherche : jaune-vert Keefon Music. */
          .brand,
          .searchToggle {
            color: var(--yellowGreen);
            border: 1px solid rgba(228, 255, 2, 0.52);
            background: rgba(228, 255, 2, 0.07);
            box-shadow: 0 0 18px rgba(228, 255, 2, 0.05);
          }

          .brand {
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 0.76rem;
          }

          /* Bouton Keefon Rencontre : vert clair pour le différencier de Music. */
          .rencontreLink {
            color: var(--paleGreen);
            border: 1px solid rgba(89, 255, 114, 0.52);
            background: rgba(89, 255, 114, 0.07);
            box-shadow: 0 0 18px rgba(89, 255, 114, 0.05);
          }

          .brand:hover,
          .searchToggle:hover {
            border-color: rgba(228, 255, 2, 0.82);
            background: rgba(228, 255, 2, 0.12);
          }

          .rencontreLink:hover {
            border-color: rgba(89, 255, 114, 0.82);
            background: rgba(89, 255, 114, 0.12);
          }

          .searchPanel {
            margin-bottom: 12px;
            padding: 12px;
            border-radius: 18px;
            background: rgba(0, 0, 0, 0.58);
            border: 1px solid rgba(245, 199, 109, 0.2);
          }

          .searchPanel label {
            display: block;
            font-size: 0.9rem;
            font-weight: 900;
            margin-bottom: 12px;
          }

          .searchPanel input {
            width: 100%;
            min-width: 0;
            margin-top: 7px;
            padding: 10px 12px;
            border-radius: 13px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(0, 0, 0, 0.42);
            color: white;
            font: inherit;
            font-size: 0.9rem;
          }

          .miniLabel,
          .label,
          .subLabel {
            color: #f5c76d;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-size: 0.66rem;
            font-weight: 900;
            margin-bottom: 8px;
          }

          /* Recherche > rubriques : petites capsules compactes.
             Les résultats se filtrent automatiquement au clic, sans bouton “Voir les résultats”. */
          .badges {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: auto;
            min-height: 30px;
            padding: 0 10px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            background: linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.06),
                rgba(255, 255, 255, 0.02)
              ),
              rgba(0, 0, 0, 0.22);
            color: white;
            cursor: pointer;
            font-weight: 900;
            font-size: 0.74rem;
            line-height: 1;
            text-align: center;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
            transition:
              transform 0.16s ease,
              border-color 0.16s ease,
              background 0.16s ease;
          }

          .badge:hover {
            transform: translateY(-1px);
            border-color: rgba(245, 199, 109, 0.48);
            background: rgba(255, 255, 255, 0.08);
          }

          .badge.active {
            background: linear-gradient(180deg, #ffd979, #f5c76d);
            color: #111;
            border-color: #f5c76d;
            box-shadow: 0 7px 16px rgba(245, 199, 109, 0.12);
          }

          .searchActions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
          }

          .searchActions .secondary {
            min-height: 32px;
            padding: 0 12px;
            border-radius: 999px;
            font-size: 0.76rem;
          }

          .hero {
            margin-bottom: 16px;
          }

          .hero h1 {
            max-width: 760px;
            margin: 0;
            font-size: clamp(2rem, 8.5vw, 4.4rem);
            line-height: 1.04;
            font-weight: 800;
          }

          .resultsSection {
            margin-bottom: 22px;
          }

          .filterLine {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
            padding: 12px 14px;
            border-radius: 16px;
            background: rgba(0, 0, 0, 0.42);
            border: 1px solid rgba(255, 255, 255, 0.12);
          }

          .filterLine button {
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.25);
            background: rgba(0, 0, 0, 0.24);
            border-radius: 999px;
            padding: 8px 12px;
            cursor: pointer;
          }

          .catalogList {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .albumCard,
          .creationCard {
            display: grid;
            grid-template-columns: 76px 1fr auto;
            gap: 12px;
            align-items: center;
            padding: 10px;
            border-radius: 18px;
            background: rgba(0, 0, 0, 0.46);
            border: 1px solid rgba(255, 255, 255, 0.13);
          }

          .albumCard {
            border-color: rgba(245, 199, 109, 0.28);
            background: linear-gradient(
                135deg,
                rgba(245, 199, 109, 0.08),
                rgba(0, 0, 0, 0.36)
              ),
              rgba(0, 0, 0, 0.46);
          }

          .thumbnailWrap {
            width: 76px;
            aspect-ratio: 1 / 1;
            border-radius: 14px;
            overflow: hidden;
            background: radial-gradient(
                circle at 30% 20%,
                rgba(245, 199, 109, 0.22),
                transparent 38%
              ),
              rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* MODIFICATION — CARTES SANS BOUTON LIRE
             La miniature devient le déclencheur de lecture.
             On garde .thumbnailWrap pour ne pas casser le style existant. */
          .thumbnailButton {
            position: relative;
            padding: 0;
            color: inherit;
            cursor: pointer;
            transition:
              transform 0.16s ease,
              border-color 0.16s ease,
              box-shadow 0.16s ease;
          }

          .thumbnailButton::after {
            content: "▶";
            position: absolute;
            right: 6px;
            bottom: 6px;
            width: 22px;
            height: 22px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-left: 2px;
            background: rgba(245, 199, 109, 0.92);
            color: #111;
            font-size: 0.62rem;
            font-weight: 900;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
            opacity: 0.92;
          }

          .thumbnailButton:hover,
          .thumbnailButton:focus-visible {
            transform: translateY(-1px);
            border-color: rgba(245, 199, 109, 0.72);
            box-shadow: 0 0 0 3px rgba(245, 199, 109, 0.12);
            outline: none;
          }

          .thumbnail {
            width: 100%;
            max-width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .thumbnailFallback {
            color: #f5c76d;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 900;
            font-size: 0.58rem;
            text-align: center;
            padding: 4px;
          }

          .creationText {
            min-width: 0;
          }

          .itemAuthor {
            margin: 0 0 4px;
            opacity: 0.74;
            font-size: 0.88rem;
            line-height: 1.2;
          }

          .itemTitle {
            margin: 0;
            font-size: 1rem;
            line-height: 1.2;
            font-weight: 800;
          }

          /* Actions des cartes : sur desktop les boutons restent côte à côte. */
          .creationActions {
            display: flex;
            gap: 6px;
            align-items: center;
            justify-content: flex-end;
          }

          .primary,
          .secondary,
          .infoButton {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 38px;
            padding: 0 13px;
            border-radius: 999px;
            text-decoration: none;
            font-weight: 900;
            border: 0;
            cursor: pointer;
            font-size: 0.86rem;
            white-space: nowrap;
          }

          .primary {
            background: #f5c76d;
            color: #121212;
          }

          .secondary {
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.38);
            background: rgba(0, 0, 0, 0.22);
          }

          .infoButton {
            width: 38px;
            min-width: 38px;
            padding: 0;
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.38);
            background: rgba(0, 0, 0, 0.22);
            font-family: serif;
            font-size: 1rem;
          }

          .box {
            margin-bottom: 20px;
            padding: 22px;
            border-radius: 26px;
            background: rgba(0, 0, 0, 0.42);
            border: 1px solid rgba(255, 255, 255, 0.14);
          }

          h2 {
            font-size: clamp(1.55rem, 7vw, 3rem);
            line-height: 1.1;
            margin: 0 0 16px;
            font-weight: 700;
          }

          h3 {
            margin: 8px 0;
            font-size: 1.22rem;
            line-height: 1.22;
          }

          p {
            line-height: 1.6;
          }

          /* =====================================================================
             MODIFICATION — DROITS DES ŒUVRES
             Style de l’encadré juridique discret : visible, mais moins dominant
             que les blocs créateurs / concept.
          ====================================================================== */
          .rightsNotice {
            width: 100%;
            max-width: 1050px;
            margin: 22px auto 0;
            padding: 14px 16px;
            border-radius: 20px;
            border: 1px solid rgba(245, 199, 109, 0.24);
            background: linear-gradient(135deg, rgba(245, 199, 109, 0.08), rgba(0, 0, 0, 0.34));
          }

          .rightsNoticeKicker {
            margin: 0 0 5px;
            color: #f5c76d;
            font-size: 0.76rem;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .rightsNoticeText {
            margin: 0;
            color: rgba(255, 255, 255, 0.78);
            font-size: 0.88rem;
            line-height: 1.45;
          }

          /* =====================================================================
             LIEN TRANSVERSAL — ENCADRÉ BAS DE PAGE VERS KEEFON RENCONTRE
             Bloc discret et réutilisable.
             Si tu veux le déplacer ou le recopier ailleurs, cherche :
             rencontreBottomBox / rencontreBottomButton.
          ====================================================================== */
          .rencontreBottomBox {
            width: 100%;
            max-width: 1050px;
            margin: 28px auto 0;
            padding: 14px 16px;
            border-radius: 20px;
            border: 1px solid rgba(89, 255, 114, 0.26);
            background: linear-gradient(135deg, rgba(89, 255, 114, 0.1), rgba(0, 0, 0, 0.34));
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
          }

          .rencontreBottomKicker {
            margin: 0 0 4px;
            color: var(--paleGreen);
            font-size: 0.78rem;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .rencontreBottomText {
            margin: 0;
            color: rgba(255, 255, 255, 0.82);
            font-size: 0.92rem;
            line-height: 1.45;
          }

          .rencontreBottomButton {
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 34px;
            padding: 0 15px;
            border-radius: 999px;
            border: 1px solid rgba(89, 255, 114, 0.72);
            background: rgba(89, 255, 114, 0.16);
            color: var(--paleGreen);
            text-decoration: none;
            font-size: 0.82rem;
            font-weight: 900;
            white-space: nowrap;
          }

          .rencontreBottomButton:hover {
            background: var(--paleGreen);
            color: #071207;
          }

          .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 18px;
            opacity: 0.72;
            font-size: 0.9rem;
          }

          .creatorBox p,
          .conceptBox p {
            max-width: 850px;
          }

          .modalBackdrop {
            position: fixed;
            inset: 0;
            z-index: 50;
            background: rgba(0, 0, 0, 0.78);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
          }

          .modal,
          .infoModal {
            position: relative;
            width: 100%;
            max-width: 960px;
            max-height: 90vh;
            overflow: auto;
            padding: 22px;
            border-radius: 24px;
            background: rgba(8, 8, 8, 0.96);
            border: 1px solid rgba(255, 255, 255, 0.14);
          }

          .infoModal {
            max-width: 620px;
          }

          .closeButton {
            position: absolute;
            top: 14px;
            right: 14px;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(0, 0, 0, 0.45);
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            z-index: 2;
          }

          .player {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            margin: 22px 0;
            border-radius: 20px;
            overflow: hidden;
            background: black;
          }

          .player iframe,
          .player > div {
            width: 100%;
            height: 100%;
            border: 0;
          }

          .modalThumbnail {
            width: 100%;
            aspect-ratio: 16 / 9;
            object-fit: cover;
            border-radius: 20px;
            margin: 22px 0;
            border: 1px solid rgba(255, 255, 255, 0.14);
          }

          .trackList {
            margin: 24px 0;
            display: grid;
            gap: 10px;
          }

          .trackButton {
            width: 100%;
            text-align: left;
            padding: 14px 16px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.14);
            color: white;
            cursor: pointer;
            display: grid;
            gap: 4px;
          }

          .trackButton span {
            color: #f5c76d;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-size: 0.72rem;
            font-weight: 900;
          }

          .trackButton strong {
            font-size: 1rem;
          }

          .trackButton.active {
            background: rgba(245, 199, 109, 0.18);
            border-color: rgba(245, 199, 109, 0.56);
          }

          .activeTrackBox,
          .authorNote,
          .infoBlock,
          .emptyBox,
          .noEmbedBox {
            padding: 16px;
            margin-top: 16px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .infoBlock ol {
            margin-bottom: 0;
            padding-left: 20px;
          }

          .infoBlock li {
            margin: 6px 0;
          }

          .sourceList {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
          }

          .error {
            padding: 14px 16px;
            border-radius: 16px;
            margin-top: 18px;
            background: rgba(255, 90, 90, 0.18);
            border: 1px solid rgba(255, 90, 90, 0.42);
          }

          /* Mobile : le lien Rencontre reste visible sans alourdir le haut de page. */
          @media (max-width: 560px) {
            .header {
              align-items: flex-start;
              gap: 8px;
              margin-bottom: 16px;
            }

            .brandBlock {
              gap: 8px;
            }

            .headerActions {
              justify-content: flex-end;
              max-width: 48%;
            }

            .brand,
            .searchToggle,
            .rencontreLink {
              min-height: 30px;
              padding: 0 10px;
              font-size: 0.72rem;
            }

            .brand {
              letter-spacing: 0.07em;
            }

            .rencontreLink {
              white-space: normal;
              text-align: center;
              line-height: 1.05;
            }

            .rencontreBottomBox {
              align-items: flex-start;
              flex-direction: column;
              gap: 12px;
              padding: 13px 14px;
              border-radius: 18px;
            }

            .rencontreBottomButton {
              width: 100%;
            }

            .footer {
              align-items: flex-start;
              flex-direction: column;
              gap: 6px;
            }
          }

          /* MODIFICATION — CARTES SANS BOUTON LIRE
             Mobile : cartes compactes avec uniquement le bouton info à droite.
             La lecture se fait désormais par clic / tap sur la miniature. */
          @media (max-width: 560px) {
            .albumCard,
            .creationCard {
              /* MODIFICATION — CARTES SANS BOUTON LIRE
                 Colonne droite réduite : elle ne contient plus que le bouton info. */
              grid-template-columns: 58px minmax(0, 1fr) 22px;
              gap: 8px;
              padding: 8px;
              border-radius: 15px;
            }

            .thumbnailWrap {
              width: 58px;
              border-radius: 12px;
            }

            .itemAuthor {
              margin-bottom: 2px;
              font-size: 0.72rem;
            }

            .itemTitle {
              font-size: 0.82rem;
              line-height: 1.12;
            }

            .creationActions {
              grid-column: 3 / 4;
              grid-row: 1 / 2;
              align-self: center;
              justify-self: end;
              flex-direction: column;
              gap: 4px;
              width: 22px;
            }

            .creationActions .infoButton {
              width: 20px;
              min-width: 20px;
              min-height: 20px;
              height: 20px;
              padding: 0;
              font-size: 0.68rem;
              line-height: 1;
            }
          }

          @media (min-width: 780px) {
            .page {
              background-attachment: fixed;
              padding: 32px 24px 80px;
            }

            .header {
              margin-bottom: 38px;
            }

            .hero {
              margin-bottom: 28px;
            }

            .hero h1 {
              font-size: clamp(2.7rem, 5.4vw, 5.2rem);
            }

            .catalogList {
              gap: 14px;
            }

            .albumCard,
            .creationCard {
              grid-template-columns: 124px 1fr auto;
              padding: 14px;
              border-radius: 22px;
            }

            .thumbnailWrap {
              width: 124px;
              border-radius: 16px;
            }

            .itemTitle {
              font-size: 1.18rem;
            }

            .box {
              padding: 34px;
              margin-bottom: 28px;
            }

            .searchPanel {
              padding: 18px;
            }

            /* Desktop : capsules un peu plus confortables, sans redevenir massives. */
            .badges {
              gap: 9px;
            }

            .badge {
              min-height: 34px;
              padding: 0 14px;
              font-size: 0.84rem;
            }

            .searchActions {
              gap: 10px;
            }

            .searchActions .secondary {
              min-height: 36px;
              padding: 0 14px;
              font-size: 0.84rem;
            }
          }
        `}</style>
      </main>
    </>
  );
}

function AlbumCard({
  album,
  onOpen,
  onInfo,
}: {
  album: MusicAlbum;
  onOpen: () => void;
  onInfo: () => void;
}) {
  return (
    <article className="albumCard">
      {/* MODIFICATION — CARTES SANS BOUTON LIRE
          Un clic / tap sur la miniature lance maintenant la lecture de l’album. */}
      <button
        type="button"
        className="thumbnailWrap thumbnailButton"
        onClick={onOpen}
        aria-label={`Lire l’album ${album.album_title}`}
        title="Lire"
      >
        {album.cover_thumbnail_url ? (
          <img
            src={album.cover_thumbnail_url}
            alt={album.album_title}
            className="thumbnail"
            loading="lazy"
          />
        ) : (
          <span className="thumbnailFallback">Keefon Music</span>
        )}
      </button>

      <div className="creationText">
        <p className="itemAuthor">Auteur : {album.public_author_name}</p>
        <h3 className="itemTitle">{album.album_title}</h3>
      </div>

      <div className="creationActions">
        <button
          type="button"
          className="infoButton"
          onClick={onInfo}
          aria-label="Informations sur l’album"
          title="Informations"
        >
          i
        </button>
      </div>
    </article>
  );
}

function CreationCard({
  creation,
  onOpen,
  onInfo,
}: {
  creation: MusicCreation;
  onOpen: () => void;
  onInfo: () => void;
}) {
  return (
    <article className="creationCard">
      {/* MODIFICATION — CARTES SANS BOUTON LIRE
          Un clic / tap sur la miniature lance maintenant la lecture de la création. */}
      <button
        type="button"
        className="thumbnailWrap thumbnailButton"
        onClick={onOpen}
        aria-label={`Lire ${creation.title}`}
        title="Lire"
      >
        {creation.thumbnail_url ? (
          <img
            src={creation.thumbnail_url}
            alt={creation.title}
            className="thumbnail"
            loading="lazy"
          />
        ) : (
          <span className="thumbnailFallback">Keefon Music</span>
        )}
      </button>

      <div className="creationText">
        <p className="itemAuthor">Auteur : {creation.public_author_name}</p>
        <h3 className="itemTitle">{creation.title}</h3>
      </div>

      <div className="creationActions">
        <button
          type="button"
          className="infoButton"
          onClick={onInfo}
          aria-label="Informations sur la création"
          title="Informations"
        >
          i
        </button>
      </div>
    </article>
  );
}
