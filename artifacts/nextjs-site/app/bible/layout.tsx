import BibleNavSidebar from "./BibleNavSidebar";

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 items-start">
      <BibleNavSidebar />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
