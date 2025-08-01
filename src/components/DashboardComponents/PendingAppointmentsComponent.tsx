import lim from '@/assets/rebeca.png';
import rebeca from '@/assets/lim.png';

export default function PendingAppointmentsComponent() {
  const appointments = [
    {
      name: 'Emma Wilson',
      date: 'December 10, 2024',
      time: '1:00 PM - 1:30 PM',
      type: 'Consultation',
      image: lim,
    },
    {
      name: 'Rebeca Lim',
      date: 'December 10, 2024',
      time: '1:00 PM - 1:30 PM',
      type: 'Follow-up',
      image: rebeca,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full max-w-[1180px] mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Pending Appointments</h2>
        <button className="text-sm text-[#E46B64] font-medium hover:underline">View All</button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_2fr] font-semibold text-gray-500 text-sm bg-gray-50 h-[40px] items-center px-4">
        <div className="text-left">Patient</div>
        <div className="text-left">Date</div>
        <div className="text-left">Time</div>
        <div className="text-left">Type</div>
        <div className="text-center">Actions</div>
      </div>

      {/* Rows */}
      <div className="overflow-hidden">
        {appointments.map((appt, index) => (
          <div
            key={index}
            className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_2fr] items-center py-4 border-b border-gray-300 text-sm text-gray-700 px-4"
          >
            {/* Patient */}
            <div className="flex items-center gap-3">
              <img
                src={appt.image}
                alt={appt.name}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
              <span>{appt.name}</span>
            </div>

            <div>{appt.date}</div>
            <div>{appt.time}</div>
            <div>{appt.type}</div>

            <div className="flex gap-2 justify-center">
              <button className="bg-[#E46B64] text-white text-xs px-4 py-1.5 rounded-md hover:bg-[#d85b55] transition">
                Accept
              </button>
              <button className="text-[#E46B64] text-xs font-medium hover:underline">
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
