import "./globals.css";
import { Inter } from "next/font/google";
import { PatientProvider } from "@/context/PatientContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata = {
  title: "VAKR — Preventive Health Intelligence",
  description:
    "AI-powered preventive health intelligence. Symptom assessment, ML risk prediction, and guided care.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <PatientProvider>{children}</PatientProvider>
      </body>
    </html>
  );
}
