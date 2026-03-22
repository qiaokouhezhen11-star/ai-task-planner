import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "AI業務計画アシスタント",
  description: "業務依頼文をAIで整理し、保存・閲覧できる実務向けアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] text-white antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-8 md:py-10">{children}</main>
      </body>
    </html>
  );
}
