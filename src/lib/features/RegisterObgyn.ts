// C:\Users\markn\Desktop\dashboard-obgyn\frontend\src\lib\features\RegisterObgyn.ts

import { supabase } from "@/lib/supabaseClient";
import {
  obgynRegistrationSchema,
  type ObgynRegistrationData,
} from "@/lib/schemas/obgynRegistrationSchema";

export async function registerObgyn(rawData: any) {
  console.log("Submitting payload:", rawData); // ✅ See exactly what’s sent in

  // 1️⃣ Validate with Zod
  const parsed = obgynRegistrationSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.format() };
  }

  const data: ObgynRegistrationData = parsed.data;

  // 2️⃣ Create auth user in Supabase
  const { data: authUser, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: rawData.password, // password is handled separately
  });

  if (signUpError) return { error: signUpError.message };
  if (!authUser.user) return { error: "Failed to create user" };

  // 3️⃣ Insert into obgyn_users (mapping your form field names → DB columns)
  const { error: insertError1 } = await supabase
    .from("obgyn_users")
    .insert([
      {
        id: authUser.user.id,
        first_name: rawData.first_name || "",
        last_name: rawData.last_name || "",
        gender: rawData.gender || null,
        email: rawData.email || "",
        prc_license_number: rawData.prcLicense || "", // mapping
        affiliated_hospitals_clinics: rawData.affiliatedHospital
          ? [rawData.affiliatedHospital]
          : [],
        phone_number: rawData.phone_number || "",
        birth_date: rawData.birth_date
          ? new Date(rawData.birth_date)
          : null,
        education: rawData.education || "",
        profile_picture_url: rawData.profile_picture_url || "",
      },
    ]);

  if (insertError1) return { error: insertError1.message };

  // 4️⃣ Insert into obgyn_availability
  if (rawData.selectedDays && rawData.timeSlots?.length > 0) {
    const availabilityRecords = rawData.timeSlots.map((slot: any) => ({
      obgyn_id: authUser.user!.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
    }));

    const { error: insertError2 } = await supabase
      .from("obgyn_availability")
      .insert(availabilityRecords);

    if (insertError2) return { error: insertError2.message };
  }

  return { success: true, userId: authUser.user.id };
}
