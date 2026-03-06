import { Link } from "react-router-dom";
import { BrainCircuit, User } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              EDAI<span className="text-indigo-400">.</span>
            </span>
          </Link>
        </div>
        <div className="flex gap-6 text-sm font-medium text-neutral-400">
          <Link to="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <a href="#" className="hover:text-white transition-colors">
            Roadmap
          </a>
          <a
            href="#"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Interview
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 transition hover:bg-neutral-700"
          >
            <User className="w-4 h-4 text-neutral-400" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
