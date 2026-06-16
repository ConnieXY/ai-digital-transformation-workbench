import ModuleCard from "./ModuleCard";
import { modules } from "@/data/modules";

/** 模块卡片网格：渲染三大模块入口。 */
export default function ModuleGrid() {
  return (
    <section id="modules" className="container-page py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          三个模块，覆盖转型全链路
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-700">
          从诊断到方案，再到场景落地，逐步推进，每一步都有清晰的产出。
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </section>
  );
}
