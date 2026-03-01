import "./globals.css";
import { Inter } from "next/font/google";
import { PatientProvider } from "@/context/PatientContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Arogya by VAKR — Preventive Health Intelligence",
  description:
    "AI-powered preventive health intelligence. Symptom assessment, ML risk prediction, and guided care.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <LanguageProvider>
            <PatientProvider>{children}</PatientProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
