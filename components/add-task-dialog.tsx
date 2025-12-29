"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tag, Plus, Briefcase, HeartPulse, User, Target } from "lucide-react";
import { toast } from "sonner";

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  canAddCategory?: boolean;
  selectedDate?: string | null;
  onSuccess?: () => void;
  task?: { id: string; title: string; category?: string | null };
};

export default function AddTaskDialog({
  open,
  onOpenChange,
  categories,
  canAddCategory = false,
  selectedDate = null,
  onSuccess,
  task,
}: AddTaskDialogProps) {
  const isEdit = Boolean(task?.id);
  const [newTitle, setNewTitle] = useState(task?.title ?? "");
  const [newCategory, setNewCategory] = useState(task?.category ?? categories?.[0] ?? "");
  const [addingCategory, setAddingCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [localCategories, setLocalCategories] = useState<string[]>(categories || []);

  // Keep local categories in sync and reset fields when opening dialog or changing task
  useEffect(() => {
    setLocalCategories(categories || []);
  }, [categories, open]);

  useEffect(() => {
    if (open) {
      setNewTitle(task?.title ?? "");
      setNewCategory(task?.category ?? (localCategories?.[0] ?? ""));
    }
  }, [task, open, localCategories]);

  const getCategoryIcon = (c: string) => {
    const key = c.toLowerCase();
    if (key === "work") return Briefcase;
    if (key === "health") return HeartPulse;
    if (key === "personal") return User;
    if (key === "goal") return Target;
    return Tag;
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(
        isEdit ? `/api/tasks/${task!.id}` : "/api/tasks",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? {
                  title: newTitle.trim(),
                  category: newCategory || null,
                }
              : {
                  title: newTitle.trim(),
                  category: newCategory || null,
                  done: false,
                  createdAt: selectedDate ? new Date(selectedDate).toISOString() : undefined,
                }
          ),
        }
      );
      if (!res.ok) throw new Error("Failed to create task");
      toast.success(isEdit ? "Task updated" : "Task created");
      if (!isEdit) setNewTitle("");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error creating task"
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleAddCategory = async () => {
    const name = addingCategory.trim();
    if (!name || !canAddCategory) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      toast.success("Category added");
      setAddingCategory("");
      // Immediately reflect newly added category in the list and select it
      setLocalCategories((prev) => Array.from(new Set([...(prev || []), name])));
      setNewCategory(name);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error adding category"
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the task details"
              : selectedDate
              ? `Create for ${new Date(selectedDate).toLocaleDateString()}`
              : "Create a new task"}
          </DialogDescription>
        </DialogHeader>

        {/* Category section at top with icon and add-new */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Tag className="size-4" />
              <span>Category</span>
            </div>
            {canAddCategory && (
              <div className="flex items-center gap-2">
                <input
                  className="w-40 rounded-md border border-muted-foreground/20 bg-background px-3 py-1.5 text-xs"
                  placeholder="New category"
                  value={addingCategory}
                  onChange={(e) => setAddingCategory(e.target.value)}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!addingCategory.trim()}
                  onClick={handleAddCategory}
                >
                  <Plus className="size-3.5 me-1" /> Add
                </Button>
              </div>
            )}
          </div>

          <ToggleGroup
            type="single"
            value={newCategory}
            onValueChange={(v) => setNewCategory(v)}
            variant="default"
            size="sm"
            className="flex flex-wrap gap-0"
          >
            {localCategories?.map((c) => {
              const Icon = getCategoryIcon(c);
              return (
                <ToggleGroupItem
                  key={c}
                  value={c}
                  className="rounded-[4px] px-[5px] py-[5px] mr-[5px] mb-[5px] flex items-center gap-1.5 border border-primary bg-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Icon className="size-3.5" />
                  <span className="capitalize">{c}</span>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>

        {/* Title as textarea */}
        <div className="space-y-2">
          <textarea
            className="w-full rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm min-h-24"
            placeholder="Task details"
            rows={3}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div className="flex justify-end">
            <Button disabled={!newTitle.trim() || creating} onClick={handleCreate}>
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}