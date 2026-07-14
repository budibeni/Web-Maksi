"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

const loginSchema = z.object({
  username: z.string().min(1, "Username/Telepon wajib diisi."),
  password: z.string().min(1, "Password wajib diisi.")
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const setUser = useAuthStore((state) => state.setUser);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  const onSubmit = async (data) => {
    try {
      setError("");
      const res = await login(data);
      if (res.success) {
        setUser(res.data.user);
        router.push("/");
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-neutral-800 transition-colors duration-300">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">MAKSI</h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm font-medium">Sistem Manajemen Pelanggan</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium text-center">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="username">
                  Username / Telepon
                </label>
                <input
                  {...register("username")}
                  id="username"
                  type="text"
                  placeholder="Masukkan username atau telepon"
                  className={`w-full px-4 py-3 rounded-lg border ${errors.username ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500`}
                />
                {errors.username && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1.5 font-medium">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="password">
                  Password
                </label>
                <input
                  {...register("password")}
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500`}
                />
                {errors.password && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1.5 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sedang masuk..." : "Masuk"}
                </button>
              </div>
            </form>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-950/50 p-4 text-center border-t border-neutral-100 dark:border-neutral-800 transition-colors duration-300">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              © {new Date().getFullYear()} MAKSI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
