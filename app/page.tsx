import PageShell from "@/components/PageShell";
import Hero from "@/components/Hero";
import MethodFlow from "@/components/MethodFlow";
import ModuleGrid from "@/components/ModuleGrid";

export default function HomePage() {
  return (
    <PageShell>
      <Hero />
      <MethodFlow />
      <ModuleGrid />
    </PageShell>
  );
}
