import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight, CalendarDays, House, Clock3, Trash2, Pencil } from 'lucide-react';
import { api, errorMessage, type Property, type Appointment, viewingTime, money } from '../api';
import { useAuth } from '../auth';
import { Seo, Loading, Notice, Empty } from '../components';
type Data = { listings: Property[]; appointments: Appointment[]; incoming: Appointment[] };
export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Data>();
  const [error, setError] = useState('');
  const [tab, setTab] = useState('listings');
  const [busy, setBusy] = useState('');
  const [remove, setRemove] = useState<Property>();
  const load = () => api.get('/dashboard').then((r) => setData(r.data));
  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)));
  }, []);
  async function status(a: Appointment, status: string) {
    setBusy(a.id);
    setError('');
    try {
      await api.patch('/appointments/' + a.id, { status });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  }
  async function deleteListing() {
    if (!remove) return;
    setBusy(remove.id);
    try {
      await api.delete('/properties/' + remove.id);
      setRemove(undefined);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  }
  return (
    <section className="container section dashboard">
      <Seo title="Your dashboard" privatePage />
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR ESTATEIQ</p>
          <h1>Hello, {user?.name.split(' ')[0]}.</h1>
          <p className="muted">Every next chapter, in one place.</p>
        </div>
        <Link className="button dark" to="/properties/new">
          <Plus size={18} /> List a property
        </Link>
      </div>
      {error && <Notice>{error}</Notice>}
      {!data && !error ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="stats">
              <div>
                <House />
                <span>
                  Your listings<strong>{data.listings.length}</strong>
                </span>
              </div>
              <div>
                <CalendarDays />
                <span>
                  Your upcoming viewings
                  <strong>
                    {
                      data.appointments.filter(
                        (a) => a.status !== 'cancelled' && Date.parse(a.startsAt) > Date.now(),
                      ).length
                    }
                  </strong>
                </span>
              </div>
              <div>
                <Clock3 />
                <span>
                  Requests to review
                  <strong>
                    {
                      data.incoming.filter(
                        (a) => a.status === 'pending' && Date.parse(a.startsAt) > Date.now(),
                      ).length
                    }
                  </strong>
                </span>
              </div>
            </div>
            <div className="dashboard-tabs" role="tablist" aria-label="Dashboard sections">
              {[
                ['listings', 'My listings'],
                ['appointments', 'My viewings'],
                ['incoming', 'Viewing requests'],
              ].map(([key, label]) => (
                <button
                  role="tab"
                  aria-selected={tab === key}
                  key={key}
                  onClick={() => setTab(key)}
                  className={tab === key ? 'selected' : ''}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === 'listings' ? (
              data.listings.length ? (
                <div className="listing-rows">
                  {data.listings.map((p) => (
                    <article key={p.id}>
                      <Link to={'/properties/' + p.id} className="row-image">
                        {p.images[0] ? <img src={p.images[0].url} alt={p.title} /> : <House />}
                      </Link>
                      <div>
                        <span className="eyebrow">
                          {p.location} / {p.purpose === 'Buy' ? 'FOR SALE' : 'FOR RENT'}
                        </span>
                        <Link to={'/properties/' + p.id}>
                          <h3>{p.title}</h3>
                        </Link>
                        <p>
                          {money(p.price)} <span className="muted">· {p.area} sq ft</span>
                        </p>
                      </div>
                      <div className="row-actions">
                        <Link className="button small" to={`/properties/${p.id}/edit`}>
                          <Pencil size={15} /> Edit
                        </Link>
                        <button className="danger small" onClick={() => setRemove(p)}>
                          <Trash2 size={15} /> Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty title="Your first listing starts here">
                  <p>Help someone discover their next home.</p>
                  <Link className="button dark" to="/properties/new">
                    List a property <ArrowUpRight size={17} />
                  </Link>
                </Empty>
              )
            ) : (
              <Viewings
                rows={tab === 'appointments' ? data.appointments : data.incoming}
                incoming={tab === 'incoming'}
                busy={busy}
                onStatus={status}
              />
            )}
          </>
        )
      )}
      {remove && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <h2 id="delete-title">Remove this listing?</h2>
            <p>
              “{remove.title}” will no longer appear in search. Its viewing appointments will be
              cancelled.
            </p>
            <div className="row-actions">
              <button autoFocus onClick={() => setRemove(undefined)} disabled={!!busy}>
                Keep listing
              </button>
              <button className="danger" onClick={deleteListing} disabled={!!busy}>
                {busy ? 'Removing…' : 'Remove listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
function Viewings({
  rows,
  incoming,
  busy,
  onStatus,
}: {
  rows: Appointment[];
  incoming: boolean;
  busy: string;
  onStatus: (a: Appointment, s: string) => void;
}) {
  return rows.length ? (
    <div className="viewing-list">
      {[...rows]
        .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
        .map((a) => (
          <article key={a.id}>
            <div className="viewing-icon">
              <CalendarDays />
            </div>
            <div>
              <span className={'status ' + a.status}>{a.status}</span>
              <h3>
                <Link to={'/properties/' + a.propertyId}>{a.propertyTitle}</Link>
              </h3>
              <p>{viewingTime(a.startsAt)}</p>
              {incoming && (
                <p className="muted">
                  {a.name} · {a.email} · {a.phone}
                </p>
              )}
            </div>
            <div className="row-actions">
              {a.status !== 'cancelled' && Date.parse(a.startsAt) > Date.now() && (
                <>
                  {incoming && a.status === 'pending' && (
                    <button
                      className="dark small"
                      disabled={busy === a.id}
                      onClick={() => onStatus(a, 'confirmed')}
                    >
                      Confirm
                    </button>
                  )}
                  <button
                    className="small"
                    disabled={busy === a.id}
                    onClick={() => onStatus(a, 'cancelled')}
                  >
                    Cancel viewing
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
    </div>
  ) : (
    <Empty title={incoming ? 'No viewing requests yet' : 'A new place is waiting'}>
      <p>
        {incoming
          ? 'Requests will appear here when someone books a viewing.'
          : 'Explore homes and book your first viewing.'}
      </p>
      <Link to="/properties">Explore properties →</Link>
    </Empty>
  );
}
