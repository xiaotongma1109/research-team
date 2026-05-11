'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Notification } from '@/lib/types'

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setNotifications(data)
    setLoading(false)

    // 标记所有为已读
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'application_received': return '📩'
      case 'application_accepted': return '🎉'
      case 'application_rejected': return '😢'
      default: return '📢'
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 rounded mt-2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">消息通知</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">暂无消息</p>
          <p className="text-gray-400 text-sm mt-1">当有人申请加入你的帖子时，会收到通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.related_post_id ? `/post/${notification.related_post_id}` : '#'}
              className={`card block ${!notification.is_read ? 'border-primary-200 bg-primary-50/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  {notification.content && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {notification.content}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
