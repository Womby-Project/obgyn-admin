import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftIcon, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditDialogModalsProps {
  type: "name" | "email" | "password" | null;
  onClose: () => void;
  open: boolean;
  secretaryId?: string;
}

export default function EditDialogModals({ type, onClose, open, secretaryId }: EditDialogModalsProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open && secretaryId && (type === "name" || type === "email")) {
      const fetchSecretary = async () => {
        try {
          const { data, error } = await supabase
            .from("secretary_users")
            .select("*")
            .eq("id", secretaryId)
            .single();
          if (error) throw error;
          if (data) {
            setFirstName(data.first_name);
            setLastName(data.last_name);
            setEmail(data.email);
          }
        } catch (err: any) {
          console.error("Error fetching secretary:", err);
          setError("Failed to fetch secretary data.");
        }
      };
      fetchSecretary();
    }
  }, [open, secretaryId, type]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (type === "name" && secretaryId) {
        const { error } = await supabase
          .from("secretary_users")
          .update({ first_name: firstName, last_name: lastName })
          .eq("id", secretaryId);
        if (error) throw error;
        setSuccess("Name updated successfully.");
      }

      if (type === "email" && secretaryId) {
        if (!email) throw new Error("Email cannot be empty.");
        if (!password) throw new Error("Please confirm with your current password.");

        // Fetch the current secretary details
        const { data: secretaryData, error: secErr } = await supabase
          .from("secretary_users")
          .select("email")
          .eq("id", secretaryId)
          .single();
        if (secErr) throw secErr;

        // Verify their current password
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: secretaryData.email,
          password,
        });

        if (signInError) throw new Error("Invalid password. Please try again.");
        if (!signInData.user) throw new Error("User not found.");

        // Update in Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({
          email,
        });
        if (authError) throw authError;

        // Update in your custom table
        const { error: dbError } = await supabase
          .from("secretary_users")
          .update({ email })
          .eq("id", secretaryId);
        if (dbError) throw dbError;

        setSuccess("Email updated successfully.");
        setPassword(""); // clear password field
      }

      if (type === "password" && secretaryId) {
        if (!password || !confirmPassword) throw new Error("Password fields cannot be empty.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");

        const { error } = await supabase.auth.admin.updateUserById(secretaryId, { password });
        if (error) throw error;
        setSuccess("Password updated successfully.");
        setPassword("");
        setConfirmPassword("");
      }

      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error("Error updating secretary:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "name": return "Name";
      case "email": return "Email";
      case "password": return "Reset Password";
      default: return "";
    }
  };

  const getSubtext = () => {
    switch (type) {
      case "name": return "Enter full name to help us ensure accurate identification.";
      case "email": return "To update your email, confirm with your password.";
      case "password": return "Enter your new password and confirm it.";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[525px] bg-white rounded-lg p-6 font-lato">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}></Button>
        </div>

        <div className="text-left mb-1">
          <DialogTitle className="text-[24px] font-semibold">{getTitle()}</DialogTitle>
          <DialogDescription className="text-[12px] text-gray-500 mt-1">{getSubtext()}</DialogDescription>
        </div>

        {error && (
          <Alert className="bg-red-100 border-l-4 border-[#E46B64] text-[#E46B64] text-sm mb-2">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-100 border-l-4 border-green-600 text-green-700 text-sm mb-2">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {type === "name" && (
          <>
            <div>
              <label className="block text-sm mb-1">First Name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border-gray-400 h-[45px]" />
            </div>
            <div>
              <label className="block text-sm mb-1">Last Name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="border-gray-400 h-[45px]" />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full mt-2 h-[45px] bg-[#E46B64] rounded-lg shadow-md text-white hover:shadow-md">
              Save Changes
            </Button>
          </>
        )}

        {type === "email" && (
          <>
            <div className="mb-3">
              <label className="block text-sm mb-1">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-400 h-[45px]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter current password"
                className="border-gray-400 h-[45px]"
              />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full mt-2 h-[45px] bg-[#E46B64] rounded-lg shadow-md text-white hover:shadow-md">
              Save Changes
            </Button>
          </>
        )}

        {type === "password" && (
          <>
            <div className="mb-3">
              <label className="block text-sm mb-1">New Password</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} className="border-gray-400 h-[45px]" />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">Confirm New Password</label>
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border-gray-400 h-[45px]" />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full mt-2 h-[45px] bg-[#E46B64] rounded-lg shadow-md text-white hover:shadow-md">
              Save Changes
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
