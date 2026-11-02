import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, Check } from 'lucide-react';
import { api, errorMessage, type Property } from '../api';
import { useAuth } from '../auth';
import { Seo, Loading, Notice } from '../components';
export default function Editor() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saved, setSaved] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);
  useEffect(() => {
    if (id)
      api
        .get('/properties/' + id)
        .then((r) => setProperty(r.data))
        .catch((e) => setError(errorMessage(e)));
  }, [id]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const body = {
      title: f.get('title'),
      description: f.get('description'),
      location: f.get('location'),
      address: f.get('address'),
      type: f.get('type'),
      purpose: f.get('purpose'),
      price: Number(f.get('price')),
      area: Number(f.get('area')),
      bedrooms: Number(f.get('bedrooms')),
      bathrooms: Number(f.get('bathrooms')),
      amenities: String(f.get('amenities'))
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    };
    let p = property;
    try {
      p = (id ? await api.patch('/properties/' + id, body) : await api.post('/properties', body))
        .data;
      setProperty(p);
      setSaved(true);
      if (!p) throw new Error('Could not save the listing');
      if (files.length) {
        for (const file of files) {
          const upload = new FormData();
          upload.append('images', file);
          p = (await api.post(`/properties/${p!.id}/images`, upload)).data;
          setProperty(p);
        }
        setFiles([]);
      }
      navigate('/properties/' + p!.id);
    } catch (e) {
      setError(errorMessage(e));
      if (p && !id)
        navigate(`/properties/${p.id}/edit`, {
          replace: true,
          state: { uploadError: 'Your property was saved. Please retry the image upload.' },
        });
    } finally {
      setBusy(false);
    }
  }
  async function remove(fileId: string) {
    if (!property) return;
    setBusy(true);
    setError('');
    try {
      setProperty(
        (await api.delete(`/properties/${property.id}/images/${encodeURIComponent(fileId)}`)).data,
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (id && !property && !error) return <Loading />;
  if (property && property.ownerId !== user?.id)
    return (
      <section className="container section">
        <Notice>You can only edit your own listings.</Notice>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    );
  return (
    <section className="container section editor">
      <Seo title={id ? 'Edit your listing' : 'List your property'} privatePage />
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={16} /> Your dashboard
      </Link>
      <p className="eyebrow">MAKE ROOM FOR A NEW CHAPTER</p>
      <h1>{id ? 'A little update. A fresh perspective.' : 'Great spaces start with a story.'}</h1>
      <p className="muted">Tell us about your property. We'll help people find it.</p>
      {error && (
        <Notice>
          {error}
          {saved && ' Your property details have been saved; retry the photos below.'}
        </Notice>
      )}
      {(!id || property) && (
        <form onSubmit={submit} key={property?.id || 'new'} className="editor-form">
          <section>
            <span className="form-number">01</span>
            <h2>The essentials</h2>
            <label>
              Property title
              <input
                name="title"
                defaultValue={property?.title}
                required
                minLength={5}
                maxLength={120}
                placeholder="A light-filled home in Indiranagar"
              />
            </label>
            <label>
              Tell its story
              <textarea
                name="description"
                rows={5}
                required
                minLength={30}
                maxLength={5000}
                defaultValue={property?.description}
                placeholder="What makes this place feel like home?"
              />
            </label>
            <div className="field-pair">
              <label>
                Property type
                <select name="type" defaultValue={property?.type || 'Apartment'}>
                  {['Apartment', 'Villa', 'Independent house', 'Plot', 'Commercial'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Available for
                <select name="purpose" defaultValue={property?.purpose || 'Buy'}>
                  <option value="Buy">Sale</option>
                  <option value="Rent">Rent</option>
                </select>
              </label>
            </div>
            <div className="field-pair">
              <label>
                City
                <input
                  name="location"
                  required
                  minLength={2}
                  maxLength={100}
                  defaultValue={property?.location}
                  placeholder="Bengaluru"
                />
              </label>
              <label>
                Address / neighbourhood
                <input
                  name="address"
                  required
                  minLength={5}
                  maxLength={250}
                  defaultValue={property?.address}
                  placeholder="Indiranagar, Bengaluru"
                />
              </label>
            </div>
          </section>
          <section>
            <span className="form-number">02</span>
            <h2>Room for the details</h2>
            <div className="field-pair">
              <label>
                Price (₹, monthly for rent)
                <input
                  name="price"
                  type="number"
                  min={1}
                  max={1e12}
                  required
                  defaultValue={property?.price}
                />
              </label>
              <label>
                Area (sq ft)
                <input
                  name="area"
                  type="number"
                  min={1}
                  max={1e8}
                  required
                  defaultValue={property?.area}
                />
              </label>
            </div>
            <div className="field-pair">
              <label>
                Bedrooms
                <input
                  name="bedrooms"
                  type="number"
                  min={0}
                  max={50}
                  required
                  defaultValue={property?.bedrooms ?? 2}
                />
              </label>
              <label>
                Bathrooms
                <input
                  name="bathrooms"
                  type="number"
                  min={0}
                  max={50}
                  required
                  defaultValue={property?.bathrooms ?? 2}
                />
              </label>
            </div>
            <label>
              Amenities, separated by commas
              <input
                name="amenities"
                defaultValue={property?.amenities.join(', ')}
                placeholder="Parking, Balcony, Security"
              />
            </label>
          </section>
          <section>
            <span className="form-number">03</span>
            <h2>Let the space speak</h2>
            <p className="muted">Up to four photos. JPEG, PNG or WebP, maximum 4 MB each.</p>
            <div className="editor-images">
              {property?.images.map((im) => (
                <div key={im.fileId}>
                  <img src={im.url} alt="Existing property photo" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    disabled={busy}
                    onClick={() => remove(im.fileId)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {previews.map((url, i) => (
                <div key={url}>
                  <img src={url} alt={`New property photo ${i + 1}`} />
                  <button
                    type="button"
                    aria-label="Remove new photo"
                    onClick={() => setFiles(files.filter((_, n) => n !== i))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <label className="upload-zone">
              <Upload size={28} />
              <strong>Choose photos of your property</strong>
              <span>Bright spaces. Clear views. A good first impression.</span>
              <input
                aria-label="Property photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={busy || (property?.images.length || 0) >= 4}
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  if (selected.length + (property?.images.length || 0) > 4) {
                    setError('Choose up to four images in total.');
                    return;
                  }
                  if (selected.some((f) => f.size > 4 * 1024 * 1024)) {
                    setError('Each image must be 4 MB or smaller.');
                    return;
                  }
                  setError('');
                  setFiles(selected);
                }}
              />
            </label>
          </section>
          <div className="editor-submit">
            <p className="micro muted">Only list properties you own or are authorised to manage.</p>
            <button className="button dark" disabled={busy}>
              <Check size={18} />
              {busy ? 'Saving your listing…' : id ? 'Save changes' : 'Publish listing'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
