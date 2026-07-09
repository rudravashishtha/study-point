"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Download, ExternalLink, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StudentMaterialList({
  materials,
  chapters,
  topics,
}: {
  materials: any[];
  chapters: any[];
  topics: any[];
}) {
  const [search, setSearch] = useState("");

  const filtered = materials.filter((m) => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    // We only display published materials here per requirements
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No materials found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const chapter = chapters.find((c) => c.id === m.chapterId);
                const topic = topics.find((t) => t.id === m.topicId);

                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{m.title}</span>
                        {m.description && (
                          <span className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-sm">
                            {m.description}
                          </span>
                        )}
                        {m.resourceType === "TEXT" && m.textContent && (
                          <div className="mt-2 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap break-words max-w-md">
                            {m.textContent}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {chapter ? (
                          <div className="font-medium">{chapter.name}</div>
                        ) : null}
                        {topic ? (
                          <div className="text-muted-foreground">{topic.name}</div>
                        ) : null}
                        {!chapter && !topic && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.resourceType}</Badge>
                    </TableCell>
                    <TableCell>
                      {m.publishedAt
                        ? format(new Date(m.publishedAt), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(m.resourceType === "DOCUMENT" ||
                          m.resourceType === "PRESENTATION" ||
                          m.resourceType === "IMAGE") &&
                          m.fileAssetId && (
                            <a
                              href={`/api/materials/${m.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              title="Download"
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })}
                            >
                              <Download className="mr-2 h-4 w-4" /> Download
                            </a>
                          )}
                        {m.resourceType === "LINK" && m.externalLinkUrl && (
                          <a
                            href={m.externalLinkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                            title="Open Link"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" /> Open
                          </a>
                        )}
                        {m.resourceType === "TEXT" && (
                          <span className="inline-flex items-center text-sm text-muted-foreground">
                            <FileText className="mr-2 h-4 w-4" /> Read
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
