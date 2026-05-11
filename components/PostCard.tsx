'use client'

import Link from 'next/link'
import type { PostWithAuthor } from '@/lib/types'
import { POST_TYPE_LABELS, POST_TYPE_COLORS } from '@/lib/types'

interface PostCardProps {
  post: PostWithAuthor
}

export default function PostCard({ post }: PostCardProps) {
  const timeAgo = getTimeAgo(post.created_at)

  return (
    <Link href={`/post/${post.id}`} className="card block">
      {/* 头部：作者信息 + 类型标签 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
            {post.author?.nickname?.[0] || '?'}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">
              {post.author?.nickname || '匿名用户'}
            </span>
            <span className="text-xs text-gray-400 ml-2">
              {post.author?.department || ''}
            </span>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${POST_TYPE_COLORS[post.type]}`}>
          {POST_TYPE_LABELS[post.type]}
        </span>
      </div>

      {/* 标题 */}
      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
        {post.title}
      </h3>

      {/* 内容预览 */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {post.content}
      </p>

      {/* 标签 */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {post.tags.length > 5 && (
            <span className="tag text-gray-400">+{post.tags.length - 5}</span>
          )}
        </div>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>{timeAgo}</span>
          {post.max_members && (
            <span>需要 {post.max_members} 人</span>
          )}
          {post.deadline && (
            <span>截止 {new Date(post.deadline).toLocaleDateString('zh-CN')}</span>
          )}
        </div>
        <span>{post.view_count} 次浏览</span>
      </div>
    </Link>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
  return date.toLocaleDateString('zh-CN')
}
