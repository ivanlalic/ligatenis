'use client'

import { useState } from 'react'

export default function CategoryTabs({
  tabs,
  initialTab = 0,
}: {
  tabs: Array<{
    label: string
    icon: string
    content: React.ReactNode
  }>
  initialTab?: number
}) {
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <div>
      {/* Tabs Header */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex justify-around sm:justify-start sm:space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`
                py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex-1 sm:flex-initial
                ${
                  activeTab === index
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              title={tab.label}
            >
              <span className="block sm:inline text-lg sm:text-base">{tab.icon}</span>
              <span className="hidden sm:inline sm:ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{tabs[activeTab].content}</div>
    </div>
  )
}
