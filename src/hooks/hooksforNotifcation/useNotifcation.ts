// hooks/useNotifications.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Notification = {
  id: string;
  message: string;
  is_read: boolean;
  related_appointment_id?: string;
  recipient_id: string;
  created_at: string;
  recipient_role: "OBGYN" | "Secretary" | "Patient";
  appointments?: {
    patient_users?: {
      profile_avatar_url: string | null;
      full_name?: string | null;
    } | null;
  } | null;
};

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notifications on mount and when userId changes
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
  id, message, related_appointment_id, is_read, recipient_id, created_at, recipient_role,
  appointments:related_appointment_id (
    patient_users:patient_id (
      profile_avatar_url, first_name, last_name
    )
  )
`)
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error.message);
        return;
      }

      if (data) setNotifications(data as unknown as Notification[]);
    };

    fetchNotifications();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => {
            // Prevent duplicates on refresh or real-time
            if (prev.some((n) => n.id === payload.new.id)) return prev;
            return [payload.new as Notification, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications, setNotifications };
}
