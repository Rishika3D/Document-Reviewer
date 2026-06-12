import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const Menu = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    onClose();
    navigate("/");
  };

  return (
    <div className="absolute top-12 right-0 w-56 bg-card rounded-xl border border-line shadow-pop overflow-hidden z-50">
      <div className="px-4 pt-3 pb-2 border-b border-line">
        <p className="text-sm font-semibold truncate">{user?.name}</p>
        <p className="text-xs text-ink-faint font-mono truncate">{user?.email}</p>
      </div>
      <ul className="py-1.5 text-sm text-ink-soft">
        <li>
          <button
            className="w-full px-4 py-2 text-left hover:bg-cream hover:text-rust transition"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Menu;
