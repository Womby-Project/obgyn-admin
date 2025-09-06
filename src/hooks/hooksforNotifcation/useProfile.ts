// hooks/useProfile.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type UserProfile = {
  id: string;
  name: string;
  role: "secretary" | "obgyn";
  avatar_url?: string;
};

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: secretaryData } = await supabase
        .from("secretary_users")
        .select("id, first_name, last_name, profile_picture_url")
        .eq("id", user.id)
        .maybeSingle();

      if (secretaryData) {
        setProfile({
          id: secretaryData.id,
          name: `${secretaryData.first_name} ${secretaryData.last_name}`,
          role: "secretary",
          avatar_url: secretaryData.profile_picture_url,
        });
        return;
      }

      const { data: obgynData } = await supabase
        .from("obgyn_users")
        .select("id, first_name, last_name, profile_picture_url")
        .eq("id", user.id)
        .maybeSingle();

      if (obgynData) {
        setProfile({
          id: obgynData.id,
          name: `${obgynData.first_name} ${obgynData.last_name}`,
          role: "obgyn",
          avatar_url: obgynData.profile_picture_url,
        });
      }
    };

    fetchProfile();
  }, []);

  return profile;
}
