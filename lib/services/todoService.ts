import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { Todo } from "@/types/todo";
import { logActivity } from "./activityService";
import { sendNotification } from "./notificationService";

/**
 * Fetch todos from Firestore
 */
export async function getTodos(userUid?: string, isAdmin = false): Promise<Todo[]> {
  try {
    const colRef = collection(db, "todos");
    let q = colRef;
    if (userUid && !isAdmin) {
      q = query(colRef, where("assignedTo", "==", userUid)) as any;
    }
    const snapshot = await getDocs(q);
    const list: Todo[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as Todo), id: d.id });
    });
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err: any) {
    console.error("Firestore getTodos error:", err);
    throw new Error(err.message || "Failed to load todos from Firestore.");
  }
}

/**
 * Real-time listener for todos
 */
export function subscribeToTodos(
  userUid?: string,
  isAdmin = false,
  callback?: (todos: Todo[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, "todos");
  let q = colRef;
  if (userUid && !isAdmin) {
    q = query(colRef, where("assignedTo", "==", userUid)) as any;
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Todo[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as Todo), id: d.id });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (callback) callback(list);
    },
    (err) => {
      console.error("subscribeToTodos onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Create a new To-Do in Firestore
 */
export async function createTodo(data: {
  text: string;
  assignedTo: string;
  assignedToName?: string;
  createdBy: string;
  createdByName?: string;
  dueDate?: string;
}): Promise<Todo> {
  const id = "todo_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  const newTodo: Todo = {
    id,
    text: data.text.trim(),
    assignedTo: data.assignedTo,
    assignedToName: data.assignedToName || "Member",
    createdBy: data.createdBy,
    createdByName: data.createdByName || "Admin",
    completed: false,
    dueDate: data.dueDate || "Due this week",
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, "todos", id);
    await setDoc(docRef, newTodo);

    const isAssignedToOther = data.assignedTo !== data.createdBy;

    try {
      await logActivity({
        action: "To-Do assigned",
        performedBy: data.createdBy,
        performedByName: data.createdByName,
        target: data.assignedToName || "Self",
        details: `Task: "${newTodo.text}"`,
      });
    } catch (e) {
      console.warn("Could not log activity for todo:", e);
    }

    if (isAssignedToOther) {
      try {
        await sendNotification({
          recipientUid: data.assignedTo,
          title: "New To-Do Assigned",
          message: `Admin assigned you a new To-Do: "${newTodo.text}"`,
          type: "todo",
          link: "/dashboard/todos",
        });
      } catch (e) {
        console.warn("Could not send todo notification:", e);
      }
    }

    return newTodo;
  } catch (err: any) {
    console.error("Firestore createTodo error:", err);
    throw new Error(err.message || "Failed to create To-Do in Firestore.");
  }
}

/**
 * Toggle To-Do completion status in Firestore
 */
export async function toggleTodoCompleted(
  id: string,
  userUid: string,
  userName: string
): Promise<Todo | null> {
  try {
    const docRef = doc(db, "todos", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const current = snap.data() as Todo;
    const newCompleted = !current.completed;
    const updates: Partial<Todo> = {
      completed: newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : undefined,
    };

    await updateDoc(docRef, updates);

    const updatedTodo: Todo = {
      ...current,
      ...updates,
      id: snap.id,
    };

    if (newCompleted) {
      try {
        await logActivity({
          action: "To-Do completed",
          performedBy: userUid,
          performedByName: userName,
          target: updatedTodo.text,
          details: `Completed task: "${updatedTodo.text}"`,
        });
      } catch (e) {
        console.warn("Could not log activity for completed todo:", e);
      }
    }

    return updatedTodo;
  } catch (err: any) {
    console.error("Firestore toggleTodoCompleted error:", err);
    throw new Error(err.message || "Failed to update To-Do in Firestore.");
  }
}

/**
 * Delete a To-Do from Firestore
 */
export async function deleteTodo(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, "todos", id);
    await deleteDoc(docRef);
    return true;
  } catch (err: any) {
    console.error("Firestore deleteTodo error:", err);
    throw new Error(err.message || "Failed to delete To-Do from Firestore.");
  }
}
