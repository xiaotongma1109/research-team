'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { PostWithAuthor, ApplicationWithDetails } from '@/lib/types'
import { POST_TYPE_LABELS, POST_TYPE_COLORS, APPLICATION_STATUS_LABELS } from '@/lib/types'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const postId = params.id as string

  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [postId])

  async function fetchData() {
    setLoading(true)

    // 获取当前用户
    const { data: { session } } = await supabase.auth.getSession()
    if (session) setCurrentUserId(session.user.id)

    // 获取帖子详情
    const { data: postData } = await supabase
      .from('posts')
      .select(`*, author:profiles!posts_author_id_fkey (*)`)
      .eq('id', postId)
      .single()

    if (postData) {
      setPost(postData as PostWithAuthor)

      // 增加浏览量
      await supabase
        .from('posts')
        .update({ view_count: (postData.view_count || 0) + 1 })
        .eq('id', postId)
    }

    // 如果是帖子作者，获取申请列表
    if (session && postData && session.user.id === postData.author_id) {
      const { data: appData } = await supabase
        .from('applications')
        .select(`*, applicant:profiles!applications_applicant_id_fkey (*)`)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (appData) setApplications(appData as ApplicationWithDetails[])
    }

    // 检查是否已申请
    if (session) {
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('post_id', postId)
        .eq('applicant_id', session.user.id)
        .single()

      setHasApplied(!!existingApp)
    }

    setLoading(false)
  }

  async function handleApply() {
    if (!currentUserId) {
      router.push('/auth')
      return
    }
    setApplying(true)

    const { error } = await supabase
      .from('applications')
      .insert({
        post_id: postId,
        applicant_id: currentUserId,
        message: applyMessage || null,
      })

    if (!error) {
      // 发送通知给帖子作者
      if (post) {
        await supabase.from('notifications').insert({
          user_id: post.author_id,
          type: 'application_received',
          title: '收到新的申请',
          content: `有人申请加入你的帖子「${post.title}」`,
          related_post_id: postId,
          related_user_id: currentUserId,
        })
      }

      setHasApplied(true)
      setShowApplyModal(false)
      setApplyMessage('')
    }

    setApplying(false)
  }

  async function handleApplicationAction(appId: string, action: 'accepted' | 'rejected') {
    const { error } = await supabase
      .from('applications')
      .update({ status: action })
      .eq('id', appId)

    if (!error) {
      // 找到对应申请
      const app = applications.find((a) => a.id === appId)
      if (app) {
        // 发通知给申请人
        await supabase.from('notifications').insert({
          user_id: app.applicant_id,
          type: action === 'accepted' ? 'application_accepted' : 'application_rejected',
          title: action === 'accepted' ? '申请已通过' : '申请未通过',
          content: `你对「${post?.title}」的申请已被${action === 'accepted' ? '接受' : '拒绝'}`,
          related_post_id: postId,
          related_user_id: currentUserId,
        })
      }

      // 刷新申请列表
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: action } : a))
      )
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">帖子不存在或已被删除</p>
        <Link href="/" className="text-primary-600 hover:underline mt-2 inline-block">
          返回首页
        </Link>
      </div>
    )
  }

  const isAuthor = currentUserId === post.author_id

  return (
    <div className="max-w-2xl mx-auto">
      {/* 帖子内容 */}
      <article className="card mb-6">
        {/* 类型标签 */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${POST_TYPE_COLORS[post.type]}`}>
            {POST_TYPE_LABELS[post.type]}
          </span>
          {post.status === 'closed' && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              已关闭
            </span>
          )}
        </div>

        {/* 标题 */}
        <h1 className="text-xl font-bold text-gray-900 mb-4">{post.title}</h1>

        {/* 作者信息 */}
        <Link
          href={`/profile/${post.author_id}`}
          className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
            {post.author?.nickname?.[0] || '?'}
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-900">
              {post.author?.nickname}
            </span>
            <span className="block text-xs text-gray-500">
              {post.author?.department || ''} {post.author?.grade || ''}
            </span>
          </div>
        </Link>

        {/* 内容 */}
        <div className="prose prose-sm max-w-none mb-4">
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>

        {/* 元信息 */}
        <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-gray-100 pt-4">
          {post.max_members && <span>需要 {post.max_members} 人</span>}
          {post.deadline && (
            <span>截止 {new Date(post.deadline).toLocaleDateString('zh-CN')}</span>
          )}
          <span>{post.view_count} 次浏览</span>
          <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
      </article>

      {/* 操作按钮 */}
      {!isAuthor && post.status === 'open' && (
        <div className="mb-6">
          {hasApplied ? (
            <div className="text-center py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              你已经提交了申请，等待对方回复
            </div>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="btn-primary w-full py-3 text-base"
            >
              申请加入
            </button>
          )}
        </div>
      )}

      {/* 作者管理区 - 申请列表 */}
      {isAuthor && applications.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            收到的申请 ({applications.length})
          </h2>
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-start justify-between p-3 rounded-lg border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <Link
                    href={`/profile/${app.applicant_id}`}
                    className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700 shrink-0"
                  >
                    {app.applicant?.nickname?.[0] || '?'}
                  </Link>
                  <div>
                    <Link
                      href={`/profile/${app.applicant_id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary-600"
                    >
                      {app.applicant?.nickname}
                    </Link>
                    {app.applicant?.skills && app.applicant.skills.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {app.applicant.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {app.message && (
                      <p className="text-sm text-gray-600 mt-1">{app.message}</p>
                    )}
                  </div>
                </div>

                {app.status === 'pending' ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApplicationAction(app.id, 'accepted')}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      接受
                    </button>
                    <button
                      onClick={() => handleApplicationAction(app.id, 'rejected')}
                      className="text-xs px-3 py-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"
                    >
                      拒绝
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded ${
                    app.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 申请弹窗 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">申请加入</h3>
            <textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="介绍一下自己，说说为什么想加入（选填）"
              rows={4}
              className="input-field resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleApply}
                disabled={applying}
                className="btn-primary flex-1"
              >
                {applying ? '提交中...' : '提交申请'}
              </button>
              <button
                onClick={() => setShowApplyModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
