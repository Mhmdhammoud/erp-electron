import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Filter, DollarSign, FileText, AlertCircle, Receipt } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useRecordPaymentMutation,
  useGetOrdersQuery,
  useGetCustomersQuery,
} from '../types/generated';
import { useToast } from '../hooks/use-toast';
import { PaymentStatus, PaymentMethod } from '../utils/constants';

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Create invoice form
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.CASH);
  const [paymentNotes, setPaymentNotes] = useState('');

  const { toast } = useToast();
  const { formatDual } = useCurrency();

  const { data: invoicesData, loading, refetch } = useGetInvoicesQuery({
    variables: { filter: statusFilter ? { status: statusFilter } : undefined },
  });

  const { data: ordersData } = useGetOrdersQuery();
  const { data: customersData } = useGetCustomersQuery();

  const [createInvoice, { loading: creating }] = useCreateInvoiceMutation();
  const [recordPayment, { loading: recording }] = useRecordPaymentMutation();

  const invoices = invoicesData?.invoices?.invoices || [];
  const orders = ordersData?.orders?.orders || [];
  const customers = customersData?.customers?.customers || [];

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
    setSelectedOrderId('');
    setSelectedCustomerId('');
    setDueDate('');
    setInvoiceNotes('');
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setSelectedOrderId('');
    setSelectedCustomerId('');
    setDueDate('');
    setInvoiceNotes('');
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrderId && !selectedCustomerId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an order or customer',
      });
      return;
    }

    if (!dueDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a due date',
      });
      return;
    }

    try {
      const result = await createInvoice({
        variables: {
          input: {
            order_id: selectedOrderId || null,
            customer_id: selectedCustomerId,
            due_date: dueDate,
            notes: invoiceNotes || null,
          },
        },
      });

      if (result.data?.createInvoice?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.createInvoice.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Invoice created successfully',
        });
        handleCloseCreateDialog();
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred',
      });
    }
  };

  const handleOpenPaymentDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
    const remaining = invoice.total_usd - invoice.paid_amount_usd;
    setPaymentAmount(remaining.toFixed(2));
    setPaymentMethod(PaymentMethod.CASH);
    setPaymentNotes('');
  };

  const handleClosePaymentDialog = () => {
    setIsPaymentDialogOpen(false);
    setSelectedInvoice(null);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid payment amount',
      });
      return;
    }

    const remaining = selectedInvoice.total_usd - selectedInvoice.paid_amount_usd;
    if (amount > remaining) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Payment amount cannot exceed remaining balance of $${remaining.toFixed(2)}`,
      });
      return;
    }

    try {
      const result = await recordPayment({
        variables: {
          input: {
            invoice_id: selectedInvoice.id,
            amount_usd: amount,
            payment_method: paymentMethod,
            notes: paymentNotes || null,
          },
        },
      });

      if (result.data?.recordPayment?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.recordPayment.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Payment recorded successfully',
        });
        handleClosePaymentDialog();
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'default';
      case PaymentStatus.PARTIAL:
        return 'secondary';
      case PaymentStatus.OVERDUE:
      case PaymentStatus.UNPAID:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get the due date for default value (7 days from now)
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const selectedOrder = orders.find((o: any) => o.id === selectedOrderId);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-muted-foreground mt-1">Manage invoices and payments</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value={PaymentStatus.UNPAID}>Unpaid</SelectItem>
                  <SelectItem value={PaymentStatus.PARTIAL}>Partial</SelectItem>
                  <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={PaymentStatus.OVERDUE}>Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No invoices found. Create your first invoice to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => {
                  const { usd: totalUsd } = formatDual(invoice.total_usd);
                  const { usd: paidUsd } = formatDual(invoice.paid_amount_usd);
                  const remaining = invoice.total_usd - invoice.paid_amount_usd;
                  const { usd: remainingUsd } = formatDual(remaining);
                  const customer = customers.find((c: any) => c._id === invoice.customer_id);
                  const isOverdue = new Date(invoice.due_date) < new Date() && remaining > 0;

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoice_number || invoice.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-medium">{totalUsd}</TableCell>
                      <TableCell className="text-green-600 dark:text-green-500">
                        {paidUsd}
                      </TableCell>
                      <TableCell className="text-destructive font-medium">
                        {remainingUsd}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </span>
                          {isOverdue && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.payment_status)}>
                          {invoice.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {remaining > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPaymentDialog(invoice)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice from an existing order or for a customer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order">From Order (Optional)</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger id="order">
                  <SelectValue placeholder="Select an order..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No order</SelectItem>
                  {orders
                    .filter((o: any) => o.status === 'confirmed' || o.status === 'shipped')
                    .map((order: any) => {
                      const customer = customers.find((c: any) => c._id === order.customer_id);
                      return (
                        <SelectItem key={order.id} value={order.id}>
                          Order {order.id.slice(0, 8)} - {customer?.name || 'Unknown'} - $
                          {order.total_usd.toFixed(2)}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <Card>
                <CardHeader>
                  <h4 className="text-sm font-semibold">Order Details</h4>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items:</span>
                    <span>{selectedOrder.items?.length || 0} products</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">${selectedOrder.total_usd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span>{selectedOrder.currency_used}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {!selectedOrderId && (
              <div className="space-y-2">
                <Label htmlFor="customer">
                  Customer <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name}
                        {customer.email && ` (${customer.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {!dueDate && (
                <p className="text-xs text-muted-foreground">
                  Suggested: {new Date(getDefaultDueDate()).toLocaleDateString()} (7 days)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNotes">Notes (Optional)</Label>
              <Textarea
                id="invoiceNotes"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                rows={3}
                placeholder="Add any additional notes for this invoice..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseCreateDialog}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={creating}>
              {creating ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice{' '}
              {selectedInvoice?.invoice_number || selectedInvoice?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Total:</span>
                    <span className="font-medium">
                      ${selectedInvoice.total_usd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already Paid:</span>
                    <span className="text-green-600 dark:text-green-500">
                      ${selectedInvoice.paid_amount_usd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Remaining Balance:</span>
                    <span className="font-bold text-lg">
                      ${(selectedInvoice.total_usd - selectedInvoice.paid_amount_usd).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">
                  Payment Amount (USD) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.total_usd - selectedInvoice.paid_amount_usd}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">
                  Payment Method <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                    <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                    <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                    <SelectItem value={PaymentMethod.CHECK}>Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Textarea
                  id="paymentNotes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  placeholder="Add any notes about this payment..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClosePaymentDialog}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recording}>
              {recording ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
