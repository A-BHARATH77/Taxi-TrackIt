import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface AddTaxiDialogProps {
  trigger: React.ReactNode;
  onSubmit: (data: { name: string; taxiId: string }) => Promise<void>;
}

export function AddTaxiDialog({ trigger, onSubmit }: AddTaxiDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [taxiId, setTaxiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isValidTaxiId = taxiId.length === 4 && /^\d{4}$/.test(taxiId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !taxiId || !isValidTaxiId) {
      setAlert({ type: 'error', message: 'Please fill in all fields correctly' });
      return;
    }

    setLoading(true);
    setAlert(null);
    
    try {
      await onSubmit({ name, taxiId });
      setName("");
      setTaxiId("");
      setAlert(null);
      setOpen(false);
    } catch (error) {
      setAlert({ type: 'error', message: (error as Error).message || 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Taxi</DialogTitle>
          <DialogDescription>
            Enter the taxi details below to add a new vehicle to your fleet.
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name || !isValidTaxiId}>
              {loading ? "Adding..." : "Add Taxi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
