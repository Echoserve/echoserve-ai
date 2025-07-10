'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/analytics', label: 'Analytics' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-6 px-6 py-3 bg-gray-50 border-b text-sm font-medium">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`$${pathname === href ? 'text-blue-600' : 'text-gray-700'} hover:text-blue-600`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
} 