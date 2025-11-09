import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { useGetInvoiceQuery, useRecordPaymentMutation } from '../types/generated';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { useCurrency } from '../hooks/use-currency';

interface PaymentFormData {
  amount_usd: number;
  amount_lbp: number;
  payment_method: string;
  notes?: string;
}

export default function InvoiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { exchangeRate, formatDual } = useCurrency();

  const { data, loading, refetch } = useGetInvoiceQuery({
    variables: { id: id! },
    skip: !id,
  });

  const invoice = data?.invoice?.invoice;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    defaultValues: {
      amount_usd: 0,
      amount_lbp: 0,
      payment_method: 'cash',
      notes: '',
    },
  });

  const [recordPayment, { loading: recording }] = useRecordPaymentMutation();

  const remaining = invoice ? (invoice.total_usd || 0) - (invoice.paid_amount_usd || 0) : 0;
  const isOverdue = invoice
    ? new Date(invoice.due_date) < new Date() && remaining > 0
    : false;

  const onSubmit = async (formData: PaymentFormData) => {
    try {
      const { data } = await recordPayment({
        variables: {
          id: id!,
          input: {
            amount_usd: Number(formData.amount_usd),
            amount_lbp: Number(formData.amount_lbp),
            payment_method: formData.payment_method,
            notes: formData.notes || undefined,
          },
        },
      });

      if (data?.recordPayment?.error) {
        toast({
          title: 'Error',
          description: data.recordPayment.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Payment recorded successfully',
        });
        refetch();
        // Reset form
        setValue('amount_usd', 0);
        setValue('amount_lbp', 0);
        setValue('payment_method', 'cash');
        setValue('notes', '');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Auto-calculate LBP when USD changes
  const handleUsdChange = (value: string) => {
    const usd = Number(value);
    const lbp = usd * exchangeRate;
    setValue('amount_lbp', Number(lbp.toFixed(2)));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Invoice not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/invoices/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Record Payment</h1>
      </div>

      <div className="space-y-6">
        {/* Invoice Information (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
            <CardDescription>Current invoice details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Invoice Number</Label>
                <p className="font-mono text-sm">{invoice.invoice_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Customer ID</Label>
                <p className="font-mono text-sm">{invoice.customer_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Due Date</Label>
                <div className="flex items-center gap-2">
                  <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                  {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Payment Status</Label>
                <div className="mt-1">
                  <Badge className={getPaymentStatusColor(invoice.payment_status || 'unpaid')}>
                    {invoice.payment_status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="text-lg font-semibold">${invoice.total_usd?.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Paid Amount</Label>
                  <p className="text-lg font-semibold text-green-600">
                    ${invoice.paid_amount_usd?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Remaining</Label>
                  <p className={`text-lg font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${remaining.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {invoice.payments && invoice.payments.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-2 block">Payment History</Label>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="p-2 text-left text-sm font-medium">Date</th>
                        <th className="p-2 text-left text-sm font-medium">Method</th>
                        <th className="p-2 text-right text-sm font-medium">Amount USD</th>
                        <th className="p-2 text-right text-sm font-medium">Amount LBP</th>
                        <th className="p-2 text-left text-sm font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.payments.map((payment, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="p-2">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="p-2 capitalize">{payment.payment_method}</td>
                          <td className="p-2 text-right font-medium">
                            ${payment.amount_usd?.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-medium">
                            {payment.amount_lbp?.toLocaleString()} LBP
                          </td>
                          <td className="p-2 text-muted-foreground">{payment.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Recording Form */}
        {remaining > 0 && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Record New Payment</CardTitle>
                <CardDescription>
                  Add a payment to this invoice (Remaining: ${remaining.toFixed(2)})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount_usd">Amount (USD) *</Label>
                    <Input
                      id="amount_usd"
                      type="number"
                      step="0.01"
                      {...register('amount_usd', {
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Amount must be greater than 0' },
                        max: { value: remaining, message: `Amount cannot exceed $${remaining.toFixed(2)}` },
                      })}
                      onChange={(e) => {
                        register('amount_usd').onChange(e);
                        handleUsdChange(e.target.value);
                      }}
                    />
                    {errors.amount_usd && (
                      <p className="text-sm text-red-500">{errors.amount_usd.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount_lbp">Amount (LBP) *</Label>
                    <Input
                      id="amount_lbp"
                      type="number"
                      step="0.01"
                      {...register('amount_lbp', {
                        required: 'Amount is required',
                        min: { value: 0, message: 'Amount must be greater than or equal to 0' },
                      })}
                    />
                    {errors.amount_lbp && (
                      <p className="text-sm text-red-500">{errors.amount_lbp.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Exchange rate: {exchangeRate} LBP/USD
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <Select
                    value={watch('payment_method')}
                    onValueChange={(value) => setValue('payment_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" {...register('notes')} rows={2} />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate(`/invoices/${id}`)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={recording}>
                    {recording && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <DollarSign className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}

        {remaining <= 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-green-500 p-2">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Invoice Fully Paid</p>
                <p className="text-sm text-green-700">
                  This invoice has been paid in full. No further payments needed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
