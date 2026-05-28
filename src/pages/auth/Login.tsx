import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Lock, Mail, User, AlertCircle, Activity } from 'lucide-react'

export function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [designation, setDesignation] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true })
      }
    })
  }, [navigate])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/dashboard', { replace: true })
      } else {
        if (pin !== '2025') {
          throw new Error('Invalid IT Department PIN')
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              designation: designation,
            }
          }
        })
        if (error) throw error
        // Auto sign-in if email confirmation is disabled in Supabase, else show message
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (!signInError) {
          navigate('/dashboard', { replace: true })
        } else {
          setError('Registration successful. Please sign in.')
          setIsLogin(true)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-200">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-white p-3 shadow-xl shadow-blue-900/10 border border-slate-100 ring-1 ring-slate-900/5">
            <Activity className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          IT LogManager
        </h2>
        <p className="mt-1 text-center text-sm font-medium text-slate-500">
          Developed by : <a href="https://dinithaweb.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 transition-colors hover:underline">Dinitha Serasinghe</a>
        </p>
        <p className="mt-4 text-center text-sm text-slate-600">
          {isLogin ? 'Sign in to manage your work logs' : 'Register a new IT team account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-blue-900/10 sm:rounded-2xl sm:px-10 border border-slate-200/50">
          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start shadow-sm">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-slate-700 font-medium">Full Name</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input
                      id="fullName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 border-slate-200 focus-visible:ring-blue-500 bg-white/50 focus:bg-white transition-all shadow-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="designation" className="text-slate-700 font-medium">Designation</Label>
                  <Input
                    id="designation"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="border-slate-200 focus-visible:ring-blue-500 bg-white/50 focus:bg-white transition-all shadow-sm"
                    placeholder="e.g. Systems Administrator"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pin" className="text-slate-700 font-medium">IT Department PIN</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input
                      id="pin"
                      type="password"
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="pl-10 border-slate-200 focus-visible:ring-blue-500 bg-white/50 focus:bg-white transition-all shadow-sm"
                      placeholder="Enter the 4-digit PIN"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email address</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-slate-200 focus-visible:ring-blue-500 bg-white/50 focus:bg-white transition-all shadow-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-slate-200 focus-visible:ring-blue-500 bg-white/50 focus:bg-white transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                  Please wait...
                </div>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 text-slate-500">
                  {isLogin ? 'New to the team?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                  setPin('')
                }}
              >
                {isLogin ? 'Register now' : 'Sign in instead'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
