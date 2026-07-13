import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Highlights } from "@/components/Highlights";
import { Timeline } from "@/components/Timeline";
import { Speaker } from "@/components/Speaker";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Highlights />
        <Timeline />
        <Speaker />
        <UpcomingEvents />
      </main>
      <Footer />
    </>
  );
}
