'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import type { PostWithAuthor, PostType } from '@/lib/types'
import { POST_TYPE_LABELS } from '@/lib/types'

const FILTER_TABS: { key: PostType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'find_team', label: '找队友' },
  { key: 'find_member', label: '招成员' },
  { key: 'find_mentor', label: '找导师' },
  { key: 'share', label: '经验分享' },
]

export default function HomePage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<PostType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [activeFilter])

  async function fetchPosts() {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey (*)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20)

    if (activeFilter !== 'all') {
      query = query.eq('type', activeFilter)
    }

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (data) {
      setPosts(data as PostWithAuthor[])
    }
    setLoading(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchPosts()
  }

  return (
    <div>
      {/* 搜索栏 */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索课题、技能、方向..."
            className="input-field pl-10 pr-4"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </form>

      {/* 筛选标签 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 帖子列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 rounded mb-2" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">暂无帖子</p>
          <p className="text-gray-400 text-sm">
            {activeFilter !== 'all' ? '试试切换其他分类' : '成为第一个发布的人吧'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
