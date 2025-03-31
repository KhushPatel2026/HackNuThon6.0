"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "../../../Components/ui/button";
import { Input } from "../../../Components/ui/input";
import { Label } from "../../../Components/ui/label";
import Sidebar from "../../../Components/Sidebar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.user) {
            localStorage.setItem('token', data.user);
            // toast.success(`${isLogin ? 'Login' : 'Registration'} successful!`);
            setTimeout(() => {
                window.location.href = '/user-dashboard'; // Redirect to the dashboard after successful login
            }, 1500);
        } else {
            return setError('Please check your credentials');
        }
    } catch (error) {
        toast.error('An error occurred. Please try again.');
        console.error('Auth error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="flex">

      {/* Main Content */}
      <div className="fixed inset-0 min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] via-[#0f1a12] to-[#0a120a] overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -z-10 w-full h-full bg-[#4aff78]/5 mix-blend-overlay"></div>
        <div className="absolute top-40 right-20 w-6 h-6 text-[#4aff78] animate-pulse">
          <Shield className="w-full h-full" />
        </div>
        <div className="absolute bottom-40 left-20 w-6 h-6 text-[#4aff78] animate-pulse delay-300">
          <Shield className="w-full h-full" />
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] border border-[#4aff78]/20 shadow-[0_0_40px_rgba(74,255,120,0.2)] rounded-2xl p-8 backdrop-blur-lg w-full max-w-md relative overflow-hidden">
          <div className="absolute -z-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#4aff78]/10 to-transparent blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-[#4aff78] rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <span className="font-bold text-2xl text-white ml-2">
              SecureGuard
            </span>
          </div>

          <h1 className="text-3xl font-semibold text-white mb-6 text-center">
            Login
          </h1>
          {error && <p className="text-red-500 text-center">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-300 uppercase tracking-wide"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-[#4aff78]/20 rounded-xl bg-[#1c1c1c]/50 text-white py-6 px-4 focus:ring-2 focus:ring-[#4aff78] focus:border-transparent shadow-sm transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-300 uppercase tracking-wide"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-[#4aff78]/20 rounded-xl bg-[#1c1c1c]/50 text-white py-6 px-4 focus:ring-2 focus:ring-[#4aff78] focus:border-transparent shadow-sm transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full group relative px-8 py-6 bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-xl text-black font-medium text-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.5)] overflow-hidden"
            >
              <span className="relative z-10">
                {loading ? "Logging in..." : "Login"}
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#8aff8a] to-[#4aff78] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="http://localhost:3000/auth/google">
              <Button
                variant="outline"
                className="w-full bg-[#1c1c1c] border border-[#4aff78]/20 hover:bg-[#1c1c1c]/80 hover:border-[#4aff78]/40 transition duration-300 shadow-md text-white rounded-xl py-6 flex items-center justify-center gap-2"
              >
                <span>Login with Google</span>
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  className="text-2xl"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
              </Button>
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-400 text-center">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-[#4aff78] hover:text-[#8aff8a] font-medium transition-colors"
            >
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
