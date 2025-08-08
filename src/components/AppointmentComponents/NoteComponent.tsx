import { useSearchParams, Link } from 'react-router-dom';
import Sidebar from '@/components/DashboardComponents/SidebarComponent';
import Header from '@/components/DashboardComponents/HeaderComponent';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function NoteComponent() {
  const [searchParams] = useSearchParams();
  const patientName = searchParams.get('name');

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1 ml-[260px] bg-gray-50">
        {/* Fixed Header */}
        <header className="fixed top-0 left-[260px] right-0 h-10 bg-white shadow-sm z-10">
          <Header />
        </header>

        {/* Main Content */}
        <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden mt-2">
          <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
            <div className="flex flex-col gap-9 mt-2 items-start w-full">
              <div className="flex flex-col p-1 mt-2 w-full">
                {/* Title */}
                <h1 className="text-[22px] font-lato font-semibold">Consultation Notes</h1>

                {/* Subheading with Breadcrumb */}
                <h2 className="text-[11px] font-lato text-gray-500">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link
                            className='hover:underline cursor-pointer'
                            to="/appointments">Appointments</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbPage>{patientName}</BreadcrumbPage>
                    </BreadcrumbList>
                  </Breadcrumb>
                </h2>
              </div>

              {/* Note Content */}
              <div className="text-sm text-gray-600">
                <p>This is where the note details for <strong>{patientName}</strong> will go.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
