import { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../pages/api/auth/[...nextauth]"
import { Login } from "../components/Login"
import { Register } from "../components/Register"
import { TarotReading } from "../components/TarotReading"
import { UserDashboard } from "../components/UserDashboard"
import { LoadingSpinner } from "../components/LoadingSpinner"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Welcome to Passive-Aggressive Tarot</h2>
      {session ? (
        <Suspense fallback={<LoadingSpinner size="large" />}>
          <UserContent />
        </Suspense>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Login</h3>
            <Login />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Register</h3>
            <Register />
          </div>
        </div>
      )}
    </div>
  )
}

function UserContent() {
  return (
    <div className="space-y-8">
      <TarotReading />
      <UserDashboard />
    </div>
  )
}

