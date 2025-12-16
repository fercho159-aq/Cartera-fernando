"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    Plus,
    Users,
    Share2,
    Trash2,
    Copy,
    Check,
    Crown,
    UserPlus,
    LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccountStore } from "@/lib/account-store";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AccountWithMeta {
    id: number;
    name: string;
    description: string | null;
    ownerId: number;
    inviteCode: string | null;
    createdAt: Date;
    isOwner: boolean;
    role?: string;
    ownerName?: string | null;
    ownerEmail?: string | null;
}

interface Member {
    id: number;
    role: string;
    joinedAt: Date;
    userId: number;
    userName: string | null;
    userEmail: string | null;
}

export default function AccountsPage() {
    const { accounts, setAccounts, addAccount, removeAccount } = useAccountStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isJoinSheetOpen, setIsJoinSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<AccountWithMeta | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; account: AccountWithMeta | null }>({
        open: false,
        account: null,
    });

    // Form states
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [joinError, setJoinError] = useState("");

    const fetchAccounts = useCallback(async () => {
        try {
            const response = await fetch("/api/accounts");
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error("Error al cargar cuentas:", error);
        } finally {
            setIsLoading(false);
        }
    }, [setAccounts]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });

            if (response.ok) {
                const newAccount = await response.json();
                addAccount({ ...newAccount, isOwner: true });
                setName("");
                setDescription("");
                setIsSheetOpen(false);
            }
        } catch (error) {
            console.error("Error al crear cuenta:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode) return;

        setIsSubmitting(true);
        setJoinError("");
        try {
            const response = await fetch("/api/accounts/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            });

            const data = await response.json();

            if (response.ok) {
                await fetchAccounts();
                setInviteCode("");
                setIsJoinSheetOpen(false);
            } else {
                setJoinError(data.error || "Error al unirse");
            }
        } catch (error) {
            console.error("Error al unirse a cuenta:", error);
            setJoinError("Error de conexión");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async (account: AccountWithMeta) => {
        try {
            const response = await fetch(`/api/accounts/${account.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                removeAccount(account.id);
            }
        } catch (error) {
            console.error("Error al eliminar cuenta:", error);
        }
        setConfirmDialog({ open: false, account: null });
    };

    const handleViewMembers = async (account: AccountWithMeta) => {
        setSelectedAccount(account);
        setIsMembersOpen(true);

        try {
            const response = await fetch(`/api/accounts/${account.id}/members`);
            if (response.ok) {
                const data = await response.json();
                setMembers(data);
            }
        } catch (error) {
            console.error("Error al cargar miembros:", error);
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="min-h-screen px-4 pt-2 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Cuentas Compartidas</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Comparte tus finanzas con otros
                </p>
            </header>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                    onClick={() => setIsSheetOpen(true)}
                    className="h-14 gradient-primary text-base font-semibold"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Cuenta
                </Button>
                <Button
                    onClick={() => setIsJoinSheetOpen(true)}
                    variant="outline"
                    className="h-14 text-base font-semibold"
                >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Unirse
                </Button>
            </div>

            {/* Lista de Cuentas */}
            {accounts.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                        Sin cuentas compartidas
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Crea una cuenta o únete con un código
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map((account) => (
                        <Card
                            key={account.id}
                            className="p-4 border-0 bg-card"
                        >
                            <div className="flex items-start gap-3">
                                {/* Icono */}
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        account.isOwner
                                            ? "bg-primary/20 text-primary"
                                            : "bg-chart-2/20 text-chart-2"
                                    )}
                                >
                                    {account.isOwner ? (
                                        <Crown className="w-6 h-6" />
                                    ) : (
                                        <Users className="w-6 h-6" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{account.name}</h3>
                                    {account.description && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {account.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full",
                                            account.isOwner
                                                ? "bg-primary/10 text-primary"
                                                : "bg-muted"
                                        )}>
                                            {account.isOwner ? "Dueño" : "Miembro"}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {format(new Date(account.createdAt), "d MMM yyyy", { locale: es })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleViewMembers(account)}
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Miembros
                                </Button>
                                {account.isOwner && account.inviteCode && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleCopyCode(account.inviteCode!)}
                                    >
                                        {copiedCode ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2 text-green-500" />
                                                Copiado
                                            </>
                                        ) : (
                                            <>
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Código
                                            </>
                                        )}
                                    </Button>
                                )}
                                {account.isOwner && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() => setConfirmDialog({ open: true, account })}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Sheet para crear cuenta */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl px-6 pb-8">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-xl">Crear Cuenta Compartida</SheetTitle>
                    </SheetHeader>

                    <form onSubmit={handleCreateAccount} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-muted-foreground">
                                Nombre de la cuenta
                            </Label>
                            <Input
                                id="name"
                                placeholder="Ej: Gastos del hogar"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-14 text-lg bg-muted border-0 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-muted-foreground">
                                Descripción (opcional)
                            </Label>
                            <Input
                                id="description"
                                placeholder="¿Para qué es esta cuenta?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-14 text-lg bg-muted border-0 rounded-xl"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting || !name}
                            className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Crear Cuenta"
                            )}
                        </Button>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Sheet para unirse */}
            <Sheet open={isJoinSheetOpen} onOpenChange={setIsJoinSheetOpen}>
                <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl px-6 pb-8">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-xl">Unirse a Cuenta</SheetTitle>
                    </SheetHeader>

                    <form onSubmit={handleJoinAccount} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="inviteCode" className="text-muted-foreground">
                                Código de invitación
                            </Label>
                            <Input
                                id="inviteCode"
                                placeholder="XXXXXXXX"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                className="h-16 text-2xl text-center font-mono bg-muted border-0 rounded-xl tracking-widest"
                                maxLength={8}
                                required
                            />
                            {joinError && (
                                <p className="text-sm text-destructive">{joinError}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting || inviteCode.length < 8}
                            className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Unirse"
                            )}
                        </Button>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Dialog de miembros */}
            <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
                <DialogContent className="max-w-[90vw] rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Miembros de {selectedAccount?.name}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedAccount?.isOwner && selectedAccount?.inviteCode && (
                                <div className="mt-2 p-3 bg-muted rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Código de invitación:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-lg font-mono font-bold tracking-widest">
                                            {selectedAccount.inviteCode}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopyCode(selectedAccount.inviteCode!)}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    {(member.userName || member.userEmail)?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {member.userName || member.userEmail}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {member.role === 'owner' ? '👑 Dueño' :
                                            member.role === 'admin' ? '⭐ Admin' : 'Miembro'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmación para eliminar */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, account: null })}>
                <DialogContent className="max-w-[90vw] rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar cuenta?</DialogTitle>
                        <DialogDescription>
                            Se eliminará permanentemente la cuenta{" "}
                            <span className="font-medium text-foreground">
                                {confirmDialog.account?.name}
                            </span>{" "}
                            y todos los datos asociados. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 sm:flex-row">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setConfirmDialog({ open: false, account: null })}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => confirmDialog.account && handleDeleteAccount(confirmDialog.account)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
