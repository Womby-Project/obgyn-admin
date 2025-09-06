// src/layouts/DashboardLayout.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/DashboardComponents/SidebarComponent";
import Header from "@/components/DashboardComponents/HeaderComponent";
import { supabase } from "@/lib/supabaseClient";

type UserData = {
  name: string;
  avatarUrl?: string;
  role: "OBGYN" | "Secretary";
};



export default function DashboardLayout() {
  const [user, setUser] = useState<UserData | null>(null);
  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userInitialized = useRef(false);

  const setUserAvatar = useCallback((url: string | null) => {
    setUser((prev) =>
      prev
        ? { ...prev, avatarUrl: url ? `${url}?t=${Date.now()}` : undefined }
        : prev
    );
  }, []);

  useEffect(() => {
    // Don't reinitialize if user is already loaded and we're just navigating
    if (userInitialized.current && user) {
      console.log("🔄 Navigation detected, keeping existing subscription");
      return;
    }

    const init = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        
        if (!authUser) {
          console.warn("No authenticated user found");
          return;
        }

        console.log("🔍 Checking user type for:", authUser.id);

        // Clean up existing subscription before creating a new one
        if (channelRef.current) {
          console.log("🧹 Cleaning up existing subscription before creating new one");
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // --- Try OBGYN FIRST (hierarchy preference) ---
        try {
          const { data: obgyn, error: obgynError } = await supabase
            .from("obgyn_users")
            .select("id, first_name, last_name, profile_picture_url")
            .eq("id", authUser.id)
            .maybeSingle();

          if (obgyn) {
            console.log("✅ User is OB-GYN:", obgyn);
            setUser({
              name: `${obgyn.first_name} ${obgyn.last_name}`,
              avatarUrl: obgyn.profile_picture_url
                ? `${obgyn.profile_picture_url}?t=${Date.now()}`
                : undefined,
              role: "OBGYN",
            });

            // Set up real-time subscription for OB-GYN updates
            channelRef.current = supabase
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
                  console.log("OB-GYN data updated:", payload);
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
            
            userInitialized.current = true;
            return;
          }

          if (obgynError) {
            console.warn("OB-GYN check returned error:", obgynError);
          }

        } catch (obgynFetchError) {
          // Handle 406 or other RLS errors gracefully
          console.warn("Could not check OB-GYN table (likely RLS/permissions):", obgynFetchError);
        }

        // --- Try Secretary if not OB-GYN or if OB-GYN check failed ---
        const { data: secretary, error: secError } = await supabase
          .from("secretary_users")
          .select("id, first_name, last_name")
          .eq("id", authUser.id)
          .maybeSingle();

        if (secretary) {
          console.log("✅ User is Secretary:", secretary);
          setUser({
            name: `${secretary.first_name} ${secretary.last_name}`,
            avatarUrl: undefined,
            role: "Secretary",
          });

          // Set up real-time subscription for secretary updates
          channelRef.current = supabase
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
                console.log("Secretary data updated:", payload);
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
          
          userInitialized.current = true;
          return;
        }

        if (secError) {
          console.error("Secretary check error:", secError);
        }

        // If neither OB-GYN nor Secretary
        console.warn("User is neither OB-GYN nor Secretary");

      } catch (error) {
        console.error("Unexpected error in DashboardLayout init:", error);
      }
    };

    init();

    // Only cleanup on actual component unmount
    return () => {
      if (channelRef.current) {
        console.log("🧹 Component unmounting - cleaning up real-time subscription");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        userInitialized.current = false;
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Log navigation changes without reinitializing
  useEffect(() => {
    console.log("📍 Navigated to:", location.pathname);
  }, [location.pathname]);

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