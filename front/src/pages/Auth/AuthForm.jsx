import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { useCall } from "../../Provider/Provider";
import register from "../../hooks/auth/regsiter";
import setAuthToken from "../../config/setAuthToken";
import { Link, useNavigate } from "react-router-dom";
import login from "../../hooks/auth/login";
import QrScanner from "../../components/Dashboard/QrScaner";
import { Eye, EyeOff, User, Mail, Lock, Smartphone, QrCode } from "lucide-react";

const AuthForm = () => {
  const [signUp, setSignUp] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { setToken, setUser } = useCall();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (signUp) {
        const { data } = await register(userData);
        if (!data.success)
          throw new Error(data.message || "Registration failed");
      }

      const { data: user } = await login({
        email: userData.email,
        password: userData.password,
      });

      localStorage.setItem("token", user.token);
      localStorage.setItem("user", JSON.stringify(jwtDecode(user.token)));

      setAuthToken(user.token);
      setUser(jwtDecode(user.token));
      setToken(user.token);

      Swal.fire({
        title: "Success",
        text: "You have successfully logged in!",
        icon: "success",
      });

      const userRole = jwtDecode(user.token);

      if (userRole.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.message !== "NEXT_REDIRECT") {
        setError(err?.response?.data?.message || err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black">
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(90deg,#ff1212_1px,transparent_1px),linear-gradient(180deg,#ff1212_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-red-600/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-red-700/3 blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* QR Scan Card */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border border-red-900/30 shadow-2xl shadow-red-900/10">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 rounded-full blur-md opacity-50" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 p-1">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-red-500" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Quick Connect</h3>
            <p className="text-gray-400 text-center text-sm mb-4">
              Scan QR code to start instant call without login
            </p>
            <div className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 p-3 border border-red-900/30">
              <div className="p-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700">
                <QrScanner />
              </div>
              <span className="text-lg font-semibold text-white">Scan for Call</span>
            </div>
          </div>
        </div>

        {/* Login/Register Card */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-900/90 via-black/90 to-gray-900/90 backdrop-blur-xl border border-red-900/30 shadow-2xl shadow-red-900/10 overflow-hidden">
          {/* Card Header */}
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 rounded-full blur-lg opacity-30" />
                <img
                  src="/icon.png"
                  alt="CallBell"
                  className="relative w-24 h-24 rounded-full border-2 border-red-600/50 p-2"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Call<span className="text-red-500">Bell</span>
              </h2>
              <p className="text-gray-400 text-sm">Secure & Instant Communication</p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex rounded-lg bg-gray-900/50 p-1 mb-8 border border-gray-800">
              <button
                type="button"
                onClick={() => setSignUp(false)}
                className={`flex-1 rounded-md py-3 text-center font-semibold transition-all duration-300 ${
                  !signUp
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => setSignUp(true)}
                className={`flex-1 rounded-md py-3 text-center font-semibold transition-all duration-300 ${
                  signUp
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                SIGN UP
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {signUp && (
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Full Name"
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/50 py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                  />
                </div>
              )}

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  name="password"
                  value={userData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 py-3 pl-12 pr-12 text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {error && (
                <div className="rounded-lg bg-red-900/30 border border-red-700 p-4">
                  <p className="text-sm text-red-300 text-center font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 py-3 px-5 font-semibold uppercase text-white shadow-lg transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>

              {!signUp && (
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    <Link to="/forget-password" className="hover:text-red-500 transition-colors duration-200 hover:underline">
                      Forgot password?
                    </Link>
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800/50 p-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {signUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                  type="button"
                  onClick={() => setSignUp(!signUp)}
                  className="font-semibold text-red-500 hover:text-red-400 transition-colors duration-200"
                >
                  {signUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center space-x-2 text-gray-500 text-sm">
            <Lock className="h-4 w-4" />
            <span>Protected by end-to-end encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;