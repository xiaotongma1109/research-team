import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/applications - 提交申请
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const body = await request.json()
  const { post_id, message } = body

  if (!post_id) {
    return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 })
  }

  // 检查是否已申请
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('post_id', post_id)
    .eq('applicant_id', session.user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: '你已经申请过了' }, { status: 400 })
  }

  // 检查帖子是否存在且开放
  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, status, title')
    .eq('id', post_id)
    .single()

  if (!post || post.status === 'closed') {
    return NextResponse.json({ error: '帖子不存在或已关闭' }, { status: 404 })
  }

  // 不能申请自己的帖子
  if (post.author_id === session.user.id) {
    return NextResponse.json({ error: '不能申请自己的帖子' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      post_id,
      applicant_id: session.user.id,
      message: message || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 发送通知给帖子作者
  await supabase.from('notifications').insert({
    user_id: post.author_id,
    type: 'application_received',
    title: '收到新的申请',
    content: `有人申请加入你的帖子「${post.title}」`,
    related_post_id: post_id,
    related_user_id: session.user.id,
  })

  return NextResponse.json(data, { status: 201 })
}

// GET /api/applications - 获取我收到的申请
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('post_id')

  let query = supabase
    .from('applications')
    .select(`*, applicant:profiles!applications_applicant_id_fkey (*), post:posts!applications_post_id_fkey (*)`)
    .order('created_at', { ascending: false })

  if (postId) {
    query = query.eq('post_id', postId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
