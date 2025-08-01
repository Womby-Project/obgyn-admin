import { SymptomsIcon, MoodIcon } from './InsightIcons';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const insights = [
  { id: 1, type: "symptom", name: "Maria Dela Cruz", description: "Reported increase in nausea", timestamp: new Date(Date.now() - 86400000 * 1) }, // 1 day ago
  { id: 2, type: "mood", name: "Anna Santos", description: "Feeling more upbeat this week", timestamp: new Date(Date.now() - 3600000 * 5) }, // 5 hours ago
  { id: 3, type: "symptom", name: "Jenny Reyes", description: "Low energy observed", timestamp: new Date(Date.now() - 86400000 * 3) },
  { id: 4, type: "mood", name: "Karla Dizon", description: "Increased anxiety levels", timestamp: new Date(Date.now() - 3600000 * 2) },
  { id: 5, type: "symptom", name: "Celine Navarro", description: "Recurring mild headaches", timestamp: new Date(Date.now() - 1000 * 60 * 45) }, // 45 mins ago
  { id: 6, type: "mood", name: "Liza Mariano", description: "Reported sense of calm", timestamp: new Date(Date.now() - 86400000 * 5) },
  { id: 7, type: "symptom", name: "Monica Fajardo", description: "Noticed lower back pain", timestamp: new Date(Date.now() - 1000 * 60 * 10) }, // 10 mins ago
  { id: 8, type: "mood", name: "Bianca Cruz", description: "Feeling irritable lately", timestamp: new Date(Date.now() - 3600000 * 48) },
  { id: 9, type: "symptom", name: "Nina Garcia", description: "Mild cramping noted", timestamp: new Date(Date.now() - 86400000 * 7) },
  { id: 10, type: "mood", name: "Rhea Lim", description: "More energy for tasks", timestamp: new Date(Date.now() - 1000 * 60 * 1) }, // 1 min ago
];
const getColor = (type: string) => {
  if (type === "symptom") {
    return { background: "#FEF2F2", border: "rgba(252, 165, 165, 0.5)" }; // light red bg, red stroke
  } else {
    return { background: "#FFF0DD", border: "rgba(253, 186, 116, 0.4)" }; // light orange bg, orange stroke
  }
};
const getIcon = (type: string) => {
  if (type === "symptom") return <SymptomsIcon />;
  if (type === "mood") return <MoodIcon />;
  return null; 
}
const getTitle = (type: string, name: string) =>
  `${type === "symptom" ? "Symptom Alert" : "Mood Alert"} – ${name}`;


function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60) return `${diff} sec${diff !== 1 ? 's' : ''} ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
}

export default function MaternlInsightPanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-3 h-[530px]">
      {/* Header  */}
      <div className="flex flex-col items-start border-b-1 border-gray-100 pb-2 w-full  left-0 ">
        <h2 className="text-[20px] font-lato font-semibold ">
          Maternal Insights
        </h2>
        <h3 className="text-[15px] font-lato font-semibold text-gray-400 ">
          Alert this week
        </h3>
      </div>

      {/* content */}
      <div className="flex flex-col gap-4 mt-4 w-full h-[430px] overflow-y-auto pr-1 rounded-lg">
        {insights.map((item) => {
          const { background, border } = getColor(item.type);

          return (
            <Card
              key={item.id}
              className="!py-3"
              style={{
                backgroundColor: background,
                borderColor: border,
                borderWidth: "1px",
                borderStyle: "solid",
                
              }}
            >
              <CardHeader className="flex items-start gap-3">
                {/* Icon */}
                <div className="pt-1">{getIcon(item.type)}</div>

                {/* Text */}
                <div className="flex-1">
                  <CardTitle className="text-[16px] font-semibold">
                    {getTitle(item.type, item.name)}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {item.description}
                  </CardDescription>
                  <div className="text-xs text-gray-500 mt-1">
                    {timeAgo(item.timestamp)}
                  </div>
                </div>

                {/* Arrow icon */}
                <CardAction>
                  <ArrowOutwardIcon fontSize="small" />
                </CardAction>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  )
}