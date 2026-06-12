import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiEdit3,
  FiFileText,
  FiRefreshCw,
  FiCheckCircle,
  FiStar,
  FiSettings,
  FiHelpCircle,
  FiPlus,
} from "react-icons/fi";

const SectionLabel = ({ children }) => (
  <p className="px-3 pt-5 pb-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-faint">
    {children}
  </p>
);

const Item = ({ to, icon: Icon, children }) => (
  <NavLink
    to={to}
    end={to === "/"}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-rust-wash text-rust-deep font-semibold"
          : "text-ink-soft hover:bg-cream hover:text-ink"
      }`
    }
  >
    <Icon className="text-base shrink-0" />
    {children}
  </NavLink>
);

const LeftBar = () => {
  const navigate = useNavigate();

  return (
    <aside className="bg-cream/60 border-r border-line w-60 shrink-0 hidden md:flex flex-col justify-between px-3 py-4 overflow-y-auto">
      <div>
        <SectionLabel>Workspace</SectionLabel>
        <nav className="flex flex-col gap-0.5">
          <Item to="/edit" icon={FiEdit3}>Editor</Item>
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-soft hover:bg-cream hover:text-ink transition-colors text-left">
            <FiStar className="text-base shrink-0" />
            Starred
          </button>
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-soft hover:bg-cream hover:text-ink transition-colors text-left">
            <FiSettings className="text-base shrink-0" />
            Settings
          </button>
        </nav>

        <SectionLabel>AI tools</SectionLabel>
        <nav className="flex flex-col gap-0.5">
          <Item to="/summarise" icon={FiFileText}>Summarise</Item>
          <Item to="/rewrite" icon={FiRefreshCw}>Rewrite</Item>
          <Item to="/grammar" icon={FiCheckCircle}>Grammar check</Item>
        </nav>
      </div>

      <div className="flex flex-col gap-2 pb-2">
        <NavLink
          to="/help"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-soft hover:bg-cream hover:text-ink transition-colors"
        >
          <FiHelpCircle className="text-base shrink-0" />
          Get help
        </NavLink>

        <button
          onClick={() => navigate("/edit")}
          className="bg-ink text-paper flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all hover:bg-rust hover:shadow-lift active:scale-[0.98]"
        >
          <FiPlus className="text-lg" />
          New document
        </button>
      </div>
    </aside>
  );
};

export default LeftBar;
