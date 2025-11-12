import { useState } from 'react'

interface ShareButtonsProps {
  inviteUrl: string
  shareMessage?: string
}

const IconButtonShare = ({ title }: { title: string }) => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{title}</title>
    <path
      fill="currentColor"
      d="M16 12a4 4 0 10-3.446-6H11a1 1 0 000 2h1a1 1 0 00.832-.445A2 2 0 1115 10h-2a1 1 0 100 2h3zM8 12a4 4 0 103.446 6H13a1 1 0 000-2h-1a1 1 0 00-.832.445A2 2 0 119 14h2a1 1 0 100-2H8z"
    />
    <path fill="currentColor" d="M9 11h6v2H9z" />
  </svg>
)

const IconLink = ({ title }: { title: string }) => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{title}</title>
    <path
      fill="currentColor"
      d="M8.464 16.95a3 3 0 010-4.243l1.414-1.414a1 1 0 011.414 1.414l-1.414 1.414a1 1 0 101.414 1.414l1.414-1.414a3 3 0 00-4.243-4.243l-1.414 1.414a5 5 0 107.071 7.071l1.414-1.414a1 1 0 00-1.414-1.414l-1.414 1.414a3 3 0 01-4.243 0z"
    />
    <path
      fill="currentColor"
      d="M15.536 7.05a3 3 0 010 4.243l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 10-1.414-1.414L11.294 8.88a3 3 0 004.242 4.242l1.415-1.414a5 5 0 10-7.071-7.071L8.464 5.05A1 1 0 109.878 6.464l1.414-1.414a3 3 0 014.243 0z"
    />
  </svg>
)

export function ShareButtons({ inviteUrl, shareMessage = 'Play Tic-Tac-Toe with me!' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${inviteUrl}`)}`

  const handleCopy = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not available')
      }
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Unable to copy link', error)
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      await handleCopy()
      return
    }

    try {
      await navigator.share({ title: 'Tic-Tac-Toe', text: shareMessage, url: inviteUrl })
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') return
      await handleCopy()
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className="btn-primary" onClick={handleNativeShare}>
        <IconButtonShare title="Share" />
        Share
      </button>
      <button type="button" className="btn-secondary" onClick={handleCopy}>
        <IconLink title="Copy link" />
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <a href={whatsappUrl} target="_blank" rel="noreferrer noopener" className="btn-secondary">
        <span className="text-green-400">WhatsApp</span>
      </a>
    </div>
  )
}

