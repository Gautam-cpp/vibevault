  "use client"
  import { useEffect, useState } from 'react'
  import { signIn } from 'next-auth/react'
  import { useRouter } from 'next/navigation'
  import { motion } from 'framer-motion'
  import { FiCheckCircle, FiAlertCircle, FiLock, FiMail, FiUser } from 'react-icons/fi'
  import { Button } from "@/components/ui/button"
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

  export default function AuthTabs() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("signup")
    const [formState, setFormState] = useState({
      email: '',
      password: '',
      username: '',
      confirmPassword: ''
    })
    const [passwordStrength, setPasswordStrength] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [cursor, setCursor] = useState({ x: 0, y: 0 })

    useEffect(() => {
      const moveCursor = (e: MouseEvent) => {
        setCursor({ x: e.clientX, y: e.clientY })
      }
      window.addEventListener("mousemove", moveCursor)
      return () => window.removeEventListener("mousemove", moveCursor)
    }, [])

    const calculatePasswordStrength = (password: string) => {
      let strength = 0
      if (password.length >= 8) strength += 1
      if (password.match(/[A-Z]/)) strength += 1
      if (password.match(/[0-9]/)) strength += 1
      if (password.match(/[^A-Za-z0-9]/)) strength += 1
      return strength
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState({
        ...formState,
        [e.target.id]: e.target.value
      })
      
      if (e.target.id === 'password') {
        setPasswordStrength(calculatePasswordStrength(e.target.value))
      }
    }

    const handleSignUp = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')

      if (formState.password !== formState.confirmPassword) {
        setError("Passwords don't match")
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formState.email,
            name: formState.username,
            password: formState.password,
            provider: "Credentials"
          })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Signup failed')

        const result = await signIn('credentials', {
          email: formState.email,
          password: formState.password,
          redirect: false
        })

        if (result?.error) throw new Error(result.error)
        router.push('/home')
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    const handleSignIn = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')

      try {
        const result = await signIn('credentials', {
          email: formState.email,
          password: formState.password,
          redirect: false
        })

        if (result?.error) throw new Error(result.error)
        router.push('/home')
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    const handleGoogleSignIn = async () => {
      setLoading(true)
      try {
        await signIn('Google', { 
          callbackUrl: '/home',
        
        })
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Authentication failed')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 overflow-hidden relative">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-[200vw] h-[200vh] opacity-5 animate-rotate"
            style={{
              background: `
                linear-gradient(45deg, 
                  rgba(99,102,241,0.1) 20%, 
                  rgba(168,85,247,0.1) 40%, 
                  rgba(236,72,153,0.1) 60%, 
                  rgba(239,68,68,0.1) 80%)
              `,
              transform: `translate(${-cursor.x / 50}px, ${-cursor.y / 50}px)`,
            }}
          />

          <div
            className="absolute inset-0 backdrop-blur-[100px] opacity-30"
            style={{
              mask: `radial-gradient(
                circle at ${cursor.x}px ${cursor.y}px, 
                black 0%, 
                transparent 70%
              )`,
            }}
          />
        </div>

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Tabs
            value={activeTab}
            className="relative group w-[480px]"
            onValueChange={setActiveTab}
          >
            {/* Tabs List */}
            <TabsList className="grid w-full grid-cols-2 bg-transparent backdrop-blur-xl border border-white/10 rounded-xl pb-12 mb-8 shadow-2xl shadow-purple-500/10 relative overflow-visible">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl" />
              <div
                className="absolute bottom-0 left-0 w-1/2 h-[2px] bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                style={{
                  transform: `translateX(${activeTab === "signup" ? "0%" : "100%"})`,
                }}
              />

              <TabsTrigger
                value="signup"
                className="relative z-10 h-12 text-white/80 hover:text-white transition-all duration-300
                          data-[state=active]:text-white data-[state=active]:font-semibold
                          flex items-center justify-center gap-2"
              >
                <FiUser className="w-5 h-5" />
                Sign Up
              </TabsTrigger>

              <TabsTrigger
                value="signin"
                className="relative z-10 h-12 text-white/80 hover:text-white transition-all duration-300
                          data-[state=active]:text-white data-[state=active]:font-semibold
                          flex items-center justify-center gap-2"
              >
                <FiLock className="w-5 h-5" />
                Sign In
              </TabsTrigger>
            </TabsList>

            {/* Content Container */}
            <motion.div
              className="relative"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-[100px] opacity-30 rounded-2xl" />

              {/* Sign Up Card */}
              <TabsContent value="signup">
                <Card className="bg-black/50 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/10 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none" />
                  <form onSubmit={handleSignUp}>
                    <CardHeader className="px-8 pt-8 pb-6">
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                        Create Account
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 space-y-6">
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 w-1 h-4 rounded-full" />
                          Username
                        </Label>
                        <Input
                          id="username"
                          value={formState.username}
                          onChange={handleInputChange}
                          className="bg-white/5 border-white/10 text-white placeholder-white/30
                                    focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
                                    transition-all duration-300 hover:bg-white/7"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 w-1 h-4 rounded-full" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formState.email}
                          onChange={handleInputChange}
                          className="bg-white/5 border-white/10 text-white placeholder-white/30
                                    focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
                                    transition-all duration-300 hover:bg-white/7"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 w-1 h-4 rounded-full" />
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formState.password}
                          onChange={handleInputChange}
                          className="bg-white/5 border-white/10 text-white placeholder-white/30
                                    focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
                                    transition-all duration-300 hover:bg-white/7"
                        />
                        <div className="flex gap-1 h-1">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all duration-300 ${
                                i < passwordStrength ? 'bg-purple-500' : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 w-1 h-4 rounded-full" />
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formState.confirmPassword}
                          onChange={handleInputChange}
                          className="bg-white/5 border-white/10 text-white placeholder-white/30
                                    focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
                                    transition-all duration-300 hover:bg-white/7"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="px-8 pb-8">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 
                                  text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/20
                                  transform transition-all duration-300 hover:scale-[1.02] active:scale-95
                                  disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white rounded-full animate-spin" />
                            Creating Account...
                          </div>
                        ) : (
                          <>
                            Sign Up
                            <span className="ml-2 opacity-80">✧</span>
                          </>
                        )}
                      </Button>
                      {error && (
                        <div className="text-red-400 text-sm text-center mt-4">
                          <FiAlertCircle className="inline mr-2" />
                          {error}
                        </div>
                      )}
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              {/* Sign In Card */}
              <TabsContent value="signin">
                <Card className="bg-black/50 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/10 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none" />
                  <form onSubmit={handleSignIn}>
                    <CardHeader className="px-8 pt-8 pb-6">
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                        Welcome Back
                      </CardTitle>
                      <CardDescription className="text-white/60 mt-2">
                        Continue your journey with us
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 space-y-6">
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 w-1 h-4 rounded-full" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formState.email}
                          onChange={handleInputChange}
                          className="bg-white/5 border-white/10 text-white placeholder-white/30
                                    focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
                                    transition-all duration-300 hover:bg-white/7"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 w-1 h-4 rounded-full" />
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formState.password}
                          onChange={handleInputChange}
                          className="bg-white/5 border-white/10 text-white placeholder-white/30
                                    focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
                                    transition-all duration-300 hover:bg-white/7"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="px-8 pb-8 flex flex-col gap-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 
                                  text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/20
                                  transform transition-all duration-300 hover:scale-[1.02] active:scale-95
                                  disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white rounded-full animate-spin" />
                            Signing In...
                          </div>
                        ) : (
                          <>
                            Sign In
                            <span className="ml-2 opacity-80">⌘</span>
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        onClick={handleGoogleSignIn}
                        type="button"
                        className="w-full h-12 bg-white/10 hover:bg-white/20 text-white
                                  border border-white/20 rounded-xl transition-all"
                      >
                        Continue with Google
                      </Button>

                      {error && (
                        <div className="text-red-400 text-sm text-center">
                          <FiAlertCircle className="inline mr-2" />
                          {error}
                        </div>
                      )}

                      <div className="text-center text-white/60 text-sm">
                        Forgot password?{" "}
                        <button className="text-purple-400 hover:text-purple-300 transition-colors">
                          Reset here
                        </button>
                      </div>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </motion.div>
          </Tabs>
        </motion.div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-purple-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }