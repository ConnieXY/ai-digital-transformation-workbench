"use client";

import type { CompanyInfo } from "@/data/diagnosis";
import { companySizeOptions, industryOptions } from "@/data/diagnosis";

interface CompanyInfoFormProps {
  value: CompanyInfo;
  onChange: (field: keyof CompanyInfo, fieldValue: string) => void;
}

const fieldLabel = "mb-1.5 block text-sm font-medium text-ink-700";
const fieldBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

/** 企业基本信息表单：6 个受控字段。 */
export default function CompanyInfoForm({
  value,
  onChange,
}: CompanyInfoFormProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="companyName" className={fieldLabel}>
          企业名称
        </label>
        <input
          id="companyName"
          type="text"
          className={fieldBase}
          placeholder="请输入企业名称"
          value={value.companyName}
          onChange={(e) => onChange("companyName", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="industry" className={fieldLabel}>
          行业
        </label>
        <select
          id="industry"
          className={fieldBase}
          value={value.industry}
          onChange={(e) => onChange("industry", e.target.value)}
        >
          <option value="">请选择行业</option>
          {industryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="companySize" className={fieldLabel}>
          企业规模
        </label>
        <select
          id="companySize"
          className={fieldBase}
          value={value.companySize}
          onChange={(e) => onChange("companySize", e.target.value)}
        >
          <option value="">请选择企业规模</option>
          {companySizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="employeeCount" className={fieldLabel}>
          员工人数
        </label>
        <input
          id="employeeCount"
          type="number"
          min={0}
          className={fieldBase}
          placeholder="例如 320"
          value={value.employeeCount}
          onChange={(e) => onChange("employeeCount", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="currentSystems" className={fieldLabel}>
          当前使用的主要系统
        </label>
        <input
          id="currentSystems"
          type="text"
          className={fieldBase}
          placeholder="例如 ERP、CRM、MES、企业微信…"
          value={value.currentSystems}
          onChange={(e) => onChange("currentSystems", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="mainPainPoint" className={fieldLabel}>
          当前最想解决的问题
        </label>
        <textarea
          id="mainPainPoint"
          rows={3}
          className={`${fieldBase} resize-none`}
          placeholder="描述当前最困扰的业务或管理问题…"
          value={value.mainPainPoint}
          onChange={(e) => onChange("mainPainPoint", e.target.value)}
        />
      </div>
    </div>
  );
}
