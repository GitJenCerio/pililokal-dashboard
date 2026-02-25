"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, UserPlus, Copy, Check } from "lucide-react";
import type { UserListItem } from "@/app/dashboard/admin/users/actions";
import {
  listUsersAction,
  createUserAction,
  updateUserRoleAction,
  toggleUserActiveAction,
  resetUserPasswordAction,
} from "@/app/dashboard/admin/users/actions";

const ROLE_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  EDITOR: "secondary",
  VIEWER: "outline",
};

export function UsersTable({ initialUsers }: { initialUsers: UserListItem[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tempPasswordOpen, setTempPasswordOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [tempPasswordEmail, setTempPasswordEmail] = useState("");
  const [inviteEmailError, setInviteEmailError] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [newRole, setNewRole] = useState<string>("VIEWER");
  const [loading, setLoading] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "VIEWER" });
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);

  const refreshUsers = async () => {
    const list = await listUsersAction();
    setUsers(list);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    const result = await createUserAction(inviteForm);
    if (result.error) {
      setInviteError(result.error);
      return;
    }
    if (result.tempPassword) {
      setTempPassword(result.tempPassword);
      setTempPasswordEmail(inviteForm.email);
      setTempPasswordOpen(true);
      setInviteEmailError(result.emailError ?? null);
      setInviteForm({ name: "", email: "", role: "VIEWER" });
      setInviteOpen(false);
      refreshUsers();
    }
  };

  const handleResetPassword = async (user: UserListItem) => {
    setLoading(user.id);
    const result = await resetUserPasswordAction(user.id);
    setLoading(null);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.tempPassword) {
      setTempPassword(result.tempPassword);
      setTempPasswordEmail(user.email);
      setInviteEmailError(null);
      setTempPasswordOpen(true);
    }
  };

  const handleToggleActive = async (user: UserListItem) => {
    setLoading(user.id);
    const result = await toggleUserActiveAction(user.id);
    setLoading(null);
    if (result.error) alert(result.error);
    else refreshUsers();
  };

  const handleRoleChange = (user: UserListItem) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const submitRoleChange = async () => {
    if (!selectedUser) return;
    setLoading(selectedUser.id);
    await updateUserRoleAction(selectedUser.id, newRole);
    setLoading(null);
    setRoleDialogOpen(false);
    setSelectedUser(null);
    refreshUsers();
  };

  const copyPassword = () => {
    void navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage team access and roles</CardDescription>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Last Login</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_COLORS[user.role] ?? "outline"}>{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? "success" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString(undefined, {
                            dateStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRoleChange(user)}>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                            {user.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            {loading === user.id ? "..." : "Reset Password"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Create an account. A temporary password will be generated.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) => setInviteForm((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger id="invite-role" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Temp password dialog */}
      <Dialog open={tempPasswordOpen} onOpenChange={(open) => { setTempPasswordOpen(open); if (!open) setInviteEmailError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary Password</DialogTitle>
            <DialogDescription>
              Share this password with <strong>{tempPasswordEmail}</strong>. They should change it after first login.
              {inviteEmailError && (
                <span className="mt-2 block text-amber-600 dark:text-amber-400">Invite email could not be sent: {inviteEmailError}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3 font-mono text-sm">
            <span className="flex-1 break-all">{tempPassword}</span>
            <Button variant="outline" size="sm" onClick={copyPassword}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>Set role for {selectedUser.name} ({selectedUser.email})</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitRoleChange}>Save</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
