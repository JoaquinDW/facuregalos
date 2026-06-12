"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface EditarCuentaTransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
  alias: string
  titular: string
  cbu: string
  banco: string
  onGuardado: (alias: string, titular: string, cbu: string, banco: string) => void
}

export function EditarCuentaTransferenciaModal({
  isOpen,
  onClose,
  alias,
  titular,
  cbu,
  banco,
  onGuardado,
}: EditarCuentaTransferenciaModalProps) {
  const [aliasValue, setAliasValue] = useState(alias)
  const [titularValue, setTitularValue] = useState(titular)
  const [cbuValue, setCbuValue] = useState(cbu)
  const [bancoValue, setBancoValue] = useState(banco)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!aliasValue.trim() || !titularValue.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El alias y el titular no pueden estar vacíos",
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/configuracion-transferencia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: aliasValue.trim(),
          titular: titularValue.trim(),
          cbu: cbuValue.trim(),
          banco: bancoValue.trim(),
        }),
      })

      if (!res.ok) throw new Error("Error al guardar")

      toast({
        title: "Cuenta actualizada",
        description: "Los datos de la cuenta de transferencia se actualizaron correctamente",
      })
      onGuardado(aliasValue.trim(), titularValue.trim(), cbuValue.trim(), bancoValue.trim())
      onClose()
    } catch (error) {
      console.error("Error actualizando cuenta de transferencia:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la cuenta. Intenta nuevamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card-dark border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Cuenta de Transferencia</DialogTitle>
          <DialogDescription className="text-gray-400">
            Cambia el alias y titular de la cuenta bancaria donde se reciben las transferencias
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alias" className="text-white">
              Alias
            </Label>
            <Input
              id="alias"
              value={aliasValue}
              onChange={(e) => setAliasValue(e.target.value)}
              placeholder="Ej: facuregalos"
              className="bg-gray-800 border-gray-600 text-white"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titular" className="text-white">
              Titular
            </Label>
            <Input
              id="titular"
              value={titularValue}
              onChange={(e) => setTitularValue(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="bg-gray-800 border-gray-600 text-white"
              maxLength={150}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cbu" className="text-white">
              CBU / CVU
            </Label>
            <Input
              id="cbu"
              value={cbuValue}
              onChange={(e) => setCbuValue(e.target.value)}
              placeholder="Ej: 0000003100010000000001"
              className="bg-gray-800 border-gray-600 text-white"
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banco" className="text-white">
              Banco
            </Label>
            <Input
              id="banco"
              value={bancoValue}
              onChange={(e) => setBancoValue(e.target.value)}
              placeholder="Ej: Banco Galicia"
              className="bg-gray-800 border-gray-600 text-white"
              maxLength={100}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !aliasValue.trim() || !titularValue.trim()}
              className="btn-neon"
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
