import { StudentActivationCandidate } from "@/server/services/provisioning";
import { InviteStudentButton } from "./InviteStudentButton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";

interface StudentActivationQueueProps {
  candidates: StudentActivationCandidate[];
}

export function StudentActivationQueue({ candidates }: StudentActivationQueueProps) {
  if (candidates.length === 0) {
    return (
      <DataListEmpty
        title="No students to activate"
        description="All eligible students have already been invited or there are no unprovisioned students."
      />
    );
  }

  return (
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
          {candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell className="font-medium">{candidate.studentCode}</TableCell>
              <TableCell>{candidate.fullName}</TableCell>
              <TableCell>
                {candidate.email ? (
                  candidate.email
                ) : (
                  <span className="text-muted-foreground italic">No email provided</span>
                )}
              </TableCell>
              <TableCell>
                {candidate.isEligible ? (
                  <Badge variant="default">Eligible</Badge>
                ) : (
                  <Badge variant="destructive">Ineligible (Missing Email)</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <InviteStudentButton
                  studentId={candidate.id}
                  isEligible={candidate.isEligible}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
