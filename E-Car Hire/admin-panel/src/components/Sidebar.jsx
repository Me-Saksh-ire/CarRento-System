// admin/src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom'

// ── Icons (inline SVG to avoid asset dependency) ─────────────────────────────
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

const CarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2H5z"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <polyline points="5 9 2 9 2 4"/>
  </svg>
)

const OwnerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const RenterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <path d="M9 11l2 2 4-4"/>
  </svg>
)

const navItems = [
  { label: 'Dashboard',        path: '/admin-dashboard', Icon: DashboardIcon },
  { label: 'Car Verifications',path: '/verify-cars',     Icon: CarIcon       },
  { label: 'Owner Verifications',path: '/verify-owners', Icon: OwnerIcon     },
  { label: 'Renter Verifications',path: '/verify-renters',Icon: RenterIcon   },
]

const Sidebar = () => {
  return (
    <aside className="w-56 min-h-[calc(100vh-57px)] bg-white border-r border-gray-200 sticky top-14.25 shrink-0">
      <nav className="py-4">
        {navItems.map(({ label, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-r-4 ${
                isActive
                  ? 'bg-[#EEF0FF] text-[#5f6FFF] border-[#5f6FFF]'
                  : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-[#5f6FFF]'
              }`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar