import Sidebar from "@/components/DashboardComponents/SidebarComponent";
import Header from "@/components/DashboardComponents/HeaderComponent";
import { Button } from "@/components/ui/button";
import AddIcon from '@mui/icons-material/Add';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Icon } from "@iconify/react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import EditDialogModals from "@/components/SecretaryComponents/EditDialogModals"; // <- ✅ imported
import { X } from "lucide-react";

export default function SecretaryManagement() {
  const [activeField, setActiveField] = useState<null | "name" | "email" | "password">(null);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 md:ml-[250px] ml-0 transition-all duration-300 shadow-sm bg-gray-50 pb-5">
        <header className="fixed top-0 md:left-[260px] left-0 right-0 h-10 bg-white shadow-sm z-10">
          <Header />
        </header>

        <main className="mt-20 px-4 md:px-6 w-full max-w-[1285px] mx-auto">
          <div className="bg-white rounded-[5px] shadow-md w-full p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full mb-6 gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-[20px] md:text-[24px] font-lato font-semibold">Secretary Management</h1>
                <h2 className="text-[12px] font-lato text-gray-500">
                  Manage the account details of your clinic secretary.
                </h2>
              </div>

              {/* Add Secretary Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-[#E46B64] text-white hover:bg-[#d65c58] font-lato h-[36px] px-4 w-full sm:w-auto md:w-[205px] text-[15px] mr-0 ">
                    <AddIcon className="mr-1" />
                    Add a Clinic Secretary
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="w-[457px] h-[310px] font-lato bg-white border-none relative rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed"
                >
                  <div className="text-left mt-5">
                    <DialogTitle className="">
                      <div className="flex flex-col text-center">
                        <h1 className="text-[16px] font-semibold">Namee</h1>
                        <p className="text-[12px] text-gray-400 mt-2">Role Title</p>
                      </div>
                    </DialogTitle>

                    {/* CONTENT */}
                    <div className="mt-6 space-y-4">
                      <div>
                        <Button
                          onClick={() => setActiveField("name")}
                          className="flex items-center w-[415px] h-[47.33px] justify-center border border-[#ECEEF0] text-[#FFFFF] rounded-l-none rounded-r-none px-4"
                        >
                          <span className="text-sm">Name</span>
                          <ArrowForwardIosIcon className="ml-auto w-4 h-4 text-black" />
                        </Button>
                        <Button
                          onClick={() => setActiveField("email")}
                          className="flex items-center w-[415px] h-[47.33px] justify-center border border-[#ECEEF0] text-[#FFFFF] rounded-l-none rounded-r-none px-4"
                        >
                          <span className="text-sm">Email</span>
                          <ArrowForwardIosIcon className="ml-auto w-4 h-4 text-black" />
                        </Button>
                      </div>

                      {/* Reset area password */}
                      <Button
                        onClick={() => setActiveField("password")}
                        className="flex items-center text-left w-[415px] h-[56px] justify-start border border-[#ECEEF0] rounded-none px-4 py-3"
                      >
                        <div className="flex flex-col items-start leading-tight">
                          <span className="text-sm font-medium">Reset password</span>
                          <span className="text-xs text-gray-400">
                            Create a new secure password for the account
                          </span>
                        </div>
                        <ArrowForwardIosIcon className="ml-auto w-4 h-4 text-black" />
                      </Button>
                    </div>
                  </div>

                  {/* 🔥 Unified Modal Controller */}
                  <EditDialogModals
                    open={!!activeField}
                    type={activeField}
                    onClose={() => setActiveField(null)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Account List */}
            <Card>
              <CardContent className="p-4 bg-[#F9FAFB] border border-gray-300 md:px-6 rounded-md w-full">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-sm font-medium text-gray-700">Juan Dela Cruz</h1>
                    <h2 className="text-sm text-gray-500">juan@example.com</h2>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Edit Profile Button */}
                    <Button className="bg-[#E46B64] border-[#E46B64] text-white font-lato hover:shadow-md w-full sm:w-[147px]">
                      <Icon icon="clarity:note-edit-line" className="text-white w-5 h-5 mr-2" />
                      Edit profile
                    </Button>

                    {/* Deactivate Button with AlertDialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-[#FFFFFF] border-[#DBDEE2] text-[#6B7280] font-lato hover:shadow-md w-full sm:w-[147px] ">
                          <Icon icon="mdi:account-minus-outline" className="text-gray-400 w-5 h-5 mr-2" />
                          Deactivate
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent
                        className="w-[525px] font-lato bg-white border-none rounded-lg p-6 shadow-lg top-1/2 left-1/2 fixed -translate-x-1/2 -translate-y-1/2"
                      >

                        {/* Close X */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 "


                        >

                          <X className="w-4 h-4" />

                        </Button>

                        <AlertDialogHeader className="text-left mt-5">
                          <AlertDialogTitle className="text-[20px] font-semibold justify-center text-center">
                            Are you sure you want to deactivate this account?
                          </AlertDialogTitle>
                          <AlertDialogDescription className=" text-gray-500  text-[14px]  justify-center text-center">
                            This will restrict the Clinic Secretary’s access to the system and associated clinic records.
                            You cannot undo this action.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="w-full flex justify-center gap-4 mt-1">
                          <AlertDialogCancel className="w-[147px] h-[45px] text-gray-500 bg-white border border-[#DBDEE2] px-6 py-2 rounded-md">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction className="w-[147px]   h-[45px] bg-[#E46B64] text-white px-6 py-2 rounded-md hover:bg-[#d65c58]">
                            Confirm
                          </AlertDialogAction>
                        </div>

                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
