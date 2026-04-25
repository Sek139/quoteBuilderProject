import { Trash2 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Input, Button,
} from '@/components/ui';
import { useQuoteStore } from '@/stores/quoteStore';

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function QuoteLines() {
  const { lineItems, updateLine, removeLine } = useQuoteStore();

  if (lineItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
        <p className="text-sm font-medium">Your quote is empty</p>
        <p className="text-xs mt-1">Add products from the catalog on the left</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">Product</TableHead>
            <TableHead className="text-xs w-20 text-center">Qty</TableHead>
            <TableHead className="text-xs w-24 text-right">Unit Price</TableHead>
            <TableHead className="text-xs w-20 text-center">Disc %</TableHead>
            <TableHead className="text-xs w-28 text-right">Total</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map(line => {
            const lineTotal = line.unitPrice * line.quantity * (1 - line.discount / 100);
            return (
              <TableRow key={line.id}>
                <TableCell>
                  <p className="text-sm font-medium">{line.productName}</p>
                  <p className="text-xs text-muted-foreground">{line.productCode}</p>
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min={1}
                    max={9999}
                    value={line.quantity}
                    onChange={e =>
                      updateLine(line.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="h-7 w-16 text-center text-sm mx-auto"
                  />
                </TableCell>
                <TableCell className="text-right text-sm">{fmt(line.unitPrice)}</TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={line.discount}
                    onChange={e =>
                      updateLine(line.id, {
                        discount: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                      })
                    }
                    className="h-7 w-16 text-center text-sm mx-auto"
                  />
                </TableCell>
                <TableCell className="text-right text-sm font-semibold">{fmt(lineTotal)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLine(line.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
