import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Scan,
  Check,
  CalendarDays,
  Share2,
  House,
} from 'lucide-react';
import { api, errorMessage, money, type Property } from '../api';
import { useRuntime } from '../runtime';
import { useAuth } from '../auth';
import { Seo, Loading, Notice } from '../components';
export default function Detail() {
  const { id } = useParams();
  const mode = useRuntime();
  const { user } = useAuth();
  const [p, setP] = useState<Property>();
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmation, setConfirmation] = useState<{ manageToken: string; emailSent: boolean }>();
  const [shared, setShared] = useState(false);
  useEffect(() => {
    setError('');
    setP(undefined);
    setActive(0);
    setConfirmation(undefined);
    api
      .get('/properties/' + id)
      .then((r) => setP(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);
  async function book(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setBookingError('');
    const f = new FormData(e.currentTarget);
    const date = String(f.get('date'));
    const time = String(f.get('time'));
    try {
      const startsAt = new Date(`${date}T${time}:00+05:30`).toISOString();
      const r = await api.post(`/properties/${id}/appointments${user ? '' : '/guest'}`, {
        name: f.get('name'),
        email: f.get('email'),
        phone: f.get('phone'),
        startsAt,
      });
      setConfirmation(r.data);
    } catch (e) {
      setBookingError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <section className="container section">
        <Notice>{error}</Notice>
        <Link to="/properties">Back to properties</Link>
      </section>
    );
  if (!p) return <Loading />;
  const mine = user?.id === p.ownerId;
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  return (
    <section className="container section detail">
      <Seo title={p.title + ' in ' + p.location} description={p.description.slice(0, 160)} />
      <Link className="back-link" to="/properties">
        <ArrowLeft size={16} /> Back to properties
      </Link>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">
            {p.type.toUpperCase()} / FOR {p.purpose === 'Buy' ? 'SALE' : 'RENT'}
          </p>
          <h1>{p.title}</h1>
          <p className="location muted">
            <MapPin size={17} />
            {p.address}
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard
              .writeText(window.location.href)
              .then(() => {
                setShared(true);
                setTimeout(() => setShared(false), 2500);
              })
              .catch(() =>
                setBookingError('Copy the address from your browser to share this home.'),
              );
          }}
        >
          <Share2 size={16} />
          {shared ? 'Link copied' : 'Share property'}
        </button>
      </div>
      <div className="gallery">
        <div className="main-photo">
          {p.images[active] ? (
            <img src={p.images[active].url} alt={`${p.title}, photo ${active + 1}`} />
          ) : (
            <div className="image-placeholder">
              <House size={60} />
              <p>Photos coming soon</p>
            </div>
          )}
          <span className="photo-count">
            {p.images.length ? `${active + 1} / ${p.images.length}` : 'No photos yet'}
          </span>
        </div>
        {p.images.length > 1 && (
          <div className="thumbnails">
            {p.images.map((im, n) => (
              <button
                key={im.fileId}
                className={active === n ? 'selected' : ''}
                onClick={() => setActive(n)}
                aria-label={`View photo ${n + 1}`}
                aria-pressed={active === n}
              >
                <img src={im.url} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="detail-layout">
        <div>
          <div className="detail-price">
            {money(p.price)}
            {p.purpose === 'Rent' && <small> / month</small>}
          </div>
          <div className="detail-specs">
            <span>
              <BedDouble />
              <strong>{p.bedrooms}</strong> Bedrooms
            </span>
            <span>
              <Bath />
              <strong>{p.bathrooms}</strong> Bathrooms
            </span>
            <span>
              <Scan />
              <strong>{p.area.toLocaleString('en-IN')}</strong> sq ft
            </span>
          </div>
          <article className="description">
            <h2>Room for your next chapter.</h2>
            <p>{p.description}</p>
          </article>
          <h3>The little things that matter</h3>
          <div className="amenities">
            {p.amenities.length ? (
              p.amenities.map((a) => (
                <span key={a}>
                  <Check size={17} />
                  {a}
                </span>
              ))
            ) : (
              <p className="muted">Ask the owner about available amenities at your viewing.</p>
            )}
          </div>
          <div className="location-box">
            <MapPin size={28} />
            <div>
              <h3>{p.location}</h3>
              <p>{p.address}</p>
              <a
                href={
                  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.address)
                }
                target="_blank"
                rel="noreferrer"
              >
                Explore the neighbourhood ↗
              </a>
            </div>
          </div>
        </div>
        <aside className="booking-card">
          {mode === 'showcase' ? (
            <>
              <p className="eyebrow">A LOOK AT WHAT'S POSSIBLE</p>
              <h2>Picture your next chapter.</h2>
              <p className="muted">
                Explore this sample home's photos and details. Viewing requests will open when live
                services are connected.
              </p>
              <Link className="button dark full" to="/properties">
                Discover more homes
              </Link>
              <p className="micro muted">Illustrative property. Photos and prices are samples.</p>
            </>
          ) : mine ? (
            <>
              <p className="eyebrow">YOUR PROPERTY</p>
              <h2>Ready for its next chapter.</h2>
              <p>Manage photos and details, or review viewing requests in your dashboard.</p>
              <Link className="button dark full" to={`/properties/${id}/edit`}>
                Edit listing
              </Link>
              <Link className="button full" to="/dashboard">
                Open dashboard
              </Link>
            </>
          ) : confirmation ? (
            <div className="booking-success">
              <span className="success-icon">
                <Check />
              </span>
              <h2>You're one step closer.</h2>
              <p>
                Your viewing request is pending. The property owner can confirm it from their
                dashboard.
              </p>
              {!confirmation.emailSent && (
                <Notice>
                  Your request was saved, but the email could not be delivered. Keep the link below.
                </Notice>
              )}
              <Link className="button dark full" to={'/viewing?token=' + confirmation.manageToken}>
                Manage your viewing
              </Link>
              <p className="micro">
                Keep this private link to view the status or cancel your request.
              </p>
            </div>
          ) : (
            <>
              <p className="eyebrow">
                <CalendarDays size={16} /> COME TAKE A LOOK
              </p>
              <h2>See yourself here?</h2>
              <p className="muted">A photo is a start. A viewing tells the story.</p>
              {bookingError && <Notice>{bookingError}</Notice>}
              <form onSubmit={book} key={user?.id || 'guest'}>
                <label>
                  Your name
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    defaultValue={user?.name}
                  />
                </label>
                <label>
                  Email address
                  <input name="email" type="email" required defaultValue={user?.email} />
                </label>
                <label>
                  Phone number
                  <input
                    name="phone"
                    type="tel"
                    required
                    pattern="[+0-9 ()-]{8,20}"
                    autoComplete="tel"
                  />
                </label>
                <div className="field-pair">
                  <label>
                    Date
                    <input
                      name="date"
                      type="date"
                      required
                      min={today}
                      max={new Date(Date.now() + 89 * 86400000).toISOString().slice(0, 10)}
                    />
                  </label>
                  <label>
                    Time (IST)
                    <select name="time" required>
                      <option value="">Pick a time</option>
                      {Array.from({ length: 10 }, (_, i) => i + 9).map((h) => (
                        <option key={h} value={String(h).padStart(2, '0') + ':00'}>
                          {h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button className="button dark full" disabled={busy}>
                  {busy ? 'Requesting…' : 'Request a viewing'}
                  <CalendarDays size={17} />
                </button>
              </form>
              <p className="micro center muted">
                No account needed. No payment required.
                <br />
                All viewing times are in India Standard Time.
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
