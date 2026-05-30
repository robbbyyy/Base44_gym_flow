import { useState } from 'react';
import moment from 'moment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, X, Upload, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SUBSCRIPTION_TYPES = [
  { value: 'giornaliero', label: 'Giornaliero' },
  { value: 'mensile', label: 'Mensile' },
  { value: 'trimestrale', label: 'Trimestrale' },
  { value: 'semestrale', label: 'Semestrale' },
  { value: 'annuale', label: 'Annuale' },
];

const DISCIPLINES = [
  'Fitness', 'Pilates', 'Functional', 'JuJitsu', 'Difesa Personale', 'Altro'
];

export default function MemberForm({ member, open, onClose, onSave, nextRegistrationNumber }) {
  const [form, setForm] = useState(member || {
    first_name: '', last_name: '', email: '', phone: '',
    birth_date: '', tax_code: '', address: '', member_code: '',
    registration_number: nextRegistrationNumber || '',
    discipline: '',
    subscription_type: 'mensile', subscription_start: '', subscription_end: '',
    status: 'attivo', medical_cert_expiry: '', notes: '', photo_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

const SUBSCRIPTION_DURATIONS = {
    giornaliero: 0, mensile: 1, trimestrale: 3, semestrale: 6, annuale: 12,
  };

  const calcEnd = (start, type) => {
    if (!start) return '';
    const months = SUBSCRIPTION_DURATIONS[type];
    if (months == null) return '';
    if (months === 0) return moment(start).add(1, 'day').format('YYYY-MM-DD');
    return moment(start).add(months, 'months').format('YYYY-MM-DD');
  };

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'subscription_start' || field === 'subscription_type') {
        const start = field === 'subscription_start' ? value : prev.subscription_start;
        const type = field === 'subscription_type' ? value : prev.subscription_type;
        if (start && type) {
          updated.subscription_end = calcEnd(start, type);
        }
      }
      return updated;
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, photo_url: file_url }));
    setUploadingPhoto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? 'Modifica Iscritto' : 'Nuovo Iscritto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Foto */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {form.photo_url ? (
                <img src={form.photo_url} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Foto Tessera</Label>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingPhoto ? 'Caricamento...' : 'Carica foto'}
                  </span>
                </Button>
              </label>
              {form.photo_url && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => handleChange('photo_url', '')}>
                  Rimuovi
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Cognome *</Label>
              <Input value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Codice Tessera *</Label>
              <Input value={form.member_code} onChange={e => handleChange('member_code', e.target.value)} required placeholder="Es: GYM001" />
            </div>
            <div className="space-y-2">
              <Label>Numero d'Iscrizione</Label>
              <Input
                value={form.registration_number || ''}
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed font-mono"
                placeholder="Assegnato automaticamente"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Disciplina</Label>
              <Select value={form.discipline} onValueChange={v => handleChange('discipline', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona disciplina..." /></SelectTrigger>
                <SelectContent>
                  {DISCIPLINES.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Codice Fiscale</Label>
              <Input value={form.tax_code} onChange={e => handleChange('tax_code', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data di Nascita</Label>
              <Input type="date" value={form.birth_date} onChange={e => handleChange('birth_date', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Indirizzo</Label>
              <Input value={form.address} onChange={e => handleChange('address', e.target.value)} />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-sm text-foreground mb-4">Abbonamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Abbonamento</Label>
                <Select value={form.subscription_type} onValueChange={v => handleChange('subscription_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stato</Label>
                <Select value={form.status} onValueChange={v => handleChange('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attivo">Attivo</SelectItem>
                    <SelectItem value="scaduto">Scaduto</SelectItem>
                    <SelectItem value="sospeso">Sospeso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inizio Abbonamento</Label>
                <Input type="date" value={form.subscription_start} onChange={e => handleChange('subscription_start', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Scadenza Abbonamento</Label>
                <Input type="date" value={form.subscription_end} onChange={e => handleChange('subscription_end', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Scadenza Certificato Medico</Label>
                <Input type="date" value={form.medical_cert_expiry} onChange={e => handleChange('medical_cert_expiry', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" /> Annulla
            </Button>
            <Button type="submit" disabled={saving || uploadingPhoto}>
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}