import PropTypes from 'prop-types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './dialog';
import { Button } from './button';
import { User } from 'lucide-react';

export function CustomerInfoModal({ customer }) {
    if (!customer) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <User className="h-4 w-4" />
                    <span className="sr-only">View customer info</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Customer Information</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Name:</span>
                        <span className="col-span-3">{customer.name || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Email:</span>
                        <span className="col-span-3">{customer.email}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Joined:</span>
                        <span className="col-span-3">
                            {new Date(customer.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

CustomerInfoModal.propTypes = {
    customer: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string.isRequired,
        created_at: PropTypes.string.isRequired,
    }),
}; 