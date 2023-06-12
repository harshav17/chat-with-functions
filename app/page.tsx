import Image from 'next/image'
import { Switch } from '@headlessui/react';

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 sticky top-0 z-50 bg-white">
        <div className="relative flex h-16 items-center justify-between border-b border-gray-200 ">
          <div className="flex items-center">
            <a className="flex-shrink-0 text-2xl font-bold" href=".">
              meet
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
