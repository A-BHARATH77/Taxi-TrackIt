"use client";
import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import { HoverBorderGradientDemo } from "../components/HoverBorderGradientDemo";
import { AddTaxiDialog } from "../components/AddTaxiDialog";
import { EditTaxiDialog } from "../components/EditTaxiDialog";
import { DeleteTaxiDialog } from "../components/DeleteTaxiDialog";
import { GridBackground } from "../components/GridBackground";
import { ThemeToggle } from "../components/ThemeToggle";
import { TaxiTrackitLogo } from "../components/TaxiTrackitLogo";
import { WobbleCard } from "../components/ui/wobble-card";
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
import { taxiService } from "../services/taxiService";

interface Taxi {
  id: number;
  name: string;
  taxi_id: string;
  created_at: string;
}

export function TaxiPage() {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTaxi, setEditingTaxi] = useState<Taxi | null>(null);
  
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

  const fetchTaxis = async () => {
    try {
      const data = await taxiService.fetchTaxis();
      setTaxis(data);
    } catch (error) {
      console.error('Error fetching taxis:', error);
      setAlert({ type: 'error', message: 'Network error while loading taxis' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxis();
  }, []);

  const handleAddTaxi = async (data: { name: string; taxiId: string }) => {
    try {
      const result = await taxiService.addTaxi(data);
      console.log("✅ Taxi added successfully:", result);
      setAlert({ type: 'success', message: `Taxi "${data.name}" (${data.taxiId}) added successfully!` });
      setTimeout(() => setAlert(null), 3000);
      fetchTaxis(); // Refresh the taxi list
    } catch (error) {
      console.error("❌ Error:", error);
      setAlert({ type: 'error', message: (error as Error).message || 'Error adding taxi' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleDeleteTaxi = async (id: number, name: string) => {
    try {
      await taxiService.deleteTaxi(id);
      setAlert({ type: 'success', message: `Taxi "${name}" deleted successfully!` });
      setTimeout(() => setAlert(null), 3000);
      fetchTaxis(); // Refresh the taxi list
    } catch (error) {
      console.error('Error deleting taxi:', error);
      setAlert({ type: 'error', message: (error as Error).message || 'Network error while deleting taxi' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleEditTaxi = async (id: number, data: { name: string; taxiId: string }) => {
    try {
      const result = await taxiService.updateTaxi(id, data);
      setAlert({ type: 'success', message: `Taxi "${data.name}" updated successfully!` });
      setTimeout(() => setAlert(null), 3000);
      fetchTaxis(); // Refresh the taxi list
    } catch (error) {
      console.error('Error updating taxi:', error);
      setAlert({ type: 'error', message: (error as Error).message || 'Network error while updating taxi' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const openEditDialog = (taxi: Taxi) => {
    setEditingTaxi(taxi);
    setEditDialogOpen(true);
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
      <TaxiDashboard 
        alert={alert} 
        onAddTaxi={handleAddTaxi} 
        taxis={taxis}
        loading={loading}
        onDeleteTaxi={handleDeleteTaxi}
        onEditTaxi={openEditDialog}
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
      
      <EditTaxiDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        taxi={editingTaxi}
        onSubmit={handleEditTaxi}
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
// Taxi Dashboard component
const TaxiDashboard = ({
  onAddTaxi,
  taxis,
  loading,
  onDeleteTaxi,
  onEditTaxi
}: {
  alert: { type: 'success' | 'error'; message: string } | null;
  onAddTaxi: (data: { name: string; taxiId: string }) => Promise<void>;
  taxis: Taxi[];
  loading: boolean;
  onDeleteTaxi: (id: number, name: string) => Promise<void>;
  onEditTaxi: (taxi: Taxi) => void;
}) => {
  const totalTaxis = taxis.length;
  const activeTaxis = Math.floor(totalTaxis * 0.75); // Simulate 75% active
  const maintenanceTaxis = totalTaxis - activeTaxis;
  return (
    <GridBackground>
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl p-2 md:p-10 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">
              Taxi Management
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage and track your taxi fleet
            </p>
          </div>
          <AddTaxiDialog
            trigger={
              <div>
                <HoverBorderGradientDemo 
                  glowColor="#F59E0B" 
                  text="Add Taxi" 
                  icon={<IconCar className="h-4 w-4" />} 
                />
              </div>
            }
            onSubmit={onAddTaxi}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl">
          <WobbleCard
            containerClassName="col-span-1 bg-blue-600 min-h-[100px] max-h-[120px]"
            className="flex flex-col items-center justify-center h-full p-4"
          >
            <div className="text-center">
              <h2 className="text-sm font-semibold text-white">
                Total Taxis
              </h2>
              <p className="mt-1 text-2xl font-bold text-white">{totalTaxis}</p>
            </div>
          </WobbleCard>

          <WobbleCard containerClassName="col-span-1 bg-green-600 min-h-[100px] max-h-[120px]" className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-center">
              <h2 className="text-sm font-semibold text-white">
                Active Taxis
              </h2>
              <p className="mt-1 text-2xl font-bold text-white">{activeTaxis}</p>
            </div>
          </WobbleCard>

          <WobbleCard containerClassName="col-span-1 bg-yellow-600 min-h-[100px] max-h-[120px]" className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-center">
              <h2 className="text-sm font-semibold text-white">
                Under Maintenance
              </h2>
              <p className="mt-1 text-2xl font-bold text-white">{maintenanceTaxis}</p>
            </div>
          </WobbleCard>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">All Taxis</h2>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-neutral-200"></div>
              <span className="ml-2 text-neutral-600 dark:text-neutral-400">Loading taxis...</span>
            </div>
          ) : taxis.length === 0 ? (
            <div className="text-center p-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <IconCar className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">No taxis found. Add your first taxi!</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                        Taxi ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {taxis.map((taxi, index) => {
                      const isActive = index < activeTaxis;
                      return (
                        <tr key={taxi.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-neutral-900 dark:text-neutral-100">
                            {taxi.taxi_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-neutral-600 dark:text-neutral-300">
                            {taxi.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-neutral-600 dark:text-neutral-300">
                            {new Date(taxi.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-sm rounded-full ${
                              isActive 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            }`}>
                              {isActive ? 'Active' : 'Maintenance'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                            <div className="flex items-center justify-end space-x-4">
                              <button
                                onClick={() => onEditTaxi(taxi)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="Edit taxi"
                              >
                                <IconEdit className="h-5 w-5" />
                              </button>
                              <DeleteTaxiDialog
                                taxi={taxi}
                                onDelete={onDeleteTaxi}
                                trigger={
                                  <button
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    title="Delete taxi"
                                  >
                                    <IconTrash className="h-5 w-5" />
                                  </button>
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </GridBackground>
  );
};