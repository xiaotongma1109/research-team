import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/register - 注册（含邀请码校验）
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const body = await request.json()
  const { email, password, nickname, role, invite_code } = body

  if (!email || !password || !nickname || !invite_code) {
    return NextResponse.json({ error: '请填写所有必填项' }, { status: 400 })
  }

  // 1. 验证邀请码
  const { data: codeData, error: codeError } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', invite_code.trim())
    .is('used_by', null)
    .single()

  if (codeError || !codeData) {
    return NextResponse.json({ error: '邀请码无效或已被使用' }, { status: 400 })
  }

  if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
    return NextResponse.json({ error: '邀请码已过期' }, { status: 400 })
  }

  // 2. 注册用户
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }

  // 3. 创建 profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      nickname,
      role: role || 'student',
      skills: [],
      research_interests: [],
      contact_info: {},
    })

  if (profileError) {
    return NextResponse.json({ error: '创建用户资料失败' }, { status: 500 })
  }

  // 4. 标记邀请码已使用
  await supabase
    .from('invite_codes')
    .update({
      used_by: authData.user.id,
      used_at: new Date().toISOString(),
    })
    .eq('code', invite_code.trim())

  return NextResponse.json({ user: authData.user }, { status: 201 })
}
