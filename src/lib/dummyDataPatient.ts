export interface Patient {
    name: string;
    appointmentType: string;
    status: "Active" | "Inactive";
    risk: "High" | "Medium" | "Low";
    referralDoctor: string;
    referralType: string;
    age: number;
    email: string;
    phone: string;
    emergencyContact: {
        name: string;
        relationship: "Spouse" | "Partner" | "Mother" | "Father" | "Sister" | "Brother" | "Friend" | "Husband";
        phone: string;
    };
    medicalHistory: {
        allergies: string[];
        preExistingConditions: string[];
        mentalHealthHistory: string;
        familyMedicalHistory: string[];
    };
    maternalInsight: {
        mostCommonMood: {
            mood: string;
            duration: number;
        };
        negativeMoodDays: number;
        moodHistory: { day: string; mood: string }[];
        symptoms: string[];
        mostFrequentSymptoms: { symptom: string; days: number }[];
        severeSymptoms: string[];
        activities: string[];
        activityFrequency: number;
        priorityAlerts: { type: string; description: string }[];
        keyInsights: string[];
        recommendations: string[];
        timestamp: string;
    };
}


export const dummyPatients: Patient[] = [
    {
        name: "Jane Doe",
        appointmentType: "Postpartum 4 week",
        status: "Active",
        risk: "High",
        referralDoctor: "Dr. Reyes",
        referralType: "Psychiatrist",
        age: 38,
        email: "jane.doe@email.com",
        phone: "+63 982 735 8220",
        emergencyContact: {
            name: "David Clark",
            relationship: "Mother",
            phone: "+63 998 301 2528"
        },
        medicalHistory: {
            allergies: ["Peanut", "Shellfish"],
            preExistingConditions: ["Asthma", "Hypertension"],
            mentalHealthHistory: "Diagnosed with mild anxiety disorder. Currently managed with therapy and medication.",
            familyMedicalHistory: ["Heart Disease", "Diabetes Type 2"]
        },
        maternalInsight: {
            mostCommonMood: { mood: "Anxious", duration: 4 }, // 4 days
            negativeMoodDays: 4, // out of 7
            moodHistory: [
                { day: "Mon", mood: "Happy" },
                { day: "Tue", mood: "Anxious" },
                { day: "Wed", mood: "Anxious" },
                { day: "Thu", mood: "Sad" },
                { day: "Fri", mood: "Anxious" },
                { day: "Sat", mood: "Calm" },
                { day: "Sun", mood: "Neutral" }
            ],
            symptoms: ["Fatigue", "Mild headache"],
            mostFrequentSymptoms: [
                { symptom: "Breast tenderness", days: 4 },
                { symptom: "Fatigue", days: 3 }
            ],
            severeSymptoms: ["Vaginal Bleeding"],
            activities: ["Light walking", "Pelvic floor exercises"],
            activityFrequency: 5, // 5 active days
            priorityAlerts: [
                { type: "Symptom Alert", description: "Vaginal bleeding reported 2 times this week." },
                { type: "Symptom Alert", description: "Back pain reported 4 times this week." },
                { type: "Mood Alert", description: "Multiple mentions of sadness and anxiety." }
            ],
            keyInsights: [
                "She exhibits strong indicators of postpartum mood disorder, frequently feeling ‘anxious’ and experiencing negative moods for 4 out of 7 days.",
                "The severe symptom of ‘Vaginal Bleeding’ necessitates immediate medical evaluation to rule out complications like postpartum hemorrhage or retained placental fragments.",
                "Frequent ‘Breast Tenderness’ may indicate breastfeeding challenges such as engorgement, poor latch, or mastitis risk."
            ],
            recommendations: [
                "Prioritize an immediate clinical assessment for heavy bleeding to identify the cause and initiate appropriate intervention.",
                "Conduct thorough screening for postpartum depression and anxiety using a validated tool (e.g., EPDS) given her frequent negative emotional states.",
                "Assess the cause of breast tenderness; if breastfeeding, refer to a lactation consultant to optimize latch, address engorgement, and monitor for signs of mastitis.",
                "Order a complete blood count (CBC) to re-evaluate her anemia status and guide iron supplementation if necessary."
            ],
            timestamp: "2025-08-03T11:00:00+08:00"
        }
    },

    {
        name: "Maria Santos",
        appointmentType: "Prenatal 28 weeks",
        status: "Active",
        risk: "Medium",
        referralDoctor: "Dr. Dela Cruz",
        referralType: "OB-GYN",
        age: 29,
        email: "maria.santos@email.com",
        phone: "+63 915 784 2234",
        emergencyContact: {
            name: "Carlos Santos",
            relationship: "Husband",
            phone: "+63 917 312 5678"
        },
        medicalHistory: {
            allergies: ["Penicillin"],
            preExistingConditions: ["Gestational diabetes"],
            mentalHealthHistory: "No prior mental health issues reported.",
            familyMedicalHistory: ["Diabetes Type 2"]
        },
        maternalInsight: {
            mostCommonMood: { mood: "Calm", duration: 5 },
            negativeMoodDays: 2,
            moodHistory: [
                { day: "Mon", mood: "Calm" },
                { day: "Tue", mood: "Calm" },
                { day: "Wed", mood: "Happy" },
                { day: "Thu", mood: "Tired" },
                { day: "Fri", mood: "Calm" },
                { day: "Sat", mood: "Anxious" },
                { day: "Sun", mood: "Calm" }
            ],
            symptoms: ["Mild swelling", "Increased thirst"],
            mostFrequentSymptoms: [
                { symptom: "Mild swelling", days: 3 },
                { symptom: "Increased thirst", days: 3 }
            ],
            severeSymptoms: [],
            activities: ["Prenatal yoga", "Walking"],
            activityFrequency: 4,
            priorityAlerts: [
                { type: "Symptom Alert", description: "Mild swelling observed 3 times this week." }
            ],
            keyInsights: [
                "Gestational diabetes requires consistent blood sugar monitoring.",
                "Patient shows stable mood most days, slight anxiety on weekends."
            ],
            recommendations: [
                "Maintain low-sugar diet and track blood glucose daily.",
                "Continue light physical activity to improve insulin sensitivity."
            ],
            timestamp: "2025-08-03T11:00:00+08:00"
        }
    },
    {
        name: "Angela Perez",
        appointmentType: "Postpartum 2 weeks",
        status: "Active",
        risk: "High",
        referralDoctor: "Dr. Lopez",
        referralType: "Psychiatrist",
        age: 34,
        email: "angela.perez@email.com",
        phone: "+63 926 882 1177",
        emergencyContact: {
            name: "Liza Perez",
            relationship: "Sister",
            phone: "+63 928 334 7765"
        },
        medicalHistory: {
            allergies: [],
            preExistingConditions: ["Mild anemia"],
            mentalHealthHistory: "History of postpartum blues after first pregnancy.",
            familyMedicalHistory: ["Depression"]
        },
        maternalInsight: {
            mostCommonMood: { mood: "Sad", duration: 3 },
            negativeMoodDays: 5,
            moodHistory: [
                { day: "Mon", mood: "Sad" },
                { day: "Tue", mood: "Sad" },
                { day: "Wed", mood: "Anxious" },
                { day: "Thu", mood: "Happy" },
                { day: "Fri", mood: "Sad" },
                { day: "Sat", mood: "Anxious" },
                { day: "Sun", mood: "Neutral" }
            ],
            symptoms: ["Fatigue", "Loss of appetite"],
            mostFrequentSymptoms: [
                { symptom: "Fatigue", days: 5 },
                { symptom: "Loss of appetite", days: 3 }
            ],
            severeSymptoms: [],
            activities: ["Light stretching"],
            activityFrequency: 2,
            priorityAlerts: [
                { type: "Mood Alert", description: "Persistent sadness for 3 consecutive days." }
            ],
            keyInsights: [
                "High risk of postpartum depression based on mood pattern.",
                "Low physical activity may worsen fatigue and mood instability."
            ],
            recommendations: [
                "Schedule immediate mental health evaluation.",
                "Introduce gentle daily activities to improve energy and mood."
            ],
            timestamp: "2025-08-03T11:00:00+08:00"
        }
    },
    {
        name: "Kristine Lim",
        appointmentType: "Prenatal 36 weeks",
        status: "Active",
        risk: "Medium",
        referralDoctor: "Dr. Ramos",
        referralType: "OB-GYN",
        age: 31,
        email: "kristine.lim@email.com",
        phone: "+63 921 445 9830",
        emergencyContact: {
            name: "Mark Lim",
            relationship: "Husband",
            phone: "+63 918 555 2333"
        },
        medicalHistory: {
            allergies: ["Dust"],
            preExistingConditions: [],
            mentalHealthHistory: "Occasional anxiety under stress.",
            familyMedicalHistory: []
        },
        maternalInsight: {
            mostCommonMood: { mood: "Neutral", duration: 4 },
            negativeMoodDays: 1,
            moodHistory: [
                { day: "Mon", mood: "Neutral" },
                { day: "Tue", mood: "Neutral" },
                { day: "Wed", mood: "Happy" },
                { day: "Thu", mood: "Neutral" },
                { day: "Fri", mood: "Calm" },
                { day: "Sat", mood: "Neutral" },
                { day: "Sun", mood: "Neutral" }
            ],
            symptoms: ["Mild back pain"],
            mostFrequentSymptoms: [
                { symptom: "Back pain", days: 2 }
            ],
            severeSymptoms: [],
            activities: ["Prenatal yoga", "Walking"],
            activityFrequency: 6,
            priorityAlerts: [],
            keyInsights: [
                "Stable mood trend indicates low mental health risk.",
                "Physical symptoms manageable with proper exercises."
            ],
            recommendations: [
                "Continue prenatal yoga and hydration.",
                "Prepare birth plan for upcoming delivery."
            ],
            timestamp: "2025-08-03T11:00:00+08:00"
        }
    },
    {
        name: "Sofia Delgado",
        appointmentType: "Postpartum 6 weeks",
        status: "Active",
        risk: "Low",
        referralDoctor: "Dr. Mendoza",
        referralType: "OB-GYN",
        age: 27,
        email: "sofia.delgado@email.com",
        phone: "+63 913 778 9001",
        emergencyContact: {
            name: "Ana Delgado",
            relationship: "Mother",
            phone: "+63 917 884 9982"
        },
        medicalHistory: {
            allergies: [],
            preExistingConditions: [],
            mentalHealthHistory: "No prior mental health issues.",
            familyMedicalHistory: []
        },
        maternalInsight: {
            mostCommonMood: { mood: "Happy", duration: 6 },
            negativeMoodDays: 0,
            moodHistory: [
                { day: "Mon", mood: "Happy" },
                { day: "Tue", mood: "Happy" },
                { day: "Wed", mood: "Happy" },
                { day: "Thu", mood: "Happy" },
                { day: "Fri", mood: "Happy" },
                { day: "Sat", mood: "Calm" },
                { day: "Sun", mood: "Happy" }
            ],
            symptoms: [],
            mostFrequentSymptoms: [],
            severeSymptoms: [],
            activities: ["Light jogging", "Walking"],
            activityFrequency: 6,
            priorityAlerts: [],
            keyInsights: [
                "Patient demonstrates strong emotional stability postpartum.",
                "Physical recovery progressing well."
            ],
            recommendations: [
                "Maintain healthy lifestyle and activity routine.",
                "Schedule routine postpartum checkup at 8 weeks."
            ],
            timestamp: "2025-08-03T11:00:00+08:00"
        }
    },
    {
        name: "Camille Reyes",
        appointmentType: "Prenatal 20 weeks",
        status: "Active",
        risk: "Medium",
        referralDoctor: "Dr. Bautista",
        referralType: "OB-GYN",
        age: 30,
        email: "camille.reyes@email.com",
        phone: "+63 929 563 8123",
        emergencyContact: {
            name: "Jose Reyes",
            relationship: "Husband",
            phone: "+63 920 665 3211"
        },
        medicalHistory: {
            allergies: ["Latex"],
            preExistingConditions: [],
            mentalHealthHistory: "Reports mild mood swings during hormonal changes.",
            familyMedicalHistory: []
        },
        maternalInsight: {
            mostCommonMood: { mood: "Happy", duration: 4 },
            negativeMoodDays: 2,
            moodHistory: [
                { day: "Mon", mood: "Happy" },
                { day: "Tue", mood: "Anxious" },
                { day: "Wed", mood: "Happy" },
                { day: "Thu", mood: "Calm" },
                { day: "Fri", mood: "Happy" },
                { day: "Sat", mood: "Tired" },
                { day: "Sun", mood: "Happy" }
            ],
            symptoms: ["Mild nausea"],
            mostFrequentSymptoms: [
                { symptom: "Mild nausea", days: 2 }
            ],
            severeSymptoms: [],
            activities: ["Prenatal yoga"],
            activityFrequency: 5,
            priorityAlerts: [
                { type: "Mood Alert", description: "Mood swings observed twice this week." }
            ],
            keyInsights: [
                "Mood fluctuations typical for second trimester.",
                "Physical activity level remains adequate."
            ],
            recommendations: [
                "Encourage relaxation techniques during anxious periods.",
                "Monitor nausea; advise dietary adjustments if worsens."
            ],
            timestamp: "2025-08-03T11:00:00+08:00"
        }
    },
    {
        name: "Patricia Villanueva",
        appointmentType: "Postpartum 3 weeks",
        status: "Active",
        risk: "High",
        referralDoctor: "Dr. Santos",
        referralType: "Psychiatrist",
        age: 35,
        email: "patricia.villanueva@email.com",
        phone: "+63 927 123 8976",
        emergencyContact: {
            name: "Miguel Villanueva",
            relationship: "Husband",
            phone: "+63 918 334 8876"
        },
        medicalHistory: {
            allergies: [],
            preExistingConditions: ["Iron deficiency anemia"],
            mentalHealthHistory: "Previous episode of anxiety during first pregnancy.",
            familyMedicalHistory: []
        },
        maternalInsight: {
            mostCommonMood: { mood: "Anxious", duration: 5 },
            negativeMoodDays: 5,
            moodHistory: [
                { day: "Mon", mood: "Anxious" },
                { day: "Tue", mood: "Anxious" },
                { day: "Wed", mood: "Anxious" },
                { day: "Thu", mood: "Tired" },
                { day: "Fri", mood: "Sad" },
                { day: "Sat", mood: "Anxious" },
                { day: "Sun", mood: "Neutral" }
            ],
            symptoms: ["Fatigue", "Mild headache"],
            mostFrequentSymptoms: [
                { symptom: "Fatigue", days: 4 },
                { symptom: "Headache", days: 3 }
            ],
            severeSymptoms: [],
            activities: ["Short walks"],
            activityFrequency: 2,
            priorityAlerts: [
                { type: "Mood Alert", description: "Persistent anxiety observed 5 times this week." }
            ],
            keyInsights: [
                "High anxiety levels may indicate risk of postpartum depression.",
                "Low physical activity and anemia can worsen fatigue."
            ],
            recommendations: [
                "Urgent referral to mental health specialist.",
                "Iron supplementation and hydration to address anemia and fatigue."
            ],
            timestamp: "2025-08-03T11:00:00+08:00"
        }
    }







];
