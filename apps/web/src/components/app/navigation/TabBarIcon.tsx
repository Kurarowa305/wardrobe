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
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

function HomeIcon(props: Omit<IconBaseProps, "children">) {
  return (
    <IconBase {...props}>
      <path d="M3 10L12 3l9 7" />
      <path d="M5 10v11h5v-6h4v6h5V10" />
    </IconBase>
  );
}

function HistoriesIcon(props: Omit<IconBaseProps, "children">) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M6.34 2.34v4h4" />
      <path d="M12 7v5l3 3" />
    </IconBase>
  );
}

function TemplatesIcon(props: Omit<IconBaseProps, "children">) {
  return (
    <IconBase {...props}>
      <path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
      <rect x="4" y="8" width="12" height="12" rx="2" />
    </IconBase>
  );
}

function ClothingsIcon(props: Omit<IconBaseProps, "children">) {
  return (
    <IconBase {...props}>
      <path d="M9 3q3 3 6 0l4 1 2 5-4 2v10H7V11l-4-2 2-5 4-1z" />
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
