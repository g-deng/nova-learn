import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { loginWithEmail, loginWithGoogle, registerWithEmail } from "@/lib/auth"
import { useNavigate } from "react-router-dom"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleEmailLogin = async () => {
    try {
      const userCred = await loginWithEmail(email, password)
      const user = userCred.user
      const token = await user.getIdToken()
      localStorage.setItem("authToken", token)
      console.log("Login success:", user)
      navigate("/stacks")
    } catch (err) {
      console.error(err)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const userCred = await loginWithGoogle()
      const user = userCred.user
      const token = await user.getIdToken()
      localStorage.setItem("authToken", token)
      console.log("Login success:", user)
      navigate("/stacks")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  onClick={handleEmailLogin}
                  className="w-full"
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full"
                >
                  Login with Google
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const navigate = useNavigate()

  const handleEmailSignup = async () => {
    try {
      const userCred = await registerWithEmail(email, password)
      console.log("Email registration success:", userCred.user)
      console.log(`${confirmPassword} ${name}`) // TODO: remove this line
      // TODO: handle user profile creation
      const user = userCred.user
      const token = await user.getIdToken()
      localStorage.setItem("authToken", token)
      navigate("/stacks")
    } catch (err) {
      console.error(err)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const userCred = await loginWithGoogle()
      console.log("Google signup success:", userCred.user)
      // TODO: handle user profile creation
      const user = userCred.user
      const token = await user.getIdToken()
      localStorage.setItem("authToken", token)
      navigate("/stacks")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>
            Welcome to Nova Learn! Please create an account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                </div>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {/* TODO: add warning message when not matching */}
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  onClick={handleEmailSignup}
                  className="w-full"
                >
                  Sign Up
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoogleSignup}
                  className="w-full"
                >
                  Sign up with Google
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Nova Learn!</h1>
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="login">Log In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="signup">
          <SignupForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
