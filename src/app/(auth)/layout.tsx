import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | The Judge Tool",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
