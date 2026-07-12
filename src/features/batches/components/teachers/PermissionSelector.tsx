"use client";

import { PermissionCapability } from "@prisma/client";
import {
  resolveEffectivePermissions,
  TEACHER_PERMISSION_PRESETS,
} from "@/lib/domain/permissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PermissionSelectorProps {
  value: PermissionCapability[];
  onChange: (value: PermissionCapability[]) => void;
}

const GROUPS = [
  {
    title: "Batch & Members",
    capabilities: [
      { view: "BATCH_VIEW", manage: "BATCH_MANAGE" },
      { view: "MEMBERS_VIEW", manage: "MEMBERS_MANAGE" },
    ],
  },
  {
    title: "Attendance",
    capabilities: [{ view: "ATTENDANCE_VIEW", manage: "ATTENDANCE_MANAGE" }],
  },
  {
    title: "Curriculum",
    capabilities: [
      { view: "CURRICULUM_PROGRESS_VIEW", manage: "CURRICULUM_PROGRESS_MANAGE" },
    ],
  },
  {
    title: "Materials & Homework",
    capabilities: [
      { view: "MATERIALS_VIEW", manage: "MATERIALS_MANAGE" },
      { view: "HOMEWORK_VIEW", manage: "HOMEWORK_MANAGE" },
    ],
  },
  {
    title: "Question Bank & Tests",
    capabilities: [
      { view: "QUESTION_BANK_VIEW", manage: "QUESTION_BANK_MANAGE" },
      { view: "TESTS_VIEW", manage: "TESTS_MANAGE" },
    ],
  },
  {
    title: "Results",
    capabilities: [{ view: "RESULTS_VIEW", manage: "RESULTS_MANAGE" }],
  },
  {
    title: "Fees & Payments",
    capabilities: [
      { view: "FEES_VIEW", manage: "FEES_MANAGE" },
      { manage: "PAYMENTS_RECORD" },
    ],
  },
  {
    title: "Schedule",
    capabilities: [{ view: "SCHEDULE_VIEW", manage: "SCHEDULE_MANAGE" }],
  },
  {
    title: "Announcements",
    capabilities: [{ view: "ANNOUNCEMENTS_VIEW", manage: "ANNOUNCEMENTS_MANAGE" }], // Note: Prisma says ANNOUNCEMENTS_VIEW and ANNOUNCEMENTS_MANAGE
  },
];

export function PermissionSelector({ value, onChange }: PermissionSelectorProps) {
  const effectivePermissions = resolveEffectivePermissions(value);

  const togglePermission = (perm: PermissionCapability) => {
    if (value.includes(perm)) {
      onChange(value.filter((p) => p !== perm));
    } else {
      onChange([...value, perm]);
    }
  };

  const isImplied = (perm: string) => {
    return (
      !value.includes(perm as PermissionCapability) &&
      effectivePermissions.includes(perm as PermissionCapability)
    );
  };

  const hasBatchView = value.includes("BATCH_VIEW");
  const isEmpty = value.length === 0;

  // A helper to determine if the current `value` array exactly matches a preset
  const isExactMatch = (presetPermissions: PermissionCapability[]) => {
    if (value.length !== presetPermissions.length) return false;
    const sortedValue = [...value].sort();
    const sortedPreset = [...presetPermissions].sort();
    return sortedValue.every((val, index) => val === sortedPreset[index]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Label>Presets</Label>
        <div className="flex flex-wrap gap-2">
          {TEACHER_PERMISSION_PRESETS.map((preset) => {
            const matched = isExactMatch(preset.permissions as PermissionCapability[]);
            return (
              <Button
                key={preset.name}
                type="button"
                variant={matched ? "default" : "outline"}
                size="sm"
                onClick={() => onChange(preset.permissions as PermissionCapability[])}
              >
                {preset.name}
              </Button>
            );
          })}
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
            Clear All
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Presets are UI helpers only. They check the relevant boxes below. Only
          explicitly checked boxes are saved.
        </p>
      </div>

      {!hasBatchView && !isEmpty && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Core Permission</AlertTitle>
          <AlertDescription>
            You must explicitly include BATCH_VIEW. Without it, the Teacher cannot access
            this batch context.
          </AlertDescription>
        </Alert>
      )}

      {isEmpty && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Empty Selection</AlertTitle>
          <AlertDescription>
            At least one permission must be selected to save. Usually, BATCH_VIEW is the
            minimum.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((group) => (
          <div
            key={group.title}
            className="space-y-3 rounded-lg border p-4 shadow-sm bg-card"
          >
            <h4 className="font-semibold text-sm tracking-tight">{group.title}</h4>
            <div className="space-y-2">
              {group.capabilities.map((cap, i) => (
                <div key={i} className="space-y-2">
                  {cap.view && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-${cap.view}`}
                        checked={value.includes(cap.view as PermissionCapability)}
                        onCheckedChange={() =>
                          togglePermission(cap.view as PermissionCapability)
                        }
                      />
                      <Label
                        htmlFor={`perm-${cap.view}`}
                        className={cn(
                          "text-sm cursor-pointer",
                          isImplied(cap.view) && "text-muted-foreground line-through",
                        )}
                      >
                        {cap.view.replace("_VIEW", " View").replace(/_/g, " ")}
                      </Label>
                      {isImplied(cap.view) && (
                        <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                          Implied
                        </span>
                      )}
                    </div>
                  )}
                  {cap.manage && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-${cap.manage}`}
                        checked={value.includes(cap.manage as PermissionCapability)}
                        onCheckedChange={() =>
                          togglePermission(cap.manage as PermissionCapability)
                        }
                      />
                      <Label
                        htmlFor={`perm-${cap.manage}`}
                        className={cn(
                          "text-sm cursor-pointer",
                          isImplied(cap.manage) && "text-muted-foreground line-through",
                        )}
                      >
                        {cap.manage.replace("_MANAGE", " Manage").replace(/_/g, " ")}
                      </Label>
                      {isImplied(cap.manage) && (
                        <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                          Implied
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
