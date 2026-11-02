import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  SlidersHorizontal,
  CalendarDays,
  KeyRound,
} from 'lucide-react';
import { api, errorMessage, type Property } from '../api';
import { Seo, PropertyCard, Notice } from '../components';
export default function Home() {
  const [purpose, setPurpose] = useState('Buy');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [homes, setHomes] = useState<Property[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    api
      .get('/properties?limit=3')
      .then((r) => setHomes(r.data.items))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  function search(e: FormEvent) {
    e.preventDefault();
    navigate(
      '/properties?' +
        new URLSearchParams({
          purpose,
          ...(location ? { location } : {}),
          ...(type ? { type } : {}),
        }),
    );
  }
  return (
    <>
      <Seo title="Find a place for your next chapter" />
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-dot" /> A NEW PERSPECTIVE ON HOME
          </div>
          <h1>
            Good spaces.
            <br />
            Better <em>beginnings.</em>
          </h1>
          <p>
            From your first apartment to your forever home.
            <br className="desktop" /> Find a place that feels like you.
          </p>
          <div className="hero-proof">
            <div className="proof-icons">
              <span>BLR</span>
              <span>BOM</span>
              <span>DEL</span>
            </div>
            <div>
              Rooted in neighbourhoods.
              <br />
              <strong>Made for your next move.</strong>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85"
            alt="Sunlit modern living room opening onto a garden"
            fetchPriority="high"
          />
          <div className="hero-label">
            <span>
              <i /> YOUR NEXT CHAPTER
            </span>
            <strong>
              A little more room
              <br />
              to be you.
            </strong>
            <ArrowUpRight size={28} />
          </div>
          <span className="image-index">01 / SPACES THAT INSPIRE</span>
        </div>
        <form className="search-panel" onSubmit={search}>
          <div className="search-tabs">
            {['Buy', 'Rent'].map((p) => (
              <button
                className={purpose === p ? 'selected' : ''}
                type="button"
                key={p}
                onClick={() => setPurpose(p)}
              >
                {p === 'Buy' ? 'Buy a home' : 'Rent a home'}
              </button>
            ))}
          </div>
          <div className="search-fields">
            <label>
              <span>
                <MapPin size={16} /> LOCATION
              </span>
              <input
                aria-label="City or neighbourhood"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or neighbourhood"
              />
            </label>
            <label>
              <span>
                <SlidersHorizontal size={16} /> PROPERTY TYPE
              </span>
              <select
                aria-label="Property type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">All property types</option>
                {['Apartment', 'Villa', 'Independent house', 'Plot', 'Commercial'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <button className="button dark">
              <Search size={18} /> Explore homes
            </button>
          </div>
        </form>
      </section>
      <section className="intro-strip container">
        <span>YOUR SPACE. YOUR PACE.</span>
        <p>
          A home search should feel like a possibility.
          <br />
          <strong>Let's make your next move a good one.</strong>
        </p>
        <ArrowUpRight size={34} />
      </section>
      <section className="section soft">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE NEXT CHAPTER COLLECTION</p>
              <h2>Spaces worth coming home to.</h2>
            </div>
            <Link className="arrow-link" to="/properties">
              Explore all properties <ArrowUpRight size={19} />
            </Link>
          </div>
          {error ? (
            <Notice>{error}</Notice>
          ) : (
            <div className="property-grid">
              {homes.map((p) => (
                <PropertyCard p={p} key={p.id} />
              ))}
            </div>
          )}
          <p className="collection-note">
            Different cities. Different stories. One place to start.
          </p>
        </div>
      </section>
      <section id="how-it-works" className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A LITTLE SIMPLER, AT EVERY STEP</p>
            <h2>Your next move, made easy.</h2>
          </div>
          <p className="muted">
            Less searching in circles.
            <br />
            More finding your place.
          </p>
        </div>
        <div className="steps">
          {[
            [
              Search,
              '01',
              'Find your kind of place',
              'Explore by city, budget, property type and the space you need.',
            ],
            [
              CalendarDays,
              '02',
              'See it for yourself',
              'Pick a viewing time. Book as a guest or keep it all in your dashboard.',
            ],
            [
              KeyRound,
              '03',
              'Make your next move',
              'Meet the owner, ask your questions and decide what feels right.',
            ],
          ].map(([Icon, n, title, copy]) => {
            const I = Icon as typeof Search;
            return (
              <article key={String(n)}>
                <div className="step-top">
                  <I size={26} />
                  <span>{String(n)}</span>
                </div>
                <h3>{String(title)}</h3>
                <p>{String(copy)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="container owner-banner">
        <div>
          <p className="eyebrow">A NEW BEGINNING FOR YOUR PROPERTY</p>
          <h2>
            Great spaces deserve
            <br />
            to be discovered.
          </h2>
          <p>List your property and welcome its next chapter.</p>
          <Link className="button light" to="/properties/new">
            List your property <ArrowRight size={18} />
          </Link>
        </div>
        <div className="banner-art">
          <HouseLines />
        </div>
      </section>
    </>
  );
}
function HouseLines() {
  return (
    <svg viewBox="0 0 360 260" fill="none" aria-hidden="true">
      <path
        d="M40 240V100L180 20l140 80v140H40Zm0-140h280M105 240V140h65v100M215 140h55v55h-55v-55M180 20v80M40 100l140 70 140-70M180 170v70"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="290" cy="45" r="40" stroke="currentColor" />
    </svg>
  );
}
