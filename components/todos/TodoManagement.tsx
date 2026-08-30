"use client";

import React, { useState, useEffect } from "react";
import { Todo } from "@/types/todo";
import { Member } from "@/types/member";
import {
  subscribeToTodos,
  createTodo,
  toggleTodoCompleted,
  deleteTodo,
} from "@/lib/services/todoService";
import { getActiveMembers } from "@/lib/services/memberService";
import { useAuth } from "@/lib/firebase/authContext";
import {
  CheckSquare,
  Plus,
  Send,
  Trash2,
  Clock,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export const TodoManagement: React.FC = () => {
  const { user, memberProfile, isPresident, isDomainHead, hasPermission } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Personal Task
  const [newPersonalTask, setNewPersonalTask] = useState("");
  const [personalDue, setPersonalDue] = useState("Due tomorrow");
  const [isAddingPersonal, setIsAddingPersonal] = useState(false);

  // Admin Assign Task Form
  const [selectedMemberUid, setSelectedMemberUid] = useState("");
  const [assignedTaskText, setAssignedTaskText] = useState("");
  const [assignedDueDate, setAssignedDueDate] = useState("Due in 3 days");
  const [isAssigning, setIsAssigning] = useState(false);

  const canAssign = isPresident || isDomainHead() || hasPermission("assignTodos");
  const uid = memberProfile?.uid || user?.uid || "";

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTodos(
      uid,
      isPresident,
      (list) => {
        setTodos(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load todos from Firestore.");
        setLoading(false);
      }
    );

    if (canAssign) {
      getActiveMembers()
        .then((members) => setActiveMembers(members))
        .catch((e) => console.warn("Could not load active members for assigning todos:", e));
    }

    return () => unsubscribe();
  }, [uid, isPresident, canAssign]);

  const handleToggle = async (todoId: string) => {
    try {
      await toggleTodoCompleted(todoId, uid, memberProfile?.name || "Member");
    } catch (err: any) {
      alert("Error updating To-Do: " + (err.message || "Failed"));
    }
  };

  const handleDelete = async (todoId: string) => {
    try {
      await deleteTodo(todoId);
    } catch (err: any) {
      alert("Error deleting To-Do: " + (err.message || "Failed"));
    }
  };

  const handleAddPersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonalTask.trim()) return;

    try {
      await createTodo({
        text: newPersonalTask.trim(),
        assignedTo: uid,
        assignedToName: memberProfile?.name || "Self",
        createdBy: uid,
        createdByName: memberProfile?.name || "Self",
        dueDate: personalDue,
      });

      setNewPersonalTask("");
      setIsAddingPersonal(false);
    } catch (err: any) {
      alert("Error saving personal task: " + (err.message || "Failed"));
    }
  };

  const handleAssignTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberUid || !assignedTaskText.trim()) return;

    const targetMember = activeMembers.find((m) => m.uid === selectedMemberUid);
    setIsAssigning(true);

    try {
      await createTodo({
        text: assignedTaskText.trim(),
        assignedTo: selectedMemberUid,
        assignedToName: targetMember?.name || "Member",
        createdBy: uid,
        createdByName: memberProfile?.name || "President",
        dueDate: assignedDueDate,
      });

      setAssignedTaskText("");
      setSelectedMemberUid("");
    } catch (err: any) {
      alert("Error assigning To-Do: " + (err.message || "Failed"));
    } finally {
      setIsAssigning(false);
    }
  };

  const pendingTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <p className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20 inline-block">
          Personal & Assigned Workflow
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
          To-Do Workspace
        </h1>
        <p className="font-body text-sm text-on-surface-variant">
          Track your deliverables, complete action items, and collaborate on club milestones.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3 max-w-5xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Your Tasks, Right Admin Assignment */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Your Tasks List */}
        <section className={`glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 ${canAssign ? "md:col-span-7" : "md:col-span-12"}`}>
          <div>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-5 h-5 text-primary" />
                <h2 className="font-display text-2xl font-bold text-white">Your Tasks</h2>
              </div>
              <span className="bg-primary/10 text-primary font-label-caps text-xs px-3 py-1 rounded-full border border-primary/20">
                {pendingTodos.length} Pending
              </span>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10 text-on-surface-variant text-xs">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p>Loading tasks from Firestore...</p>
                </div>
              ) : todos.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant text-xs">
                  <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-2" />
                  <p>You have no active tasks. Click &apos;+ Add Personal Task&apos; below to create one.</p>
                </div>
              ) : (
                <>
                  {/* Pending Tasks */}
                  {pendingTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[#111111] hover:bg-white/5 border border-white/10 hover:border-primary/40 transition-all group"
                    >
                      <label className="flex items-start gap-3 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggle(todo.id)}
                          className="mt-0.5 w-4 h-4 rounded border-white/30 text-primary focus:ring-primary bg-[#050505] cursor-pointer"
                        />
                        <div>
                          <p className="font-body text-xs font-medium text-white group-hover:text-primary transition-colors">
                            {todo.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#859491]">
                            {todo.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-secondary" />
                                {todo.dueDate}
                              </span>
                            )}
                            {todo.createdByName && todo.createdBy !== uid && (
                              <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px]">
                                Assigned by {todo.createdByName}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>

                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Completed Tasks */}
                  {completedTodos.length > 0 && (
                    <div className="pt-4 space-y-2">
                      <p className="text-[11px] font-label-caps text-[#859491] uppercase">
                        Completed ({completedTodos.length})
                      </p>
                      {completedTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-[#0e1514] opacity-60 hover:opacity-100 transition-all border border-transparent hover:border-white/10"
                        >
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => handleToggle(todo.id)}
                              className="w-4 h-4 rounded border-white/30 text-primary bg-[#050505] cursor-pointer"
                            />
                            <span className="text-xs text-[#859491] line-through">
                              {todo.text}
                            </span>
                          </label>

                          <button
                            onClick={() => handleDelete(todo.id)}
                            className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Add Personal Task Form */}
          <div className="pt-6 mt-6 border-t border-white/10">
            {isAddingPersonal ? (
              <form onSubmit={handleAddPersonalSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPersonalTask}
                  onChange={(e) => setNewPersonalTask(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full form-input px-3.5 py-2 text-xs text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={personalDue}
                    onChange={(e) => setPersonalDue(e.target.value)}
                    placeholder="Due date (e.g. Due tomorrow)"
                    className="flex-1 form-input px-3.5 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingPersonal(false)}
                    className="px-3 py-1.5 rounded-full border border-white/20 text-xs text-on-surface-variant cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full bg-primary text-black font-bold text-xs cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingPersonal(true)}
                className="w-full py-3 rounded-2xl border border-dashed border-white/20 text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Personal Task</span>
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Admin / Authorized Task Assignment */}
        {canAssign && (
          <section className="md:col-span-5 glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-secondary/30 bg-secondary/5">
            <div>
              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/10">
                <ShieldCheck className="w-5 h-5 text-secondary" />
                <h2 className="font-display text-2xl font-bold text-white">Assign Task</h2>
              </div>

              <form onSubmit={handleAssignTaskSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant uppercase mb-1.5">
                    Select Member
                  </label>
                  <select
                    required
                    value={selectedMemberUid}
                    onChange={(e) => setSelectedMemberUid(e.target.value)}
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white bg-[#111111]"
                  >
                    <option value="" disabled>
                      Choose a collective member...
                    </option>
                    {activeMembers.map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.name} ({m.domain} • {m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant uppercase mb-1.5">
                    Task Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={assignedTaskText}
                    onChange={(e) => setAssignedTaskText(e.target.value)}
                    placeholder="e.g. Design wireframes for mobile breakpoint and review with Tech domain..."
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant uppercase mb-1.5">
                    Due Timeline
                  </label>
                  <input
                    type="text"
                    value={assignedDueDate}
                    onChange={(e) => setAssignedDueDate(e.target.value)}
                    placeholder="e.g. Due Friday, 11:59 PM"
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="w-full py-3 rounded-full bg-secondary text-black font-bold text-xs hover:shadow-[0_0_25px_rgba(210,187,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAssigning ? "Assigning..." : "Assign Task to Member"}</span>
                  </button>
                </div>
              </form>
            </div>

            <p className="text-[10px] text-on-surface-variant text-center pt-4 border-t border-white/10 mt-6">
              Assigned tasks will appear on the member&apos;s personal dashboard with an automated notification.
            </p>
          </section>
        )}
      </div>
    </div>
  );
};
