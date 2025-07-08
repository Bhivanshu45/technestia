import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technestia | Authentication",
  description: "Authenticate to Technestia to collaborate and grow.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4">
      <div className="md:w-[85%] w-full p-6 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
