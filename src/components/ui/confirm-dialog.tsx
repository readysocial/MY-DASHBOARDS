import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useConfirmState, respond } from '@/lib/confirm';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ConfirmDialog() {
  const { open, title, description, confirmText, variant } = useConfirmState();

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) respond(false); }}>
      <AlertDialogContent className="bg-white border border-gray-200 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => respond(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => respond(true)}
            className={cn(
              variant === 'destructive'
                ? buttonVariants({ variant: 'destructive' })
                : buttonVariants({ variant: 'default' })
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
