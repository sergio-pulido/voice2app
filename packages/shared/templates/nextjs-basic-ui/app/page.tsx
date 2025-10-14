import Link from 'next/link'

function Card(props: { title: string, desc: string, href?: string, on?: 'link' | 'button' }) {
  return (
    <div className="card">
      <h3>{props.title}</h3>
      <p>{props.desc}</p>
      {props.href && props.on !== 'button' && (
        <Link className="btn" href={props.href}>Open</Link>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <main className="container">
      <header className="header">
        <h1>Next.js Basic UI</h1>
        <p className="muted">App Router · TypeScript · Fixed Port · Healthcheck · Simple API routes</p>
      </header>

      <section className="grid">
        <Card
          title="Healthcheck"
          desc="Server-side route responding with plain text 'ok'."
          href="/healthz"
        />
        <Card
          title="Echo API"
          desc="Try GET /api/echo?msg=hello or POST a JSON body."
          href="/api/echo?msg=hello"
        />
        <Card
          title="UI Starter"
          desc="Use this scaffold for quick CRUD screens, auth shells, etc."
          href="https://nextjs.org/docs"
        />
      </section>

      <footer className="footer">
        <span>Port fixed at 5173 (dev & start)</span>
      </footer>
    </main>
  )
}