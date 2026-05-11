import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts - 获取帖子列表
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type')
  const search = searchParams.get('search')
  const tags = searchParams.get('tags')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('posts')
    .select(`*, author:profiles!posts_author_id_fkey (*)`, { count: 'exact' })
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type && type !== 'all') {
    query = query.eq('type', type)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  if (tags) {
    const tagArray = tags.split(',')
    query = query.overlaps('tags', tagArray)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    posts: data,
    total: count,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
  })
}

// POST /api/posts - 发布新帖子
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const body = await request.json()
  const { type, title, content, tags, max_members, deadline } = body

  if (!type || !title || !content || !tags || tags.length === 0) {
    return NextResponse.json({ error: '请填写必要信息' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: session.user.id,
      type,
      title,
      content,
      tags,
      max_members: max_members || null,
      deadline: deadline || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
