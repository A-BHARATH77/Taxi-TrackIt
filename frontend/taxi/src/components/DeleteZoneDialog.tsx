import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Zone {
  id: number;
  name: string;
  boundary: string;
  created_at: string;
}

interface DeleteZoneDialogProps {
  zone: Zone;
  trigger: React.ReactNode;
  onDelete: (id: number, name: string) => Promise<void>;
}

export function DeleteZoneDialog({ zone, trigger, onDelete }: DeleteZoneDialogProps) {
  const handleDelete = () => {
    onDelete(zone.id, zone.name);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete zone "{zone.name}" 
            and remove it from your system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-400 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Zone
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
