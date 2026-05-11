import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/applications/[id] - 处理申请（接受/拒绝）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const body = await request.json()
  const { status } = body

  if (!['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: '无效的状态' }, { status: 400 })
  }

  // 获取申请详情
  const { data: application } = await supabase
    .from('applications')
    .select(`*, post:posts!applications_post_id_fkey (id, author_id, title)`)
    .eq('id', params.id)
    .single()

  if (!application) {
    return NextResponse.json({ error: '申请不存在' }, { status: 404 })
  }

  // 验证是帖子作者
  if (application.post.author_id !== session.user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 })
  }

  // 更新申请状态
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 通知申请人
  await supabase.from('notifications').insert({
    user_id: application.applicant_id,
    type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
    title: status === 'accepted' ? '申请已通过' : '申请未通过',
    content: `你对「${application.post.title}」的申请已被${status === 'accepted' ? '接受' : '拒绝'}`,
    related_post_id: application.post_id,
    related_user_id: session.user.id,
  })

  return NextResponse.json({ success: true })
}
