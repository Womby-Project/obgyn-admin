// src/components/ProtectedLayout.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProtectedLayout({ allowedRoles }: { allowedRoles?: string[] }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session) {
        setIsAuthenticated(true);
        const userId = session.user.id;

        // Try obgyn_users
        let { data: obgyn } = await supabase
          .from("obgyn_users")
          .select("id")
          .eq("id", userId)
          .single();

        if (obgyn) {
          setRole("obgyn");
        } else {
          // Try secretary_users
          let { data: secretary } = await supabase
            .from("secretary_users")
            .select("id")
            .eq("id", userId)
            .single();

          if (secretary) {
            setRole("secretary");
          } else {
            setRole(null); // not found in either
          }
        }
      }

      setLoading(false);
    };

    checkSession();
  }, []);


  if (loading) return <p>Loading please wait...</p>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(role ?? "")) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
