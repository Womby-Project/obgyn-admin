// src/components/ProtectedLayout.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProtectedLayoutProps = {
  allowedRoles?: string[];
};

export default function ProtectedLayout({ allowedRoles }: ProtectedLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("getUser error:", error.message);
          setRole(null);
          return;
        }

        if (!user) {
          console.log("❌ No authenticated user");
          setRole(null);
          return;
        }

        // 👇 Log user info for debugging
        console.log("✅ Authenticated User:", user);
        console.log("User ID:", user.id);
        console.log("User Email:", user.email);

        // Role lookup
        const { data: obgyn } = await supabase
          .from("obgyn_users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (obgyn) {
          console.log("🎯 Role: obgyn");
          setRole("obgyn");
        } else {
          const { data: secretary } = await supabase
            .from("secretary_users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (secretary) {
            console.log("🎯 Role: secretary");
            setRole("secretary");
          } else {
            console.log("⚠️ No matching role found");
            setRole(null);
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 animate-fade-in">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 "></div>
        <p className="text-gray-600 text-lg">Loading, please wait...</p>
      </div>
    );

  if (!role) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
