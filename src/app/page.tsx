import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Highlights } from "@/components/Highlights";
import { Speaker } from "@/components/Speaker";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { Timeline } from "@/components/Timeline";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Highlights />
        <Speaker />
        <UpcomingEvents />
        <Timeline />
      </main>
      <Footer />
    </>
  );
}
