import { Link } from "react-router-dom";
import { LayoutDashboard, LogOut, Map } from "lucide-react";
import { useStoreContext } from "../../contextApi/ContextApi";
import toast from "react-hot-toast";

export default function DashboardLayout() {
  const { setToken } = useStoreContext();

  const handleLogout = () => {
    setToken(null);
    toast.success("Logged out successfully");
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex flex-col gap-2">
         <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">Menu</div>
         <Link to="/dashboard" className="px-3 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center gap-3 font-medium">
            <LayoutDashboard className="w-5 h-5"/>
            Overview
         </Link>
         <Link to="/roadmap/user" className="px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-xl flex items-center gap-3 font-medium transition cursor-pointer">
            <Map className="w-5 h-5"/>
            My Flows
         </Link>
         
         <button onClick={handleLogout} className="px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-xl flex items-center gap-3 font-medium transition cursor-pointer text-left mt-auto md:mt-8">
            <LogOut className="w-5 h-5"/>
            Logout
         </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8 shadow-xl">
         <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
         <p className="text-neutral-400 mb-8">Here's your interview progress overview.</p>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
               <div className="text-neutral-400 text-sm font-medium mb-1">Roadmap Flows Generated</div>
               <div className="text-4xl font-bold text-white">-</div>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
               <div className="text-neutral-400 text-sm font-medium mb-1">Mock Interviews Completed</div>
               <div className="text-4xl font-bold text-emerald-400">-</div>
            </div>
         </div>
         
         <div className="mt-8 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-neutral-900/20 py-16">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-4">
               <LayoutDashboard className="w-8 h-8"/>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ready for your next session?</h3>
            <p className="text-neutral-400 max-w-sm mb-6">Start a new mock interview session tailored to your specific goals.</p>
            <div className="flex gap-4">
               <Link to="/interview/setup" className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                  Start Interview
               </Link>
               <Link to="/roadmap/setup" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold py-3 px-6 rounded-xl transition-colors border border-emerald-500/20">
                  Generate Flow
               </Link>
            </div>
         </div>
      </main>
    </div>
  );
}
