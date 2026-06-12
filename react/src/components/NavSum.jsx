import React, { useState, useEffect, useRef } from "react";
import Menu from "./Menu";
import avatarImg from "../assets/avatar.png";
import { FiSearch } from "react-icons/fi";
import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Studio" },
  { to: "/edit", label: "Editor" },
  { to: "/summarise", label: "Summarise" },
  { to: "/rewrite", label: "Rewrite" },
  { to: "/grammar", label: "Grammar" },
  { to: "/help", label: "Help" },
];

const NavSum = () => {
  const [isLogged] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="flex items-center justify-between gap-6 px-6 lg:px-10 h-16 bg-paper/90 backdrop-blur border-b border-line relative z-50">
      {/* Brand + Links */}
      <div className="flex items-center gap-10 min-w-0">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="w-7 h-7 rounded-lg bg-rust text-paper font-display italic text-lg leading-none flex items-center justify-center pb-0.5 transition-transform group-hover:-rotate-6">
            D
          </span>
          <span className="font-display text-xl tracking-tight">
            Docu<em className="text-rust not-italic font-display italic">Reviewer</em>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full text-[13px] font-medium tracking-wide transition-colors ${
                  isActive
                    ? "bg-ink text-paper"
                    : "text-ink-soft hover:text-ink hover:bg-cream"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Search + Avatar */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative hidden lg:block w-44 lg:w-56 focus-within:w-64 transition-all duration-300">
          <input
            type="text"
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-line rounded-full focus:outline-none focus:border-rust focus:ring-2 focus:ring-rust/15 transition"
          />
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
        </div>

        <div className="relative" ref={menuRef}>
          {isLogged ? (
            <>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="block rounded-full ring-2 ring-transparent hover:ring-rust/40 transition"
              >
                <img
                  src={avatarImg}
                  alt="User avatar"
                  className="w-9 h-9 rounded-full border border-line object-cover"
                />
              </button>
              {menuOpen && <Menu onClose={() => setMenuOpen(false)} />}
            </>
          ) : (
            <div className="flex gap-2">
              <button className="text-sm px-4 py-2 rounded-full hover:bg-cream transition">
                Log In
              </button>
              <button className="bg-ink text-paper text-sm px-4 py-2 rounded-full hover:bg-rust transition">
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavSum;
