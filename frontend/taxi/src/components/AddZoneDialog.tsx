import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";

interface AddZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boundary: any;
  onSubmit: (data: { name: string; boundary: any }) => Promise<void>;
}

export function AddZoneDialog({ open, onOpenChange, boundary, onSubmit }: AddZoneDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setAlert({ type: 'error', message: 'Please enter a zone name' });
      return;
    }

    if (!boundary) {
      setAlert({ type: 'error', message: 'Please draw a zone on the map first' });
      return;
    }

    setLoading(true);
    setAlert(null);
    
    try {
      await onSubmit({ name: name.trim(), boundary });
      setName("");
      setAlert(null);
      onOpenChange(false);
    } catch (error) {
      setAlert({ type: 'error', message: (error as Error).message || 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setAlert(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Zone</DialogTitle>
          <DialogDescription>
            Enter a name for the zone you just drew on the map.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full gap-6 py-4">
            {alert && (
              <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
                {alert.type === 'success' ? <CheckCircle2Icon /> : <AlertCircleIcon />}
                <AlertTitle>
                  {alert.type === 'success' ? 'Success!' : 'Error'}
                </AlertTitle>
                <AlertDescription>
                  {alert.message}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid w-full gap-1.5">
              <Label htmlFor="zoneName">Zone Name</Label>
              <Input
                id="zoneName"
                placeholder="Enter zone name (e.g., Downtown, Airport)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {boundary && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md">
                <Label className="text-sm font-medium">Zone Type:</Label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                  {boundary.type}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !boundary}>
              {loading ? "Adding..." : "Add Zone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}