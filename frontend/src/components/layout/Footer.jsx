import { Link } from "react-router-dom";
import { FiMail, FiMapPin, FiTwitter, FiLinkedin, FiYoutube, FiGithub } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="bg-navy text-slate-300">
      <div className="container-main px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white font-bold">
                P
              </div>
              <span className="text-lg font-bold text-white">PTE Master</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Free unofficial PTE Academic practice. Improve Speaking, Writing, Reading, and
              Listening with realistic questions and progress tracking.
            </p>
            <p className="text-xs text-slate-500">
              Practice Smart. Score Better.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/", label: "Home" },
                { to: "/practice", label: "Practice" },
                { to: "/mock-tests", label: "Mock Tests" },
                { to: "/about", label: "About" },
                { to: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Skills</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/practice/speaking", label: "Speaking" },
                { to: "/practice/writing", label: "Writing" },
                { to: "/practice/reading", label: "Reading" },
                { to: "/practice/listening", label: "Listening" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <FiMail className="mt-0.5 shrink-0" />
                <span>support@ptemaster.demo</span>
              </li>
              <li className="flex items-start gap-2">
                <FiMapPin className="mt-0.5 shrink-0" />
                <span>Online practice platform</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-5">
              {[FiTwitter, FiLinkedin, FiYoutube, FiGithub].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-brand transition-colors"
                  aria-label="Social link"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PTE Master. All rights reserved.</p>
          <p>
            Unofficial practice content for educational demonstration. Not affiliated with Pearson
            PTE Academic.
          </p>
        </div>
      </div>
    </footer>
  );
}
