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
      return "Création";
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

  const fallbackRubriques = [
    {
      id: "fallback-1",
      name: "Univers imaginaires",
      slug: "univers-imaginaires",
    },
    {
      id: "fallback-2",
      name: "Chansons à texte",
      slug: "Chansons à texte",
    },
    { id: "fallback-3", name: "Clips", slug: "clips" },
    {
      id: "fallback-4",
      name: "Paysages sonores",
      slug: "paysages-sonores",
    },
    { id: "fallback-5", name: "Satire", slug: "satire" },
    { id: "fallback-6", name: "Expériences IA", slug: "experiences-ia" },
  ];

  const rubriques = categories.length > 0 ? categories : fallbackRubriques;

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
      const categorySlug = getCategorySlug(album.category_id);
      const matchCategory =
        selectedCategorySlug === "all" || categorySlug === selectedCategorySlug;

      const searchContent = normalizeText(
        [
          album.album_title,
          album.public_author_name,
          platformLabel(album.platform),
          getCategoryName(album.category_id),
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
      const categorySlug = getCategorySlug(creation.category_id);
      const matchCategory =
        selectedCategorySlug === "all" || categorySlug === selectedCategorySlug;

      const searchContent = normalizeText(
        [
          creation.title,
          creation.public_author_name,
          creation.description,
          creation.author_note,
          platformLabel(creation.platform),
          getCategoryName(creation.category_id),
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

  // ==============================
  // MODIFICATION — PWA KEEFON MUSIC
  // ==============================
  // Cette sécurité force la page /musique à utiliser le manifeste Music,
  // même si un manifeste global Keefon est déjà déclaré ailleurs
  // dans le projet (_app, _document ou layout commun).
  // But : permettre à Keefon Music d’avoir son propre raccourci/appli
  // sans casser le manifeste général de Keefon Rencontre.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const musicManifestHref = "/manifest-music.webmanifest";
    const existingManifest = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]'
    );

    if (existingManifest) {
      const previousManifestHref = existingManifest.getAttribute("href");

      existingManifest.setAttribute("href", musicManifestHref);
      existingManifest.setAttribute("data-keefon-music-manifest", "true");

      return () => {
        if (previousManifestHref) {
          existingManifest.setAttribute("href", previousManifestHref);
        } else {
          existingManifest.removeAttribute("href");
        }

        existingManifest.removeAttribute("data-keefon-music-manifest");
      };
    }

    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = musicManifestHref;
    manifestLink.setAttribute("data-keefon-music-manifest", "true");
    document.head.appendChild(manifestLink);

    return () => {
      manifestLink.remove();
    };
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

  function getCategoryName(categoryId: string | null) {
    if (!categoryId) return "Création musicale";

    const category = categories.find((item) => item.id === categoryId);
    return category?.name || "Création musicale";
  }

  function getCategorySlug(categoryId: string | null) {
    if (!categoryId) return "";

    const category = categories.find((item) => item.id === categoryId);
    return category?.slug || "";
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
          content="Keefon Music présente des chansons narratives, clips, univers visuels et projets créatifs."
        />

        {/* ==============================
            MODIFICATION — PWA KEEFON MUSIC
            Manifeste spécifique à la page /musique.
            Il donne au raccourci installé le nom, l’icône et la page
            de démarrage Keefon Music.
            Important : le fichier /manifest.json général reste réservé
            à Keefon / Keefon Rencontre.
        =============================== */}
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

            <div className="searchActions">
              <a href="/musique/proposer" className="secondary">
                Diffuser une création
              </a>

              <button
                type="button"
                className="primary"
                onClick={() => setIsSearchOpen(false)}
              >
                Voir les résultats
              </button>
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
        Vous pouvez proposer une chanson correspondant à nos catégories, un morceau audio, une ambiance sonore, un clip ou un projet plus narratif. Le clip vidéo n’est pas obligatoire.

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
                    Rubrique : {getCategoryName(selectedAlbumInfo.category_id)}
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
                    {getCategoryName(selectedCreationInfo.category_id)}
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
            background-attachment: scroll;
            padding: 18px 14px 56px;
          }

          .header,
          .hero,
          .resultsSection,
          .searchPanel,
          .box,
          .footer {
            width: min(100%, 1050px);
            margin-left: auto;
            margin-right: auto;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }

          .brand {
            color: white;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 0.78rem;
            font-weight: 900;
          }

          .searchToggle {
            min-height: 38px;
            padding: 0 12px;
            border-radius: 999px;
            border: 1px solid rgba(245, 199, 109, 0.42);
            background: rgba(0, 0, 0, 0.28);
            color: white;
            font-weight: 900;
            cursor: pointer;
            font-size: 0.84rem;
          }

          .searchPanel {
            margin-bottom: 18px;
            padding: 16px;
            border-radius: 22px;
            background: rgba(0, 0, 0, 0.62);
            border: 1px solid rgba(245, 199, 109, 0.22);
          }

          .searchPanel label {
            display: block;
            font-weight: 900;
            margin-bottom: 16px;
          }

          .searchPanel input {
            width: 100%;
            margin-top: 8px;
            padding: 13px 14px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.22);
            background: rgba(0, 0, 0, 0.42);
            color: white;
            font: inherit;
          }

          .miniLabel,
          .label,
          .subLabel {
            color: #f5c76d;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-size: 0.72rem;
            font-weight: 900;
            margin-bottom: 10px;
          }

          .badges {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .badge {
            min-height: 36px;
            padding: 0 13px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            background: rgba(255, 255, 255, 0.05);
            color: white;
            cursor: pointer;
            font-weight: 800;
          }

          .badge.active {
            background: #f5c76d;
            color: #111;
            border-color: #f5c76d;
          }

          .searchActions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 18px;
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

          .thumbnail {
            width: 100%;
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

          .creationActions {
            display: flex;
            gap: 6px;
            align-items: center;
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

          .footer {
            margin-top: 34px;
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
            width: min(100%, 960px);
            max-height: 90vh;
            overflow: auto;
            padding: 22px;
            border-radius: 24px;
            background: rgba(8, 8, 8, 0.96);
            border: 1px solid rgba(255, 255, 255, 0.14);
          }

          .infoModal {
            width: min(100%, 620px);
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

          @media (max-width: 420px) {
            .albumCard,
            .creationCard {
              grid-template-columns: 68px 1fr;
            }

            .thumbnailWrap {
              width: 68px;
            }

            .creationActions {
              grid-column: 2 / 3;
              justify-content: flex-start;
            }

            .primary {
              min-height: 36px;
              padding: 0 12px;
            }

            .infoButton {
              width: 36px;
              min-width: 36px;
              min-height: 36px;
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
              padding: 22px;
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
      <div className="thumbnailWrap">
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
      </div>

      <div className="creationText">
        <p className="itemAuthor">Auteur : {album.public_author_name}</p>
        <h3 className="itemTitle">{album.album_title}</h3>
      </div>

      <div className="creationActions">
        <button type="button" className="primary" onClick={onOpen}>
          Lire
        </button>

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
      <div className="thumbnailWrap">
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
      </div>

      <div className="creationText">
        <p className="itemAuthor">Auteur : {creation.public_author_name}</p>
        <h3 className="itemTitle">{creation.title}</h3>
      </div>

      <div className="creationActions">
        <button type="button" className="primary" onClick={onOpen}>
          Lire
        </button>

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
