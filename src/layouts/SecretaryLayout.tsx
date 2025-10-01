// src/layouts/DashboardLayout.tsx
import { useEffect, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/DashboardComponents/SidebarComponent";
import Header from "@/components/DashboardComponents/HeaderComponent";
import { supabase } from "@/lib/supabaseClient";

type UserData = {
  name: string;
  avatarUrl?: string;
  role: "OBGYN" | "Secretary";
};

export default function SecretaryLayout() {
  const [user, setUser] = useState<UserData | null>(null);

  // ✅ Callback to update avatar from child components
  const setUserAvatar = useCallback((url: string | null) => {
    setUser((prev) =>
      prev
        ? { ...prev, avatarUrl: url ? `${url}?t=${Date.now()}` : undefined }
        : prev
    );
  }, []);

  useEffect(() => {
    let channel: any;

    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      // Fetch initial user (OBGYN)
      const { data: obgyn } = await supabase
        .from("obgyn_users")
        .select("id, first_name, last_name, profile_picture_url")
        .eq("id", authUser.id)
        .single();

      if (obgyn) {
        setUser({
          name: `${obgyn.first_name} ${obgyn.last_name}`,
          avatarUrl: obgyn.profile_picture_url
            ? `${obgyn.profile_picture_url}?t=${Date.now()}`
            : undefined,
          role: "OBGYN",
        });

        // Realtime subscription
        channel = supabase
          .channel("obgyn_changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "obgyn_users",
              filter: `id=eq.${authUser.id}`,
            },
            (payload) => {
              const updated = payload.new as any;
              if (updated) {
                setUser({
                  name: `${updated.first_name} ${updated.last_name}`,
                  avatarUrl: updated.profile_picture_url
                    ? `${updated.profile_picture_url}?t=${Date.now()}`
                    : undefined,
                  role: "OBGYN",
                });
              }
            }
          )
          .subscribe();

        return;
      }

      // Secretary fallback
      const { data: secretary } = await supabase
        .from("secretary_users")
        .select("id, first_name, last_name")
        .eq("id", authUser.id)
        .single();

      if (secretary) {
        setUser({
          name: `${secretary.first_name} ${secretary.last_name}`,
          avatarUrl: undefined,
          role: "Secretary",
        });

        channel = supabase
          .channel("secretary_changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "secretary_users",
              filter: `id=eq.${authUser.id}`,
            },
            (payload) => {
              const updated = payload.new as any;
              if (updated) {
                setUser({
                  name: `${updated.first_name} ${updated.last_name}`,
                  avatarUrl: undefined,
                  role: "Secretary",
                });
              }
            }
          )
          .subscribe();
      }
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar user={user} />

      <div className="flex flex-col flex-1 ml-[260px] bg-gray-50">
        <header className="fixed top-0 left-[260px] right-0 h-6 bg-white shadow-sm z-10">
          <Header
          />
        </header>

 
          <div className="fixed top-15 left-[260px] right-0 bottom-0 overflow-hidden bg-gray-50 overflow-y-auto scrollbar-hide">
            <Outlet context={{ setUserAvatar }} />
            
          </div>
       
      </div>
    </div>
  );
}
