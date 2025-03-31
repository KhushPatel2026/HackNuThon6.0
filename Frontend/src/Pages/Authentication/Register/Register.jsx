"use client";

import { useState } from "react";
import { Shield, User, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "../../../Components/ui/button";
import { Input } from "../../../Components/ui/input";
import { Label } from "../../../Components/ui/label";
import { Alert, AlertDescription } from "../../../Components/ui/alert";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.user) {
        localStorage.setItem('token', data.user);
        localStorage.setItem('role', data.role); // Store user role
        if (data.role === 'admin') {
          window.location.href = '/admin-dashboard'; // Redirect admin
        } else {
          window.location.href = '/user-dashboard'; // Redirect user
        }
      } else {
        setError('Please check your credentials');
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] via-[#0f1a12] to-[#0a120a] overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -z-10 w-full h-full bg-[#4aff78]/5 mix-blend-overlay"></div>
      <div className="absolute top-40 right-20 w-6 h-6 text-[#4aff78] animate-pulse">
        <Shield className="w-full h-full" />
      </div>
      <div className="absolute bottom-40 left-20 w-6 h-6 text-[#4aff78] animate-pulse delay-300">
        <Shield className="w-full h-full" />
      </div>

      {/* Register Card */}
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
          Register
        </h1>

        {error && (
          <Alert
            variant="destructive"
            className="mb-4 bg-red-900/20 border-red-800 text-red-300"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-[#4aff78]/10 border-[#4aff78]/30 text-[#4aff78]">
            <AlertDescription>
              Registration successful! Redirecting to dashboard...
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-gray-300 uppercase tracking-wide"
            >
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border border-[#4aff78]/20 rounded-xl bg-[#1c1c1c]/50 text-white py-6 pl-10 pr-4 focus:ring-2 focus:ring-[#4aff78] focus:border-transparent shadow-sm transition-all duration-200 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-300 uppercase tracking-wide"
            >
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-[#4aff78]/20 rounded-xl bg-[#1c1c1c]/50 text-white py-6 pl-10 pr-4 focus:ring-2 focus:ring-[#4aff78] focus:border-transparent shadow-sm transition-all duration-200 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-300 uppercase tracking-wide"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="border border-[#4aff78]/20 rounded-xl bg-[#1c1c1c]/50 text-white py-6 pl-10 pr-4 focus:ring-2 focus:ring-[#4aff78] focus:border-transparent shadow-sm transition-all duration-200 placeholder-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Password must be at least 8 characters
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || success}
            className="w-full group relative px-8 py-6 bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-xl text-black font-medium text-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.5)] overflow-hidden disabled:opacity-70"
          >
            <span className="relative z-10">
              {loading ? "Creating Account..." : "Register"}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-[#8aff8a] to-[#4aff78] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </Button>
        </form>

        <p className="mt-4 text-sm text-gray-400 text-center">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#4aff78] hover:text-[#8aff8a] font-medium transition-colors"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
