import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useGetInvoiceQuery, useGetCustomersQuery } from '../types/generated';
import { useCurrency } from '../hooks/useCurrency';
import { PaymentStatus } from '../utils/constants';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatDual } = useCurrency();

  const { data, loading } = useGetInvoiceQuery({
    variables: { id: id! },
    skip: !id,
  });

  const { data: customersData } = useGetCustomersQuery();

  const invoice = data?.invoice?.invoice;
  const customers = customersData?.customers?.customers || [];
  const customer = customers.find((c) => c._id === invoice?.customer_id);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">The invoice you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/invoices')} className="mt-4">
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { usd: totalUsd } = formatDual(invoice.total_usd || 0);
  const { usd: paidUsd } = formatDual(invoice.paid_amount_usd || 0);
  const remaining = (invoice.total_usd || 0) - (invoice.paid_amount_usd || 0);
  const { usd: remainingUsd } = formatDual(remaining);
  const isOverdue = new Date(invoice.due_date) < new Date() && remaining > 0;

  const getStatusVariant = (status: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice {invoice.invoice_number || `#${invoice._id.slice(0, 8)}`}
            </h1>
            <p className="text-muted-foreground mt-2">Invoice Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
            <CardDescription>Basic details about this invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Customer</div>
              <div className="text-lg font-semibold">{customer?.name || 'Unknown'}</div>
              {customer?.email && <div className="text-sm text-muted-foreground">{customer.email}</div>}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Due Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                  {isOverdue && <AlertCircle className="w-4 h-4 text-destructive" />}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <Badge variant={getStatusVariant(invoice.payment_status)}>
                  {invoice.payment_status}
                </Badge>
              </div>
            </div>

            {invoice.notes && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
                  <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>Payment status and amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Amount</div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div className="text-2xl font-bold">{totalUsd}</div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Paid Amount</div>
              <div className="text-xl font-semibold text-green-600 dark:text-green-500">{paidUsd}</div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Remaining Balance</div>
              <div className="text-xl font-semibold text-destructive">{remainingUsd}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Recorded payments for this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount (USD)</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">${payment.amount_usd.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
