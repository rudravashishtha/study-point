import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StudentActivationLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-9 w-64 bg-muted rounded"></div>
        <div className="h-5 w-96 mt-1 bg-muted rounded"></div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Eligibility</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-5 w-24 bg-muted rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-40 bg-muted rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-48 bg-muted rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-20 rounded-full bg-muted"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-9 w-28 ml-auto bg-muted rounded"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
