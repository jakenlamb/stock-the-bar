import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
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
          Create a Registry
        </Link>
        <Link href="/login" className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-100">
          Log In
        </Link>
      </div>
    </main>
  )
}