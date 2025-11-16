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
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-min">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`
                whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0
                ${
                  activeTab === index
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-1 sm:mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{tabs[activeTab].content}</div>
    </div>
  )
}
