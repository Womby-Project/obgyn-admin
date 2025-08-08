import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftIcon, XIcon } from "lucide-react";

interface EditDialogModalsProps {
  type: "name" | "email" | "password" | null;
  onClose: () => void;
  open: boolean;
}

export default function EditDialogModals({ type, onClose, open }: EditDialogModalsProps) {
  const getTitle = () => {
    switch (type) {
      case "name":
        return "Name";
      case "email":
        return "Email";
      case "password":
        return "Reset Password";
      default:
        return "";
    }
  };

  const getSubtext = () => {
    switch (type) {
      case "name":
        return "Enter full name to help us ensure accurate identification.";
      case "email":
        return "To update your email, confirm with your password.";
      case "password":
        return "Enter your new password and confirm it.";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[525px] bg-white rounded-lg p-6 font-lato">
        {/* Back + Close Buttons */}
        <div className="flex items-center justify-between ">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
          
          </Button>
        </div>

        {/* Title + Subheader (Left-Aligned) */}
        <div className="text-left mb-1">
          <DialogTitle className="text-[24px] font-semibold">{getTitle()}</DialogTitle>
          <p className="text-[12px] text-gray-500 mt-1">{getSubtext()}</p>
        </div>

        {/* --- NAME MODAL --- */}
        {type === "name" && (
          <>
            <div className="">
              <label className="block text-sm mb-1">First Name</label>
              <Input placeholder="" className="border-gray-400 h-[45px] " />
            </div>
            <div className="">
              <label className="block text-sm mb-1">Last Name</label>
              <Input placeholder="" className="border-gray-400 h-[45px] " />
            </div>
            <Button className="w-full mt-2 h-[45px] bg-[#E46B64] rounded-lg shadow-md text-white hover:shadow-md">Save Changes</Button>
          </>
        )}

        {/* --- EMAIL MODAL --- */}
        {type === "email" && (
          <>
            <div className="mb-3">
              <label className="block text-sm mb-1">Email</label>
             <Input placeholder="" className="border-gray-400 h-[45px] " />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">Password</label>
              <Input placeholder="" className="border-gray-400 h-[45px] " />
            </div>
            <Button className="w-full mt-2 h-[45px] bg-[#E46B64] rounded-lg shadow-md text-white hover:shadow-md">Save Changes</Button>
          </>
        )}

        {/* --- PASSWORD MODAL --- */}
        {type === "password" && (
          <>
            <div className="mb-3">
              <label className="block text-sm mb-1">New Password</label>
             <Input placeholder="" className="border-gray-400 h-[45px] " />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">Confirm New Password</label>
              <Input placeholder="" className="border-gray-400 h-[45px] " />
            </div>
            <Button className="w-full mt-2 h-[45px] bg-[#E46B64] rounded-lg shadow-md text-white hover:shadow-md">Save Changes</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
