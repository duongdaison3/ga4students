import { Navbar } from "@/components/Navbar";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
