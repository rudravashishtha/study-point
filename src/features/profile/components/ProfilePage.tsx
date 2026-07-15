"use client";

import { useState, useActionState, useEffect } from "react";

import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePhone, updateName } from "../actions";

interface ProfileUser {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
}

export function ProfilePage({ user }: { user: ProfileUser }) {
  const [editPhoneOpen, setEditPhoneOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [phoneState, phoneAction, phoneIsPending] = useActionState(updatePhone, { error: null, success: false });
  const [nameState, nameAction, nameIsPending] = useActionState(updateName, { error: null, success: false });

  // Close phone dialog on success
  useEffect(() => {
    if (phoneState.success) {
      setEditPhoneOpen(false);
    }
  }, [phoneState.success]);

  // Close name dialog on success
  useEffect(() => {
    if (nameState.success) {
      setEditNameOpen(false);
    }
  }, [nameState.success]);

  const formattedPhone = user.phone ? (parsePhoneNumberFromString(user.phone)?.formatInternational() ?? user.phone) : "Not set";

  return (
    <div className="max-w-4xl space-y-12 pb-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold font-heading">My Profile</h1>
      </div>

      {/* Avatar Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="size-20 rounded-full bg-surface-interactive border border-border/60 flex items-center justify-center font-bold text-2xl text-primary">
            {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : "AD"}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.fullName || "User"}</h2>
            <p className="text-sm text-muted-foreground">Profile picture support coming soon</p>
          </div>
        </div>
      </section>

      {/* Account Information Section */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold font-heading pb-2 border-b border-border/40">Account Information</h3>
        
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Name</Label>
            <div className="flex items-center gap-3">
              <p className="font-medium text-foreground">{user.fullName || "Not set"}</p>
              <Button variant="outline" size="sm" onClick={() => setEditNameOpen(true)} className="h-7 text-xs px-3">
                Edit
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
            <p className="font-medium text-foreground">{user.email || "Not set"}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</Label>
            <div className="flex items-center gap-3">
              <p className="font-medium text-foreground">{formattedPhone}</p>
              <Button variant="outline" size="sm" onClick={() => setEditPhoneOpen(true)} className="h-7 text-xs px-3">
                Edit
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Account Type</Label>
            <p className="font-medium text-foreground capitalize">{user.role.toLowerCase()}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Joined On</Label>
            <p className="font-medium text-foreground">
              {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="space-y-6 opacity-60 pointer-events-none">
        <h3 className="text-lg font-bold font-heading pb-2 border-b border-border/40 flex items-center gap-2">
          Future Preferences
          <span className="text-[10px] font-bold uppercase tracking-widest bg-surface-interactive px-2 py-0.5 rounded-full text-muted-foreground border border-border/50">
            Coming Soon
          </span>
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-xl border border-border/40 bg-surface">
            <h4 className="font-medium mb-1">Change Password</h4>
            <p className="text-sm text-muted-foreground">Update your account password.</p>
          </div>
          <div className="p-4 rounded-xl border border-border/40 bg-surface">
            <h4 className="font-medium mb-1">Notifications</h4>
            <p className="text-sm text-muted-foreground">Manage email and WhatsApp alerts.</p>
          </div>
          <div className="p-4 rounded-xl border border-border/40 bg-surface">
            <h4 className="font-medium mb-1">Security</h4>
            <p className="text-sm text-muted-foreground">Manage active sessions and 2FA.</p>
          </div>
          <div className="p-4 rounded-xl border border-border/40 bg-surface">
            <h4 className="font-medium mb-1">Preferences</h4>
            <p className="text-sm text-muted-foreground">Theme, language, and display settings.</p>
          </div>
        </div>
      </section>

      {/* Phone Edit Dialog */}
      <Dialog open={editPhoneOpen} onOpenChange={setEditPhoneOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Phone Number</DialogTitle>
            <DialogDescription>
              Please provide your full phone number including the country code (e.g., +91).
            </DialogDescription>
          </DialogHeader>
          <form action={phoneAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-muted-foreground sm:text-sm font-medium">+91</span>
                </div>
                <Input
                  id="phone"
                  name="phone"
                  className="pl-11"
                  placeholder="98765 43210"
                  defaultValue={user.phone ? user.phone.replace(/^\+91\s*/, "") : ""}
                />
              </div>
              {phoneState?.error && <p className="text-sm text-destructive font-medium">{phoneState.error}</p>}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={phoneIsPending}>
                {phoneIsPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Name Edit Dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Name</DialogTitle>
            <DialogDescription>
              Please enter your full name as you would like it to appear.
            </DialogDescription>
          </DialogHeader>
          <form action={nameAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="e.g. John Doe"
                defaultValue={user.fullName || ""}
              />
              {nameState?.error && <p className="text-sm text-destructive font-medium">{nameState.error}</p>}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={nameIsPending}>
                {nameIsPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
