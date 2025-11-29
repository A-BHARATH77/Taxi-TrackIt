"use client";
import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import { HoverBorderGradientDemo } from "../components/HoverBorderGradientDemo";
import { MapComponent } from "../components/MapComponent";
import { AddZoneDialog } from "../components/AddZoneDialog";
import { DeleteZoneDialog } from "../components/DeleteZoneDialog";
import { GridBackground } from "../components/GridBackground";
import { ThemeToggle } from "../components/ThemeToggle";
import { TaxiTrackitLogo } from "../components/TaxiTrackitLogo";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  IconBrandTabler,
  IconCar,
  IconMapPin,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import {
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { zoneService } from "../services/zoneService";

interface Zone {
  id: number;
  name: string;
  boundary: string;
  created_at: string;
}

export function ZonePage() {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [addZoneDialogOpen, setAddZoneDialogOpen] = useState(false);
  const [pendingBoundary, setPendingBoundary] = useState<any>(null);
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

  const fetchZones = async () => {
    try {
      const data = await zoneService.fetchZones();
      setZones(data);
    } catch (error) {
      console.error('Error fetching zones:', error);
      setAlert({ type: 'error', message: 'Network error while loading zones' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleZoneCreate = (boundary: any) => {
    setPendingBoundary(boundary);
    setAddZoneDialogOpen(true);
  };

  const handleAddZone = async (data: { name: string; boundary: any }) => {
    try {
      const result = await zoneService.addZone(data);
      console.log("✅ Zone added successfully:", result);
      setAlert({ type: 'success', message: `Zone "${data.name}" added successfully!` });
      setTimeout(() => setAlert(null), 3000);
      fetchZones(); // Refresh the zones list
      setPendingBoundary(null);
    } catch (error) {
      console.error("❌ Error:", error);
      setAlert({ type: 'error', message: (error as Error).message || 'Error adding zone' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleDeleteZone = async (id: number, name: string) => {
    try {
      await zoneService.deleteZone(id);
      setAlert({ type: 'success', message: `Zone "${name}" deleted successfully!` });
      setTimeout(() => setAlert(null), 3000);
      fetchZones(); // Refresh the zones list
    } catch (error) {
      console.error('Error deleting zone:', error);
      setAlert({ type: 'error', message: (error as Error).message || 'Network error while deleting zone' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleEditZone = (id: number, boundary: any) => {
    // For now, just log - you can implement edit functionality later
    console.log('Edit zone:', id, boundary);
  };
  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
        "h-screen",
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
      <ZoneDashboard 
        zones={zones}
        loading={loading}
        onZoneCreate={handleZoneCreate}
        onDeleteZone={handleDeleteZone}
        onEditZone={handleEditZone}
      />
      
      {alert && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Alert className={cn(
            "border-2",
            alert.type === 'success' 
              ? 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800'
          )}>
            {alert.type === 'success' ? (
              <CheckCircle2Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <AlertTitle className={alert.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
              {alert.type === 'success' ? 'Success!' : 'Error'}
            </AlertTitle>
            <AlertDescription className={alert.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <AddZoneDialog
        open={addZoneDialogOpen}
        onOpenChange={setAddZoneDialogOpen}
        boundary={pendingBoundary}
        onSubmit={handleAddZone}
      />
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

// Zone Dashboard component
const ZoneDashboard = ({
  zones,
  loading,
  onZoneCreate,
  onDeleteZone,
  onEditZone
}: {
  zones: Zone[];
  loading: boolean;
  onZoneCreate: (boundary: any) => void;
  onDeleteZone: (id: number, name: string) => Promise<void>;
  onEditZone: (id: number, boundary: any) => void;
}) => {
  return (
    <GridBackground>
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl p-2 md:p-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-neutral-800 dark:text-neutral-200">
              Zone Management
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Draw zones on the map and manage taxi operating areas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Zones List Section */}
          <div className="lg:col-span-1 flex flex-col">
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              All Zones <span className="text-base font-normal text-neutral-600 dark:text-neutral-400">({zones.length})</span>
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center p-8 flex-1">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-neutral-200"></div>
                <span className="ml-2 text-base text-neutral-600 dark:text-neutral-400">Loading zones...</span>
              </div>
            ) : zones.length === 0 ? (
              <div className="text-center p-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg flex-1">
                <IconMapPin className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <p className="text-base text-neutral-600 dark:text-neutral-400">No zones found. Draw your first zone on the map!</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1">
                {zones.map((zone) => {
                  return (
                    <div key={zone.id} className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                            {zone.name}
                          </h3>
                          <p className="text-base text-neutral-500 dark:text-neutral-400">
                            Created: {new Date(zone.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <DeleteZoneDialog
                            zone={zone}
                            onDelete={onDeleteZone}
                            trigger={
                              <button
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Delete zone"
                              >
                                <IconTrash className="h-4 w-4" />
                              </button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Map Section */}
          <div className="lg:col-span-2 flex flex-col">
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Interactive Map</h2>
            <div className="flex-1">
              <MapComponent
                onZoneCreate={onZoneCreate}
                zones={zones}
                onZoneEdit={onEditZone}
                onZoneDelete={onDeleteZone}
              />
            </div>
          </div>
        </div>
      </div>
    </GridBackground>
  );
};