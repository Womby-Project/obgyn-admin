import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Type for the joined role row
type UserRoleRow = {
  roles: {
    role_name: string;
  } | null;
};

// Type for profile tables (OBGYN, Patient, Secretary)
type UserProfileRow = {
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
};

export function useUserProfile() {
  const [profile, setProfile] = useState<{
    fullName: string;
    role: string;
    avatarUrl: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      // 1️⃣ Get the logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 2️⃣ Get the user's role from user_roles + roles
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("roles (role_name)")
        .eq("user_id", user.id)
        .single<UserRoleRow>();

      if (roleError) {
        console.error("Error fetching role:", roleError);
      }

      const roleName = roleData?.roles?.role_name ?? "";

      // 3️⃣ Pick the correct profile table
      let tableName: string | null = null;
      if (roleName === "OBGYN") tableName = "obgyn_users";
      else if (roleName === "Patient") tableName = "patient_users";
      else if (roleName === "Secretary") tableName = "secretary_users";

      // 4️⃣ Fetch the user profile details
      let profileData: UserProfileRow | null = null;
      if (tableName) {
        const { data, error } = await supabase
          .from(tableName)
          .select("first_name, last_name, profile_picture_url")
          .eq("id", user.id)
          .single<UserProfileRow>();

        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          profileData = data;
        }
      }

      // 5️⃣ Build the profile state
      setProfile({
        fullName: profileData
          ? `${profileData.first_name} ${profileData.last_name}`
          : user.email || "Unknown User",
        role: roleName,
        avatarUrl: profileData?.profile_picture_url || "",
      });

      setLoading(false);
    }

    loadProfile();
  }, []);

  return { profile, loading };
}
