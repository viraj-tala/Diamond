import { DiamondLoader } from "@/components/DiamondLoader";

export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-iris-50">
      <DiamondLoader size={56} label="Loading" />
    </main>
  );
}
