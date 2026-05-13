'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type AuthMode = 'login' | 'register'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: authData.user.id, nickname, role, skills: [], research_interests: [], contact_info: {} })

      if (profileError) {
        setError('创建用户资料失败：' + profileError.message)
        setLoading(false)
        return
      }
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{mode === 'login' ? '欢迎回来' : '加入研小队'}</h1>
          <p className="mt-2 text-gray-500">{mode === 'login' ? '登录你的账号，继续探索科研组队' : '注册账号，开始寻找科研伙伴'}</p>
        </div>
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="card space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="你希望别人怎么称呼你" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">身份</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${role === 'student' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>学生</button>
                  <button type="button" onClick={() => setRole('teacher')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${role === 'teacher' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>教师/导师</button>
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? '至少6位' : '输入密码'} required minLength={6} className="input-field" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}</button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">
          {mode === 'login' ? (<>还没有账号？<button onClick={() => { setMode('register'); setError('') }} className="text-primary-600 font-medium hover:underline">注册</button></>) : (<>已有账号？<button onClick={() => { setMode('login'); setError('') }} className="text-primary-600 font-medium hover:underline">登录</button></>)}
        </p>
      </div>
    </div>
  )
}
