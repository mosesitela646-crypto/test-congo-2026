"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Project = {
  id: string; name: string; description: string | null; status: string;
  createdAt: string; updatedAt: string;
  _count: { seasons: number; episodes: number; scenes: number; characters: number; assets: number };
};
type Character = { id: string; name: string; description: string | null; createdAt: string };
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectResponse, characterResponse] = await Promise.all([
        fetch(`${API_URL}/api/projects/${id}`, { cache: "no-store" }),
        fetch(`${API_URL}/api/projects/${id}/characters`, { cache: "no-store" })
      ]);
      if (!projectResponse.ok) throw new Error(projectResponse.status === 404 ? "Project not found." : "Could not load project.");
      if (!characterResponse.ok) throw new Error("Could not load project characters.");
      setProject(await projectResponse.json());
      setCharacters(await characterResponse.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  async function addCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/projects/${id}/characters`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message?.[0] || body?.message || "Could not create character.");
      }
      setName(""); setDescription("");
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create character.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="workspace-state">Loading project workspace…</main>;
  if (!project) return <main className="workspace-state"><p>{error || "Project not found."}</p><Link href="/projects">← Back to projects</Link></main>;

  const stats = [
    ["SEASONS", project._count.seasons], ["EPISODES", project._count.episodes],
    ["SCENES", project._count.scenes], ["CHARACTERS", project._count.characters], ["ASSETS", project._count.assets]
  ];

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <Link href="/projects" className="workspace-back">← ALL PROJECTS</Link>
        <span className="workspace-brand">CONGO <small>AI STUDIO</small></span>
        <span className="workspace-status">● LOCAL WORKSPACE</span>
      </header>
      <section className="workspace-content">
        <p className="eyebrow">PROJECT WORKSPACE / PRODUCTION OVERVIEW</p>
        <div className="workspace-title-row">
          <div><h1>{project.name}</h1><p>{project.description || "No production description yet. Start by defining the creative foundations."}</p></div>
          <span className={`status-badge status-${project.status.toLowerCase()}`}>{project.status}</span>
        </div>
        <div className="workspace-stats">{stats.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>

        <div className="workspace-grid">
          <section className="workspace-panel">
            <div className="workspace-panel-heading"><div><p className="eyebrow">CAST & IDENTITY</p><h2>Characters</h2></div><span className="workspace-count">{characters.length} TOTAL</span></div>
            <p className="workspace-help">Build a cast for this production. Character descriptions will become the foundation for consistent visual references across scenes.</p>
            {characters.length === 0 ? <div className="workspace-empty"><span>✧</span><h3>Your cast starts here</h3><p>Add the first character and define who they are.</p></div> :
              <div className="character-list">{characters.map((character, index) => <article className="character-card" key={character.id}><span className="character-index">{String(index + 1).padStart(2, "0")}</span><div><h3>{character.name}</h3><p>{character.description || "Character profile not yet detailed."}</p></div><span className="character-tag">CHARACTER</span></article>)}</div>}
          </section>

          <aside className="workspace-panel character-form-panel">
            <p className="eyebrow">CAST BUILDER</p><h2>Add a character</h2>
            <p className="workspace-help">Create a named character and save their initial profile to this project.</p>
            <form onSubmit={addCharacter}>
              <label htmlFor="character-name">Character name</label>
              <input id="character-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amara" maxLength={100} required />
              <label htmlFor="character-description">Initial description <span>OPTIONAL</span></label>
              <textarea id="character-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Age, appearance, clothing, personality, role…" rows={6} maxLength={3000} />
              <button className="primary-button" disabled={saving}>{saving ? "Saving…" : "＋ Add character"}</button>
            </form>
            {error && <p className="error-message" role="alert">{error}</p>}
          </aside>
        </div>

        <section className="workspace-roadmap">
          <p className="eyebrow">PRODUCTION STRUCTURE</p><h2>Story development</h2>
          <div className="roadmap-items"><div><span>01</span><strong>Seasons & episodes</strong><small>Coming next</small></div><div><span>02</span><strong>Scenes & shots</strong><small>Coming next</small></div><div><span>03</span><strong>Visual references</strong><small>Coming next</small></div></div>
        </section>
      </section>
    </main>
  );
}