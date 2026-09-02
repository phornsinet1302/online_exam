"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/lib/api/auth";

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Supabase appends tokens as hash fragment e.g., #access_token=...
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      
      if (accessToken) {
        // Save the token so fetchApi can use it
        localStorage.setItem("token", accessToken);
        
        // Fetch the user data from backend and login to context
        authApi.google(accessToken).then(res => {
          login(accessToken, res.user);
          router.push("/dashboard");
        }).catch((err) => {
          console.error("Failed to fetch user during callback", err);
          router.push("/");
        });
      } else {
        router.push("/");
      }
    } else {
      // If there's no hash, maybe the confirmation was just a redirect
      router.push("/");
    }
  }, [router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Verifying your account...</p>
      </div>
    </div>
  );
}
