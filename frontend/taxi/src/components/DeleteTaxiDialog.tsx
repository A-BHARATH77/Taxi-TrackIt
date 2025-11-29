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

interface Taxi {
  id: number;
  name: string;
  taxi_id: string;
  created_at: string;
}

interface DeleteTaxiDialogProps {
  taxi: Taxi;
  trigger: React.ReactNode;
  onDelete: (id: number, name: string) => Promise<void>;
}

export function DeleteTaxiDialog({ taxi, trigger, onDelete }: DeleteTaxiDialogProps) {
  const handleDelete = () => {
    onDelete(taxi.id, taxi.name);
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
            This action cannot be undone. This will permanently delete taxi "{taxi.name}" (ID: {taxi.taxi_id}) 
            and remove it from your fleet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-400 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Taxi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}