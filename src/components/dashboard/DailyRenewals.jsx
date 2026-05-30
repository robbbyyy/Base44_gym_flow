import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Trash2, Euro, Pencil, X, Check, CreditCard, Banknote } from 'lucide-react';
import moment from 'moment';

const EMPTY = { last_name: '', first_name: '', member_code: '', quota_versata: '', quota_iscrizione: '', payment_method: 'contanti', notes: '' };

function RenewalForm({ initial = EMPTY, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <tr className="bg-primary/5">
      <td className="px-3 py-2">
        <input className="w-full text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary"
          placeholder="Cognome *" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <input className="w-full text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary"
          placeholder="Nome *" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <input className="w-full text-xs border border-input rounded-md px-2 py-1.5 bg-background font-mono focus:outline-none focus:border-primary"
          placeholder="N° tessera *" value={form.member_code} onChange={e => set('member_code', e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <input type="number" min="0" step="0.01"
          className="w-full text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary"
          placeholder="€ rinnovo" value={form.quota_versata} onChange={e => set('quota_versata', e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <input type="number" min="0" step="0.01"
          className="w-full text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary"
          placeholder="€ iscrizione" value={form.quota_iscrizione} onChange={e => set('quota_iscrizione', e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <select
          value={form.payment_method}
          onChange={e => set('payment_method', e.target.value)}
          className="w-full text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary"
        >
          <option value="contanti">Contanti</option>
          <option value="pos">POS</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <input className="w-full text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary"
          placeholder="Note" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1.5">
          <Button size="icon" className="w-7 h-7" disabled={saving || !form.last_name || !form.first_name || !form.member_code}
            onClick={() => onSave({ ...form, quota_versata: parseFloat(form.quota_versata) || 0, quota_iscrizione: parseFloat(form.quota_iscrizione) || 0, payment_method: form.payment_method || 'contanti', renewal_date: moment().format('YYYY-MM-DD') })}>
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={onCancel}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function DailyRenewals() {
  const queryClient = useQueryClient();
  const today = moment().format('YYYY-MM-DD');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: renewals = [], isLoading } = useQuery({
    queryKey: ['daily-renewals', today],
    queryFn: () => base44.entities.DailyRenewal.filter({ renewal_date: today }, '-created_date', 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.DailyRenewal.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['daily-renewals'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyRenewal.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['daily-renewals'] }); setEditingId(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.DailyRenewal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-renewals'] }),
  });

  const totalRinnovi = renewals.reduce((s, r) => s + (r.quota_versata || 0), 0);
  const totalIscrizioni = renewals.reduce((s, r) => s + (r.quota_iscrizione || 0), 0);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <RefreshCw className="w-5 h-5" />
              Rinnovi del Giorno — {moment().format('D MMMM YYYY')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {renewals.length} rinnovi · Totale rinnovi: <strong>€{totalRinnovi.toFixed(2)}</strong> · Iscrizioni: <strong>€{totalIscrizioni.toFixed(2)}</strong>
            </p>
          </div>
          <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Aggiungi
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '520px' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Cognome</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Nome</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">N° Tessera</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Quota Rinnovo</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Quota Iscrizione</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Pagamento</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Note</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {showForm && !editingId && (
                <RenewalForm
                  onSave={(data) => createMut.mutate(data)}
                  onCancel={() => setShowForm(false)}
                  saving={createMut.isPending}
                />
              )}
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Caricamento...</td></tr>
              )}
              {!isLoading && renewals.length === 0 && !showForm && (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Nessun rinnovo registrato oggi.</td></tr>
              )}
              {renewals.map(r => (
                editingId === r.id ? (
                  <RenewalForm
                    key={r.id}
                    initial={{ ...r, quota_versata: r.quota_versata ?? '', quota_iscrizione: r.quota_iscrizione ?? '' }}
                    onSave={(data) => updateMut.mutate({ id: r.id, data })}
                    onCancel={() => setEditingId(null)}
                    saving={updateMut.isPending}
                  />
                ) : (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{r.last_name}</td>
                    <td className="px-3 py-3 text-foreground">{r.first_name}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{r.member_code}</td>
                    <td className="px-3 py-3">
                      {r.quota_versata ? (
                        <span className="flex items-center gap-1 font-semibold text-accent">
                          <Euro className="w-3.5 h-3.5" />{Number(r.quota_versata).toFixed(2)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {r.quota_iscrizione ? (
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <Euro className="w-3.5 h-3.5" />{Number(r.quota_iscrizione).toFixed(2)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {r.payment_method === 'pos' ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5 w-fit">
                          <CreditCard className="w-3 h-3" /> POS
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-accent bg-accent/10 rounded-full px-2.5 py-0.5 w-fit">
                          <Banknote className="w-3 h-3" /> Contanti
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{r.notes || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingId(r.id); setShowForm(false); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMut.mutate(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
            {renewals.length > 0 && (
              <tfoot>
                <tr className="bg-muted/60 border-t-2 border-border">
                  <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                    TOTALI · {renewals.filter(r => r.payment_method === 'pos').length} POS · {renewals.filter(r => r.payment_method !== 'pos').length} Contanti
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1 font-bold text-accent text-sm">
                      <Euro className="w-3.5 h-3.5" />{totalRinnovi.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1 font-bold text-primary text-sm">
                      <Euro className="w-3.5 h-3.5" />{totalIscrizioni.toFixed(2)}
                    </span>
                  </td>
                  <td colSpan={2} className="px-3 py-2.5 text-xs font-bold text-foreground">
                    Totale incassato: €{(totalRinnovi + totalIscrizioni).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}