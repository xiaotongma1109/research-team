'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<Profile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (data) setUser(data)

        // 获取未读通知数
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('is_read', false)
        setUnreadCount(count || 0)
      }
    }
    getUser()
  }, [])

  const navItems = [
    { href: '/', label: '首页', icon: '🏠' },
    { href: '/post/new', label: '发布', icon: '✏️' },
    { href: '/notifications', label: '消息', icon: '🔔', badge: unreadCount },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-600">研队</span>
          <span className="text-xs text-gray-400 hidden sm:inline">科研组队平台</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* User avatar / login */}
          {user ? (
            <Link
              href={`/profile/${user.id}`}
              className="ml-2 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700 hover:bg-primary-200 transition-colors"
            >
              {user.nickname?.[0] || '?'}
            </Link>
          ) : (
            <Link href="/auth" className="ml-2 btn-primary text-sm py-1.5 px-3">
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
