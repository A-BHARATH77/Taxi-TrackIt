"use client";
import  { useState } from "react";
import { Link } from 'react-router-dom';
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import { GridBackground } from "../components/GridBackground";
import { ThemeToggle } from "../components/ThemeToggle";
import { LiveTrackingMap } from "../components/LiveTrackingMap";
import { ZoneEventsPanel } from "../components/ZoneEventsPanel";
import { TaxiTrackitLogo } from "../components/TaxiTrackitLogo";
import {
  IconBrandTabler,
  IconCar,
  IconMapPin,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function SidebarDemo() {
  const links = [
    {
      label: "Home",
      href: "/",
      icon: (
        <IconBrandTabler className="h-8 w-8 shrink-0 text-neutral-900 dark:text-neutral-200" />
      ),
    },
    {
      label: "Taxi",
      href: "/taxi",
      icon: (
        <IconCar className="h-8 w-8 shrink-0 text-neutral-900 dark:text-neutral-200" />
      ),
    },
    {
      label: "Zone",
      href: "/zone",
      icon: (
        <IconMapPin className="h-8 w-8 shrink-0 text-neutral-900 dark:text-neutral-200" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
        "h-screen", // for your use case, use `h-screen` instead of `h-[60vh]`
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="gap-17">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <div key={idx} className="shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl p-1">
                  <SidebarLink link={link} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto">
            <ThemeToggle />
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard />
    </div>
  );
}
export const Logo = () => {
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-base font-normal text-black hover:text-black dark:hover:text-white"
    >
      <TaxiTrackitLogo size={50} className="shrink-0 text-black dark:text-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-semibold whitespace-pre text-black dark:text-white hover:text-black dark:hover:text-white"
      >
       Taxi Trackit
      </motion.span>
    </Link>
  );
};
export const LogoIcon = () => {
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black hover:text-black dark:hover:text-white"
    >
      <TaxiTrackitLogo size={50} className="shrink-0 text-black dark:text-white" />
    </Link>
  );
};

// Dashboard component
const Dashboard = () => {
  return (
    <GridBackground>
      <div className="flex h-full w-full flex-1 flex-col gap-4 rounded-tl-2xl p-2 md:p-10">
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-neutral-800 dark:text-neutral-200">
            Live Taxi Tracking
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-2">
            Real-time monitoring of taxi fleet movements and zone transitions
          </p>
        </div>
        
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 min-h-0">
            <LiveTrackingMap />
          </div>
          <div className="lg:col-span-1 min-h-0">
            <ZoneEventsPanel />
          </div>
        </div>
      </div>
    </GridBackground>
  );
};
