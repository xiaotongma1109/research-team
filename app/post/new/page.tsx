'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import TagSelector from '@/components/TagSelector'
import type { PostType } from '@/lib/types'
import { POST_TYPE_LABELS } from '@/lib/types'

const POST_TYPES: { key: PostType; label: string; desc: string }[] = [
  { key: 'find_team', label: '找队友', desc: '我有想法，想找人一起做' },
  { key: 'find_member', label: '招成员', desc: '我有课题/项目，需要帮手' },
  { key: 'find_mentor', label: '找导师', desc: '想加入某个方向的课题组' },
  { key: 'share', label: '经验分享', desc: '分享科研经验、方法、资源' },
]

export default function NewPostPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState<PostType>('find_team')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [maxMembers, setMaxMembers] = useState<string>('')
  const [deadline, setDeadline] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }

    const { data, error: postError } = await supabase
      .from('posts')
      .insert({
        author_id: session.user.id,
        type,
        title,
        content,
        tags,
        max_members: maxMembers ? parseInt(maxMembers) : null,
        deadline: deadline || null,
      })
      .select()
      .single()

    if (postError) {
      setError('发布失败：' + postError.message)
      setLoading(false)
      return
    }

    // 更新标签使用计数
    for (const tag of tags) {
      await supabase.rpc('increment_tag_usage', { tag_name: tag }).catch(() => {
        // 如果标签不存在，插入新标签
        supabase.from('tags').upsert({ name: tag, category: 'skill', usage_count: 1 }).catch(() => {})
      })
    }

    router.push(`/post/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">发布新帖子</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 帖子类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            帖子类型
          </label>
          <div className="grid grid-cols-2 gap-3">
            {POST_TYPES.map((pt) => (
              <button
                key={pt.key}
                type="button"
                onClick={() => setType(pt.key)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  type === pt.key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="block text-sm font-medium text-gray-900">
                  {pt.label}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {pt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="简明扼要描述你的需求"
            required
            maxLength={100}
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/100</p>
        </div>

        {/* 内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            详细描述
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'find_team'
                ? '描述你的研究方向、想做什么、需要什么技能的队友...'
                : type === 'find_member'
                ? '描述项目/课题背景、需要的技能和投入时间...'
                : type === 'find_mentor'
                ? '描述你的背景、感兴趣的方向、期望的指导方式...'
                : '分享你的科研经验、方法、心得...'
            }
            required
            rows={6}
            className="input-field resize-none"
          />
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            相关标签
          </label>
          <TagSelector
            selectedTags={tags}
            onChange={setTags}
            placeholder="输入技能/方向标签，回车添加"
          />
          <p className="text-xs text-gray-400 mt-1">
            标签能帮助对的人找到你的帖子
          </p>
        </div>

        {/* 额外信息 */}
        <div className="grid grid-cols-2 gap-4">
          {(type === 'find_team' || type === 'find_member') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                需要人数
              </label>
              <input
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                placeholder="选填"
                min={1}
                max={20}
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              截止日期
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* 提交 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim() || tags.length === 0}
            className="btn-primary flex-1 py-2.5"
          >
            {loading ? '发布中...' : '发布帖子'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary px-6"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
