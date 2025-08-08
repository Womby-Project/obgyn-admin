interface IconProps {
  className?: string;
}

export function MoodIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="35"
      height="35"
      viewBox="0 0 35 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="17.5" cy="17.5" r="17.5" fill="#FFDFB6" />
      <path
        d="M16.985 27.708c-5.922 0-10.723-4.8-10.723-10.723 0-5.922 4.8-10.723 10.723-10.723s10.723 4.8 10.723 10.723-4.8 10.723-10.723 10.723m-5.361-5.361h2.144a3.217 3.217 0 0 1 6.434 0h2.145a5.362 5.362 0 0 0-10.723 0m1.072-6.434a1.608 1.608 0 1 0 0-3.217 1.608 1.608 0 0 0 0 3.217m8.579 0a1.608 1.608 0 1 0 0-3.216 1.608 1.608 0 0 0 0 3.216"
        fill="#F59E0B"
      />
    </svg>
  );
}

export function SymptomsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="35"
      height="35"
      viewBox="0 0 35 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="17.493" cy="17.493" r="17.493" fill="#FFD3D3" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.253 8.39a2.216 2.216 0 0 1 2.216 2.215v7.756a2.216 2.216 0 0 1-4.432 0v-7.756a2.216 2.216 0 0 1 2.216-2.215"
        fill="#E46B64"
      />
      <path
        d="M19.469 23.9a2.216 2.216 0 1 1-4.432 0 2.216 2.216 0 0 1 4.432 0"
        fill="#E46B64"
      />
    </svg>
  );
}
