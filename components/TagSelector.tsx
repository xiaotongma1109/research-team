'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { Tag } from '@/lib/types'

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export default function TagSelector({
  selectedTags,
  onChange,
  placeholder = '搜索或添加标签...',
  maxTags = 10,
}: TagSelectorProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(8)

      if (data) {
        setSuggestions(data.filter((t) => !selectedTags.includes(t.name)))
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, selectedTags])

  function addTag(tagName: string) {
    if (selectedTags.length >= maxTags) return
    if (!selectedTags.includes(tagName)) {
      onChange([...selectedTags, tagName])
    }
    setQuery('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  function removeTag(tagName: string) {
    onChange(selectedTags.filter((t) => t !== tagName))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      addTag(query.trim())
    }
    if (e.key === 'Backspace' && !query && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1])
    }
  }

  return (
    <div className="relative">
      {/* 已选标签 + 输入框 */}
      <div
        className="input-field flex flex-wrap gap-1.5 min-h-[42px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-md text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="text-primary-400 hover:text-primary-600"
            >
              x
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
          disabled={selectedTags.length >= maxTags}
        />
      </div>

      {/* 下拉建议 */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(tag.name)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{tag.name}</span>
              <span className="text-xs text-gray-400">{tag.category === 'skill' ? '技能' : '方向'}</span>
            </button>
          ))}
        </div>
      )}

      {/* 提示 */}
      {selectedTags.length >= maxTags && (
        <p className="text-xs text-gray-400 mt-1">最多添加 {maxTags} 个标签</p>
      )}
    </div>
  )
}
