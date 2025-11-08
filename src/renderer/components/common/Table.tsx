import {
  Table as HeroTable,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
} from '@heroui/react';
import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T) => ReactNode;
  width?: string;
}

interface TableProps<T> {
  readonly data: T[];
  readonly columns: Column<T>[];
  readonly isLoading?: boolean;
  readonly emptyMessage?: string;
}

export default function Table<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  return (
    <HeroTable
      aria-label="Data table"
      isStriped
      classNames={{
        wrapper: 'min-h-[222px]',
      }}
    >
      <TableHeader>
        {columns.map((column) => (
          <TableColumn key={column.key} style={{ width: column.width }}>
            {column.header}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody
        isLoading={isLoading}
        loadingContent={<Spinner label="Loading..." />}
        emptyContent={emptyMessage}
        items={data}
      >
        {(item) => (
          <TableRow key={item.id || data.indexOf(item)}>
            {(columnKey) => {
              const column = columns.find((col) => col.key === columnKey);
              const value = item[columnKey as string];
              return <TableCell>{column?.render ? column.render(value, item) : value}</TableCell>;
            }}
          </TableRow>
        )}
      </TableBody>
    </HeroTable>
  );
}
