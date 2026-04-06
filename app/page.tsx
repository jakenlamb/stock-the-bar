import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-6 px-4 text-center">
      <Image
        src="/Pour the Occasion White BG.svg"
        alt="Pour the Occasion"
        width={240}
        height={80}
      />
      <p className="text-gray-500 text-lg max-w-md">
        Create an alcohol registry for your wedding or party. Guests can claim bottles - no duplicates, no guessing.
      </p>
      <div className="flex gap-4">
        <Link href="/signup" className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">
          Create an account
        </Link>
        <Link href="/login" className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-100">
          Log In
        </Link>
      </div>
    </main>
  )
}