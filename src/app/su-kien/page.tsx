import { Navbar } from "@/components/Navbar";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { Timeline } from "@/components/Timeline";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Sự kiện - GA4Students",
  description: "Danh sách các sự kiện sắp diễn ra và đã diễn ra của chương trình Gemini Academy for Students."
};

export default function EventsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <UpcomingEvents />
        <div id="ongoing"></div>
        <Timeline />
      </main>
      <Footer />
    </div>
  );
}
