// UTF-8 – UserAvatar.tsx – version corrigée anti-400 et anti-URL cassée

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  userId: string;
  avatarKey?: number;
};

export default function UserAvatar({ userId, avatarKey = 0 }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string>("/default-avatar.png"); // Valeur par défaut sûre

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!userId) return; // ❌ Ne rien faire si userId absent

      try {
        const { data: photo, error } = await supabase
          .from("photos")
          .select("url")
          .eq("user_id", userId)
          .eq("is_main", true)
          .maybeSingle();

        if (error || !photo?.url || typeof photo.url !== "string") {
          setAvatarUrl("/default-avatar.png"); // ⛑️ fallback
          return;
        }

        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(photo.url);

        if (
          publicData?.publicUrl &&
          typeof publicData.publicUrl === "string" &&
          !publicData.publicUrl.includes(":") // ⛔ empêche les `:1` ou autres suffixes douteux
        ) {
          setAvatarUrl(publicData.publicUrl);
        } else {
          setAvatarUrl("/default-avatar.png");
        }
      } catch (err) {
        console.error("Erreur inattendue avatar :", err);
        setAvatarUrl("/default-avatar.png");
      }
    };

    fetchAvatar();
  }, [userId, avatarKey]);

  return (
    <div className="flex justify-center mt-4">
      <div className="w-32 h-32 rounded-full ring-4 ring-gray-300 overflow-hidden">
        <img
          src={avatarUrl}
          alt="Avatar utilisateur"
          className="object-cover w-full h-full"
          onError={(e) => {
            // 🧯 Sécurité DOM : recharge fallback si image cassée côté navigateur
            const target = e.target as HTMLImageElement;
            if (target.src !== "/default-avatar.png") {
              target.src = "/default-avatar.png";
            }
          }}
        />
      </div>
    </div>
  );
}
