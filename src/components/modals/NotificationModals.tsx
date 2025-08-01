import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';

const rebeccaImg = '@/assets/rebeca.png'; 

export default function NotificationModals() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md">
      {/* Notification 1 */}
      <div className="flex gap-4 border-b border-gray-200 pb-4 mb-4">
        <img
          src={rebeccaImg}
          alt="Rebecca Lim"
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex flex-col justify-between flex-1">
          <p className="text-gray-800 text-sm text-left">
            <strong>Patient Name 1</strong> booked an appointment for June 21, 2025 (Saturday).
          </p>
          <div className="flex flex-col items-start mt-2 gap-1">
            <button
              className="bg-[#E46B64] text-white text-xs px-3 py-1 rounded-md hover:bg-[#d85b55] transition"
            >
              See Appointment
            </button>
            <span className="text-gray-400 text-xs">10 minutes ago</span>
          </div>
        </div>
      </div>

      {/* Notification 2 */}
      <div className="flex gap-4 border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#06B6D4] text-white">
          <QueryBuilderIcon fontSize="medium" />
        </div>
        <div className=" flex flex-col justify-between flex-1">
          <p className=" text-left text-gray-800 text-sm text-left">
            You have an upcoming appointment with <strong>Patient Name 2</strong> tomorrow (June 16, 2025) at 1:00 PM.
          </p>
          <span className="text-gray-400 text-xs mt-2 text-left">10 minutes ago</span>
        </div>
      </div>

      {/* Notification 3 */}
      <div className="flex gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#DC2626] text-white">
          <ReportGmailerrorredIcon fontSize="medium" />
        </div>
        <div className="flex flex-col justify-between flex-1">
          <p className="text-left text-gray-800 text-sm text-left">
            3 patients showed signs of mood decline. They logged “Anxious” or “Sad” more than 3 times.
          </p>
          <span className="text-gray-400 text-xs mt-2 text-left">10 minutes ago</span>
        </div>
      </div>
    </div>
  );
}
