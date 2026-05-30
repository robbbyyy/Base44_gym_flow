import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Send, ImagePlus, X, Loader2, CheckCircle2, Type, Palette, Lock } from 'lucide-react';

const FONTS = [
  { label: 'Inter (default)', value: 'Inter' },
  { label: 'Georgia (serif)', value: 'Georgia' },
  { label: 'Courier New (mono)', value: 'Courier New' },
  { label: 'Arial Black (bold)', value: 'Arial Black' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Impact', value: 'Impact' },
];

const SIZES = [
  { label: 'Piccolo', value: 'sm' },
  { label: 'Medio', value: 'md' },
  { label: 'Grande', value: 'lg' },
  { label: 'Molto grande', value: 'xl' },
  { label: 'XL', value: '2xl' },
  { label: 'Maxi', value: '3xl' },
];

const COLORS = [
  { label: 'Bianco', value: '#e5e7eb' },
  { label: 'Giallo', value: '#facc15' },
  { label: 'Arancione', value: '#fb923c' },
  { label: 'Rosso', value: '#f87171' },
  { label: 'Verde', value: '#4ade80' },
  { label: 'Azzurro', value: '#60a5fa' },
  { label: 'Viola', value: '#c084fc' },
  { label: 'Rosa', value: '#f472b6' },
];

export default function NoticePanel() {
  const queryClient = useQueryClient();
  const fileRef = useRef();

  const { data: notices = [] } = useQuery({
    queryKey: ['screen-notice'],
    queryFn: () => base44.entities.ScreenNotice.list('-created_date', 1),
  });

  const current = notices[0] || null;

  const [draft, setDraft] = useState('');
  const [draftImg, setDraftImg] = useState('');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState('xl');
  const [textColor, setTextColor] = useState('#e5e7eb');
  const [remotePass, setRemotePass] = useState('');
  const [uploading, setUploading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (current && !initialized) {
      setDraft(current.text || '');
      setDraftImg(current.image_url || '');
      setFontFamily(current.font_family || 'Inter');
      setFontSize(current.font_size || 'xl');
      setTextColor(current.text_color || '#e5e7eb');
      setRemotePass(current.remote_password || '');
      setSynced(true);
      setInitialized(true);
    }
  }, [current, initialized]);

  const markDirty = () => setSynced(false);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        text: draft,
        image_url: draftImg,
        active: true,
        font_family: fontFamily,
        font_size: fontSize,
        text_color: textColor,
        remote_password: remotePass,
      };
      if (current) {
        await base44.entities.ScreenNotice.update(current.id, payload);
      } else {
        await base44.entities.ScreenNotice.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-notice'] });
      setSynced(true);
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setDraftImg(file_url);
    markDirty();
    setUploading(false);
  };

  // Preview font size class
  const previewSize = {
    sm: '14px', md: '17px', lg: '20px', xl: '24px', '2xl': '30px', '3xl': '38px'
  }[fontSize] || '24px';

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Monitor className="w-5 h-5" />
              Avvisi Schermo Secondario
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Personalizza e premi <strong>Sincronizza</strong> per aggiornare lo schermo.
            </p>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            size="sm"
            disabled={syncMutation.isPending}
            className={synced ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'}
          >
            {syncMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : synced ? (
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
            ) : (
              <Send className="w-4 h-4 mr-1.5" />
            )}
            {syncMutation.isPending ? 'Invio...' : synced ? 'Sincronizzato' : 'Sincronizza'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Controlli stile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-muted rounded-xl border border-border">
          {/* Font */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" /> Font
            </label>
            <select
              value={fontFamily}
              onChange={e => { setFontFamily(e.target.value); markDirty(); }}
              className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:border-primary"
              style={{ fontFamily }}
            >
              {FONTS.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Dimensione */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" /> Dimensione
            </label>
            <select
              value={fontSize}
              onChange={e => { setFontSize(e.target.value); markDirty(); }}
              className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:border-primary"
            >
              {SIZES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Colore */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Colore testo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => { setTextColor(c.value); markDirty(); }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${textColor === c.value ? 'border-primary scale-125' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              {/* Custom color */}
              <input
                type="color"
                value={textColor}
                onChange={e => { setTextColor(e.target.value); markDirty(); }}
                title="Colore personalizzato"
                className="w-7 h-7 rounded-full cursor-pointer border-2 border-dashed border-muted-foreground hover:border-primary"
                style={{ padding: '1px' }}
              />
            </div>
          </div>
        </div>

        {/* Immagine */}
        {draftImg && (
          <div className="relative w-full max-h-48 rounded-lg overflow-hidden border border-border">
            <img src={draftImg} alt="Avviso" className="w-full object-contain max-h-48" />
            <button
              onClick={() => { setDraftImg(''); markDirty(); }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Preview testo in anteprima */}
        <div
          className="w-full min-h-[120px] bg-gray-900 rounded-xl p-5 border border-border whitespace-pre-wrap leading-relaxed"
          style={{ fontFamily, fontSize: previewSize, color: textColor }}
        >
          {draft || <span className="text-gray-600 italic" style={{ fontFamily: 'Inter', fontSize: '14px' }}>Anteprima del testo...</span>}
        </div>

        {/* Textarea */}
        <textarea
          className="w-full h-28 bg-muted text-foreground text-sm leading-relaxed rounded-lg p-4 resize-none border border-border focus:border-primary focus:outline-none placeholder-muted-foreground"
          value={draft}
          onChange={e => { setDraft(e.target.value); markDirty(); }}
          placeholder="Inserisci comunicazioni, avvisi o note per i soci..."
        />

        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-1.5" />}
            {uploading ? 'Caricamento...' : 'Carica immagine'}
          </Button>
          {draftImg && <span className="text-xs text-muted-foreground">Immagine caricata ✓</span>}
        </div>

        {/* Password accesso remoto */}
        <div className="pt-3 border-t border-border space-y-2">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Password accesso remoto
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={remotePass}
              onChange={e => { setRemotePass(e.target.value); markDirty(); }}
              placeholder="Imposta una password..."
              className="flex-1 text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:border-primary font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Chiunque conosca questa password potrà modificare gli avvisi tramite <strong>/remote-notice</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}