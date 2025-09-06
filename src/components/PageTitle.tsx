// src/components/PageTitle.tsx
import { useEffect } from "react";

type PageTitleProps = {
  title: string;
  children: React.ReactNode;
};

export default function PageTitle({ title, children }: PageTitleProps) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return <>{children}</>;
}
