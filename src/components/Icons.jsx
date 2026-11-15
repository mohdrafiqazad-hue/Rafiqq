// Neeche tab bar ke chhote icons
const P = {
  entry: <><path d="M12 5v14M5 12h14" /></>,
  roz: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  mahina: <><path d="M5 20V10M12 20V4M19 20v-7" /></>,
  report: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>,
  labour: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c.6-3.4 2.8-5.5 5.5-5.5s4.9 2.1 5.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.6c2.4.1 4 1.9 4.5 5.4" /></>,
};

export function TabIcon({ name }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
