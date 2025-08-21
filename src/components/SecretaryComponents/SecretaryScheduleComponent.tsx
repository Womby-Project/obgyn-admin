

import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const scheduleData = [
    { name: 'Lisa Chen', time: '9:00 AM', status: 'Confirmed' },
    { name: 'Michael Cruz', time: '10:00 AM', status: 'Pending' },
    { name: 'Angela Lee', time: '11:00 AM', status: 'Confirmed' },
];





export default function SecretarySchedule() {

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 w-full max-w-[800px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Today's Schedule</h2>
                {/* under the h2 a time.now please */}
                <button className="text-sm text-[#E46B64] font-medium hover:underline">View All</button>
            </div>

            {/* Appointment Cards */}
            <div className="space-y-3">
                {scheduleData.map((item, index) => {
                    
                    return (
                        <Card
                            key={index}
                            className="p-3 transition cursor-pointer hover:shadow-md hover:bg-[#f4f4f4]"
                            style={{
                                backgroundColor: "#FBFBFB",
                                borderColor: "#EEEEEE",
                                borderWidth: "1px",
                                borderStyle: "solid",
                            }}
                        >
                            <CardHeader className="flex items-center justify-between">
                                {/* Left: Icon + Details */}
                                <div className="flex items-center gap-4">
                                    <div>
                                        <CardTitle className="text-[17px] font-lato text-gray-800">
                                            {item.name}
                                        </CardTitle>
                                        <CardDescription className="text-[12px] font-lato text-gray-600">
                                            Pregnant, 32 weeks • Monthly Checkup
                                        </CardDescription>
                                    </div>
                                </div>

                                {/* Right: Time and Status */}
                                <CardAction className="flex flex-col justify-center items-end gap-1">
                                    <p className="text-[18px] font-lato text-gray-800">{item.time}</p>
                                </CardAction>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
