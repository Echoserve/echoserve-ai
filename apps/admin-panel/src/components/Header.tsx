'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div className="font-bold text-lg">EchoServe Admin</div>
      <div className="flex items-center gap-4">
        {userEmail && <span className="text-sm text-gray-600">Signed in as {userEmail}</span>}
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  )
} 