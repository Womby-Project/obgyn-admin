import { useState } from "react"

type Tab = {
  label: string
  value: string
  content: React.ReactNode
}

interface CustomTabsProps {
  tabs: Tab[]
  defaultValue: string
}

export default function CustomTabs({ tabs, defaultValue }: CustomTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className="w-full">
      {/* Tab Triggers */}
      <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-10 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
          
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`pb-2 px-1 sm:px-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap cursor-pointer 
              ${
                activeTab === tab.value
                  ? "border-b-2 border-[#E46B64] text-[#E46B64]"
                  : "border-b-2 border-transparent text-gray-600"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {tabs.map((tab) =>
          tab.value === activeTab ? (
            <div key={tab.value}>{tab.content}</div>
          ) : null
        )}
      </div>
    </div>
  )
}
