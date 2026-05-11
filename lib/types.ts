// ============================================
// 数据库类型定义
// ============================================

export type UserRole = 'student' | 'teacher'

export type PostType = 'find_team' | 'find_member' | 'find_mentor' | 'share'

export type PostStatus = 'open' | 'closed'

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

export type NotificationType =
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'system'

export type TagCategory = 'skill' | 'direction' | 'course'

// ============================================
// 数据库行类型
// ============================================

export interface Profile {
  id: string
  nickname: string
  avatar_url: string | null
  role: UserRole
  department: string | null
  grade: string | null
  bio: string | null
  skills: string[]
  research_interests: string[]
  contact_info: Record<string, string>
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  type: PostType
  title: string
  content: string
  tags: string[]
  status: PostStatus
  max_members: number | null
  deadline: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export interface PostWithAuthor extends Post {
  author: Profile
}

export interface Application {
  id: string
  post_id: string
  applicant_id: string
  message: string | null
  status: ApplicationStatus
  created_at: string
  updated_at: string
}

export interface ApplicationWithDetails extends Application {
  applicant: Profile
  post: Post
}

export interface Tag {
  id: number
  name: string
  category: TagCategory
  usage_count: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string | null
  related_post_id: string | null
  related_user_id: string | null
  is_read: boolean
  created_at: string
}

export interface InviteCode {
  code: string
  created_by: string | null
  used_by: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
}

// ============================================
// 前端用辅助类型
// ============================================

export const POST_TYPE_LABELS: Record<PostType, string> = {
  find_team: '找队友',
  find_member: '招成员',
  find_mentor: '找导师',
  share: '经验分享',
}

export const POST_TYPE_COLORS: Record<PostType, string> = {
  find_team: 'bg-blue-100 text-blue-700',
  find_member: 'bg-green-100 text-green-700',
  find_mentor: 'bg-purple-100 text-purple-700',
  share: 'bg-orange-100 text-orange-700',
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: '待处理',
  accepted: '已接受',
  rejected: '已拒绝',
}
