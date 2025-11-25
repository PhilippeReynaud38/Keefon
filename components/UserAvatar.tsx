// UTF-8 – UserAvatar.tsx – version corrigée, robuste, plus de 400

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  userId: string;
  avatarKey?: number;
};

export default function UserAvatar({ userId, avatarKey = 0 }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const { data: photo, error } = await supabase
          .from("photos")
          .select("url")
          .eq("user_id", userId)
          .eq("is_main", true)
          .maybeSingle();

        if (error) {
          console.error("Erreur récupération photo principale :", error.message);
          setAvatarUrl("/default-avatar.png");
          return;
        }

        const storagePath = photo?.url;

        if (storagePath && typeof storagePath === "string") {
          const { data: publicData } = supabase.storage
            .from("avatars")
            .getPublicUrl(storagePath);

          setAvatarUrl(publicData?.publicUrl || "/default-avatar.png");
        } else {
          setAvatarUrl("/default-avatar.png");
        }
      } catch (err) {
        console.error("Erreur inattendue avatar :", err);
        setAvatarUrl("/default-avatar.png");
      }
    };

    if (userId) fetchAvatar();
  }, [userId, avatarKey]);

  return (
    <div className="flex justify-center mt-4">
      <div className="w-32 h-32 rounded-full ring-4 ring-gray-300 overflow-hidden">
        <img
          src={avatarUrl || "/default-avatar.png"}
          alt="Avatar utilisateur"
          className="object-cover w-full h-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-avatar.png";
          }}
        />
      </div>
    </div>
  );
}
