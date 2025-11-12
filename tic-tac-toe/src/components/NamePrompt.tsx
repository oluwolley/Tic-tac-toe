import { Fragment, useState } from 'react'

import { Dialog, Transition } from '@headlessui/react'

interface NamePromptProps {
  isOpen: boolean
  onSubmit: (name: string) => Promise<unknown> | unknown
  onClose?: () => void
  title?: string
  description?: string
  defaultValue?: string
  ctaLabel?: string
}

export function NamePrompt({
  isOpen,
  onSubmit,
  onClose,
  title = 'Enter your display name',
  description = 'We will show this name to other players in the lobby and scoreboard.',
  defaultValue = '',
  ctaLabel = 'Continue',
}: NamePromptProps) {
  const [name, setName] = useState(defaultValue)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      await onSubmit(name.trim())
      setName('')
      onClose?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Transition show={isOpen} as={Fragment} appear>
      <Dialog onClose={() => (submitting ? undefined : onClose?.())} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center px-4">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-out duration-200"
            enterFrom="opacity-0 translate-y-4 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition-all ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-4 scale-95"
          >
            <Dialog.Panel className="card w-full max-w-md space-y-6 p-6">
              <div className="space-y-2">
                <Dialog.Title className="text-xl font-semibold text-gradient">{title}</Dialog.Title>
                <Dialog.Description className="text-sm text-slate-400">{description}</Dialog.Description>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm text-slate-300">Display name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoFocus
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-slate-100 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Ada Lovelace"
                  />
                </label>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onClose?.()}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : ctaLabel}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

