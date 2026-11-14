import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Congo AI Studio", description: "A unified workspace for AI-powered audiovisual production." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
