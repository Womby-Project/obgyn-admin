import { supabase } from "@/lib/supabaseClient";

export async function getAgoraToken(roomId: string, uid: number) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    "https://wplysxtfujbvrnoizmgz.supabase.co/functions/v1/video-call",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 👈 attach session token
      },
      body: JSON.stringify({ roomId, uid }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to get token: ${res.status}`);
  }

  return res.json(); // { token, appId }
}
