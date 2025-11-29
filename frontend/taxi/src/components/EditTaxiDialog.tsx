import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckIcon,
  CreditCardIcon,
  MailIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";

interface Taxi {
  id: number;
  name: string;
  taxi_id: string;
  created_at: string;
}

interface EditTaxiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taxi: Taxi | null;
  onSubmit: (id: number, data: { name: string; taxiId: string }) => Promise<void>;
}

export function EditTaxiDialog({ open, onOpenChange, taxi, onSubmit }: EditTaxiDialogProps) {
  const [name, setName] = useState("");
  const [taxiId, setTaxiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isValidTaxiId = taxiId.length === 4 && /^\d{4}$/.test(taxiId);

  useEffect(() => {
    if (taxi) {
      setName(taxi.name || "");
      setTaxiId(taxi.taxi_id || "");
      setAlert(null);
    }
  }, [taxi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taxi) {
      setAlert({ type: 'error', message: 'No taxi selected for editing' });
      return;
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      setAlert({ type: 'error', message: 'Please enter a taxi name' });
      return;
    }

    if (!taxiId || typeof taxiId !== 'string' || !taxiId.trim() || !isValidTaxiId) {
      setAlert({ type: 'error', message: 'Please enter a valid 4-digit taxi ID' });
      return;
    }

    setLoading(true);
    setAlert(null);
    
    try {
      await onSubmit(taxi.id, { name, taxiId });
      setAlert(null);
      onOpenChange(false);
    } catch (error) {
      setAlert({ type: 'error', message: (error as Error).message || 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (taxi) {
      setName(taxi.name);
      setTaxiId(taxi.taxi_id);
    }
    setAlert(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Taxi</DialogTitle>
          <DialogDescription>
            Update the taxi details below. You can edit the name, ID, or both.
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
            
            <InputGroup>
              <InputGroupInput 
                placeholder="Taxi Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <InputGroupAddon>
                <MailIcon />
              </InputGroupAddon>
            </InputGroup>
            <InputGroup>
              <InputGroupInput 
                placeholder="Taxi Number" 
                value={taxiId}
                onChange={(e) => setTaxiId(e.target.value)}
                required
                maxLength={4}
              />
              <InputGroupAddon>
                <CreditCardIcon />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <CheckIcon className={isValidTaxiId ? 'text-green-500' : 'text-neutral-400'} />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Taxi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}