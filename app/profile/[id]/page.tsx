'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import TagSelector from '@/components/TagSelector'
import type { Profile, PostWithAuthor } from '@/lib/types'

export default function ProfilePage() {
  const params = useParams()
  const supabase = createClient()
  const profileId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [editing, setEditing] = useState(false)

  // 编辑状态
  const [editNickname, setEditNickname] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const [editSkills, setEditSkills] = useState<string[]>([])
  const [editInterests, setEditInterests] = useState<string[]>([])
  const [editContact, setEditContact] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [profileId])

  async function fetchProfile() {
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    setIsOwnProfile(session?.user?.id === profileId)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (profileData) {
      setProfile(profileData)
      setEditNickname(profileData.nickname)
      setEditBio(profileData.bio || '')
      setEditDepartment(profileData.department || '')
      setEditGrade(profileData.grade || '')
      setEditSkills(profileData.skills || [])
      setEditInterests(profileData.research_interests || [])
      setEditContact(profileData.contact_info?.wechat || '')
    }

    // 获取该用户的帖子
    const { data: postsData } = await supabase
      .from('posts')
      .select(`*, author:profiles!posts_author_id_fkey (*)`)
      .eq('author_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (postsData) setPosts(postsData as PostWithAuthor[])

    setLoading(false)
  }

  async function handleSave() {
    const { error } = await supabase
      .from('profiles')
      .update({
        nickname: editNickname,
        bio: editBio,
        department: editDepartment,
        grade: editGrade,
        skills: editSkills,
        research_interests: editInterests,
        contact_info: { wechat: editContact },
      })
      .eq('id', profileId)

    if (!error) {
      setEditing(false)
      fetchProfile()
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">用户不存在</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 个人信息卡片 */}
      <div className="card mb-6">
        {editing ? (
          /* 编辑模式 */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">一句话介绍</label>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="用一句话介绍自己"
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">院系</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {profile.role === 'student' ? '年级' : '职称'}
                </label>
                <input
                  type="text"
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">技能标签</label>
              <TagSelector selectedTags={editSkills} onChange={setEditSkills} placeholder="添加技能标签" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">研究方向</label>
              <TagSelector selectedTags={editInterests} onChange={setEditInterests} placeholder="添加研究方向" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">微信号（匹配成功后对方可见）</label>
              <input
                type="text"
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
                placeholder="你的微信号"
                className="input-field"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="btn-primary">保存</button>
              <button onClick={() => setEditing(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        ) : (
          /* 展示模式 */
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
                  {profile.nickname[0]}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{profile.nickname}</h1>
                  <p className="text-sm text-gray-500">
                    {profile.role === 'student' ? '学生' : '教师'} · {profile.department || '未填写院系'} · {profile.grade || ''}
                  </p>
                  {profile.bio && (
                    <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>
                  )}
                </div>
              </div>
              {isOwnProfile && (
                <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                  编辑资料
                </button>
              )}
            </div>

            {/* 技能标签 */}
            {profile.skills.length > 0 && (
              <div className="mb-3">
                <h3 className="text-xs font-medium text-gray-500 mb-1.5">技能</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 研究方向 */}
            {profile.research_interests.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-1.5">研究方向</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.research_interests.map((interest) => (
                    <span key={interest} className="tag bg-purple-50 text-purple-700">{interest}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 用户发布的帖子 */}
      {posts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isOwnProfile ? '我发布的帖子' : 'TA的帖子'}
          </h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
