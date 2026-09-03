import type { ReactNode } from 'react'

interface UiIconProps {
  size?: number
}

function IconFrame({ children, size = 18 }: UiIconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function SearchIcon(props: UiIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </IconFrame>
  )
}

export function PlusIcon(props: UiIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconFrame>
  )
}

export function MinusIcon(props: UiIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M5 12h14" />
    </IconFrame>
  )
}

export function HomeIcon(props: UiIconProps) {
  return (
    <IconFrame {...props}>
      <path d="m3 11 9-7 9 7" />
      <path d="M5 10v10h14V10M10 20v-6h4v6" />
    </IconFrame>
  )
}

export function CategoriesIcon(props: UiIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </IconFrame>
  )
}

export function CartIcon(props: UiIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L20 8H7" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </IconFrame>
  )
}

export function UserIcon(props: UiIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </IconFrame>
  )
}
