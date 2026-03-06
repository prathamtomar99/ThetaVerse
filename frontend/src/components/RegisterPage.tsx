import { Link, useNavigate } from "react-router-dom";
import { useStoreContext } from "../contextApi/ContextApi";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { setToken } = useStoreContext();
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setToken("mock-jwt-token");
    toast.success("Account created successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 w-full">
      <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl w-full max-w-md shadow-xl backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create an account</h2>
        <p className="text-neutral-400 mb-8">Start your interview preparation journey today.</p>
        
        <form onSubmit={handleRegister} className="flex flex-col gap-5">
           <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">Name</label>
            <input 
              type="text" 
              className="bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              placeholder="John Doe" 
              required 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">Email</label>
            <input 
              type="email" 
              className="bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              placeholder="you@example.com" 
              required 
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">Password</label>
            <input 
              type="password" 
              className="bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              placeholder="••••••••" 
              required 
            />
          </div>
          
          <button 
            type="submit"
            className="mt-2 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
