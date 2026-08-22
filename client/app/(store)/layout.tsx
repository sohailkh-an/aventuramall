import { Navbar } from "@/components/store/navbar/Navbar";
import { Footer } from "@/components/store/Footer";
import { ChatwootWidget } from "@/components/chat/ChatwootWidget";
import { MobileBottomNav } from "@/components/store/MobileBottomNav";

export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-slate-50 pb-28 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <ChatwootWidget />
    </div>
  );
}
