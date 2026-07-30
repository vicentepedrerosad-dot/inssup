"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export function ChangePasswordModal({
  open,
  onClose,
  forced = false,
}: {
  open: boolean;
  onClose: () => void;
  forced?: boolean;
}) {
  const { changeMyPassword } = useAuth();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (newPw.length < 6) return setError("La nueva contraseña debe tener al menos 6 caracteres.");
    if (newPw !== confirm) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    const res = await changeMyPassword(oldPw, newPw);
    setLoading(false);
    if (res.error) return setError(res.error);
    toast.success("Contraseña actualizada");
    setOldPw(""); setNewPw(""); setConfirm("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={forced ? () => {} : onClose}
      title={forced ? "Cambia tu contraseña" : "Cambiar contraseña"}
      subtitle={forced ? "Por seguridad, define una contraseña nueva para continuar." : undefined}
      size="max-w-md"
      footer={
        <>
          {!forced && (
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          )}
          <Button size="sm" onClick={submit} disabled={loading}>
            <KeyRound className="size-4" /> Guardar contraseña
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Contraseña actual</label>
          <Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="La temporal o la actual" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nueva contraseña</label>
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Repetir nueva contraseña</label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
