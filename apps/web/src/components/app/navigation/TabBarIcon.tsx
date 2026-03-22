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
      <g stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

function HomeIcon(props: Omit<IconBaseProps, "children">) {
  return (
    <IconBase {...props}>
      <path d="M5 10.5 12 4.5l7 6" />
      <path d="M7 8.8V19.5H17V8.8" />
      <path d="M10.2 19.5V13h3.6v6.5" />
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
      <rect x="5" y="5" width="10" height="10" rx="1.8" />
      <path d="M15 9h4v10H9v-4" />
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
