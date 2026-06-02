export default function Icon({ name, size = 22, stroke = 1.6, color = 'currentColor', style }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    today:    <><circle cx="12" cy="13" r="5" {...p} /><path d="M12 2v2M4.5 5.5l1.3 1.3M19.5 5.5l-1.3 1.3" {...p} /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" {...p} /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" {...p} /></>,
    finance:  <><rect x="3" y="6" width="18" height="13" rx="2.5" {...p} /><path d="M3 10h18M16.5 14.5h1.5" {...p} /></>,
    film:     <><rect x="3.5" y="5" width="17" height="14" rx="2.5" {...p} /><path d="M9.5 9.2v5.6l4.8-2.8z" {...p} /></>,
    more:     <><circle cx="6" cy="12" r="1.4" {...p} /><circle cx="12" cy="12" r="1.4" {...p} /><circle cx="18" cy="12" r="1.4" {...p} /></>,
    plus:     <path d="M12 5v14M5 12h14" {...p} />,
    chevron:  <path d="M9 6l6 6-6 6" {...p} />,
    chevronD: <path d="M6 9l6 6 6-6" {...p} />,
    back:     <path d="M15 6l-6 6 6 6" {...p} />,
    check:    <path d="M5 12.5l4.2 4.2L19 7" {...p} />,
    close:    <path d="M6 6l12 12M18 6L6 18" {...p} />,
    search:   <><circle cx="11" cy="11" r="6.5" {...p} /><path d="M16 16l4 4" {...p} /></>,
    bell:     <><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5 1.5 5h-14s1.5-1 1.5-5z" {...p} /><path d="M10 19a2 2 0 0 0 4 0" {...p} /></>,
    settings: <><circle cx="12" cy="12" r="3" {...p} /><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2 2M7.6 16.4l-2 2M18.4 18.4l-2-2M7.6 7.6l-2-2" {...p} /></>,
    send:     <path d="M4 12l16-7-7 16-2.5-6.5L4 12z" {...p} />,
    cart:     <><circle cx="9" cy="20" r="1.3" {...p} /><circle cx="17" cy="20" r="1.3" {...p} /><path d="M3 4h2l2.2 11h11l1.8-8H6" {...p} /></>,
    car:      <><path d="M4 16v-3.5L6 8h12l2 4.5V16M4 16h16M4 16v2M20 16v2" {...p} /><circle cx="8" cy="16" r="1.4" {...p} /><circle cx="16" cy="16" r="1.4" {...p} /></>,
    cup:      <><path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" {...p} /><path d="M16 9h2.5a1.5 1.5 0 0 1 0 5H16M8 3.5v1.5M11 3.5v1.5" {...p} /></>,
    cross:    <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" {...p} />,
    toy:      <><circle cx="12" cy="9" r="4.5" {...p} /><path d="M12 13.5V20M8 20h8M9.5 8a2.5 2.5 0 0 1 5 0" {...p} /></>,
    home:     <path d="M4 11l8-6 8 6M6 9.5V20h12V9.5" {...p} />,
    wifi:     <><path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9 9 0 0 1 13 0M8.5 16a4.5 4.5 0 0 1 7 0" {...p} /><circle cx="12" cy="19" r=".6" fill={color} stroke="none" /></>,
    tv:       <><rect x="3" y="6" width="18" height="12" rx="2" {...p} /><path d="M8 21h8" {...p} /></>,
    phone:    <path d="M6 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2C11 21.5 4.5 15 4.5 7.5a2 2 0 0 1 1.5-2z" {...p} />,
    doc:      <><path d="M7 3.5h6l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" {...p} /><path d="M13 3.5V8h4" {...p} /></>,
    bolt:     <path d="M13 3l-7 10h5l-1 8 7-10h-5z" {...p} />,
    key:      <><circle cx="8" cy="14" r="3.5" {...p} /><path d="M10.5 11.5L20 2M16 6l2 2M18.5 3.5l2 2" {...p} /></>,
    pin:      <><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" {...p} /><circle cx="12" cy="10" r="2.5" {...p} /></>,
    plane:    <path d="M10.5 13.5L4 15l-1-2 5.5-3.2L8 4l2-1 3.2 6.5L19 6l1.5 1.5-4.5 4.8L17 21l-2 .5-3-6.2z" {...p} />,
    star:     <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.6 1-5.8-4.2-4.1 5.9-.9z" {...p} />,
    lock:     <><rect x="5" y="10" width="14" height="10" rx="2.5" {...p} /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" {...p} /></>,
    map:      <path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14" {...p} />,
    book:     <><path d="M4 5.5A2 2 0 0 1 6 4h6v15H6a2 2 0 0 0-2 1.5z" {...p} /><path d="M20 5.5A2 2 0 0 0 18 4h-6v15h6a2 2 0 0 1 2 1.5z" {...p} /></>,
    sparkle:  <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" {...p} />,
    clock:    <><circle cx="12" cy="12" r="8" {...p} /><path d="M12 8v4.5l3 1.5" {...p} /></>,
    receipt:  <><path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" {...p} /><path d="M9 8h6M9 12h6" {...p} /></>,
    cake:     <><path d="M4 20h16M5 20v-7h14v7M7 13v-2.5M12 13v-2.5M17 13v-2.5M12 7.5V4.5" {...p} /><circle cx="12" cy="3.4" r=".7" fill={color} stroke="none" /></>,
    gift:     <><rect x="4" y="9" width="16" height="11" rx="1.5" {...p} /><path d="M3.5 9h17M12 9v11M12 9s-1.2-4-3.2-4a1.8 1.8 0 0 0 0 4M12 9s1.2-4 3.2-4a1.8 1.8 0 0 1 0 4" {...p} /></>,
    tag:      <><path d="M4 4h7l9 9-7 7-9-9z" {...p} /><circle cx="8.5" cy="8.5" r="1.4" {...p} /></>,
    link:     <><path d="M9.5 14.5l5-5M8 11l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 13l2-2a3.5 3.5 0 0 0-5-5l-2 2" {...p} /></>,
    edit:     <path d="M14 5l5 5M4 20l1-4L16 5l3 3L8 19z" {...p} />,
    external: <><path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" {...p} /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      {paths[name] || null}
    </svg>
  )
}
