import type { Metadata } from "next";
import { Geist, Chewy, Momo_Trust_Display } from "next/font/google";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const ChewyFont = Chewy({
  variable: "--font-Chewy",
  weight: "400",
  subsets: ["latin"],
});

const MomoFont = Momo_Trust_Display({
  variable: "--font-Momo",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Schedule Our next Date",
  description: "To schedule our next date",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
     <html lang="en" className="{`${ChewyFont.variable} ${MomoFont.variable}`}">
      <body>
        <nav></nav>
        {children}
        <footer></footer>
      </body>
    </html>
  );
}
