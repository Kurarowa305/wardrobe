import type { ReactNode, SVGProps } from "react";

export type TabIconKey = "home" | "histories" | "templates" | "clothings";

type TabBarIconProps = {
  icon: TabIconKey;
  active: boolean;
} & Omit<SVGProps<SVGSVGElement>, "children">;

type IconBaseProps = {
  active: boolean;
  children: ReactNode;
} & SVGProps<SVGSVGElement>;

function IconBase({ active, children, className, ...props }: IconBaseProps) {
  const color = active ? "#FFFFFF" : "#6B7987";

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      className={className}
      {...props}
    >
      <g stroke={color} fill={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

function HomeIcon(props: Omit<IconBaseProps, "children">) {
  return (
    <IconBase {...props}>
      <path d="M4.5 10.5 12 4l7.5 6.5" fill="none" />
      <path d="M6.5 9.5V20h11V9.5" fill="none" />
      <rect x="9.1" y="11.2" width="2.8" height="6.8" rx="0.6" stroke="none" />
      <rect x="12.9" y="11.2" width="2.8" height="6.8" rx="0.6" stroke="none" />
    </IconBase>
  );
}

function HistoriesIcon(props: Omit<IconBaseProps, "children">) {
  return (
    <IconBase {...props}>
      <path d="M7 6.7A8 8 0 1 1 5.1 9.5" fill="none" />
      <path d="M4.7 4.8v4.1h4.1" fill="none" />
      <path d="M12 8.3v4.2l3 1.8" fill="none" />
    </IconBase>
  );
}

function TemplatesIcon(props: Omit<IconBaseProps, "children">) {
  return (
    <IconBase {...props}>
      <rect x="5" y="4" width="11" height="14" rx="1.8" fill="none" />
      <path d="M9 7.5h4.5" fill="none" />
      <path d="M9 11h4.5" fill="none" />
      <path d="M9 14.5h4.5" fill="none" />
      <path d="M16 8.5 19 6v14H8.2V18" fill="none" />
    </IconBase>
  );
}

function ClothingsIcon(props: Omit<IconBaseProps, "children">) {
  return (
    <IconBase {...props}>
      <path
        d="M8.2 5.5 6 7.2 3.8 8.3l1.6 3.3 2-.9V20h9.2v-9.3l2 .9 1.6-3.3L18 7.2l-2.2-1.7-1.8 2H10l-1.8-2Z"
        fill="none"
      />
      <path d="M10.1 7.5c.3.8 1 1.3 1.9 1.3s1.6-.5 1.9-1.3" fill="none" />
    </IconBase>
  );
}

export function TabBarIcon({ icon, active, ...props }: TabBarIconProps) {
  if (icon === "home") {
    return <HomeIcon active={active} {...props} />;
  }

  if (icon === "histories") {
    return <HistoriesIcon active={active} {...props} />;
  }

  if (icon === "templates") {
    return <TemplatesIcon active={active} {...props} />;
  }

  return <ClothingsIcon active={active} {...props} />;
}
