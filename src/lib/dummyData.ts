export const appointments = Array.from({ length: 27 }, (_, i) => {
  const names = [
    "Maria Dela Cruz", "Juan Santos", "Ana Reyes", "Carlos Mendoza", "Elena Garcia",
    "Miguel Ramos", "Sofia Cruz", "Daniel Bautista", "Isabella Navarro", "Andres Salazar",
    "Camille Velasquez", "Liam Rivera", "Nicole Torres", "Gabriel Aquino", "Clarisse Robles",
    "Julian Gomez", "Patricia Santiago", "Noah Fernandez", "Chloe David", "Nathan Lim",
    "Andrea Uy", "Marco Delos Reyes", "Faith Ocampo", "Dylan Pineda", "Bea Lorenzo",
    "Enzo Matias", "Grace Evangelista"
  ];

  const types = ["Consultation", "Monthly Checkup", "Follow-up Checkup"];

 const status =
  i < 5 ? "Accepted" :
  i < 10 ? "Done" :
  i < 15 ? "Pending" :
  i < 20 ? "Declined" :
  "Deleted"

  const weeksPregnant = Math.floor(Math.random() * 30) + 1;

  return {
    patient: names[i],
    weeksPregnant,
    dateTime: `Aug ${i + 1}, 2025 - ${9 + (i % 4)}:00 AM`,
    type: types[i % types.length],
    status,
  };
});
