export interface Todo {
  id: string;
  text: string;
  assignedTo: string; // Firebase UID
  assignedToName?: string;
  createdBy: string; // Firebase UID
  createdByName?: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}
