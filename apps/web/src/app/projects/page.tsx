"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/projects`, { cache: "no-store" });
      if (!response.ok) throw new Error(`API request failed (${response.status})`);
      const data: Project[] = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProjects(); }, [loadProjects]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Project name must contain at least 2 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message?.[0] || body?.message || `Could not create project (${response.status})`);
      }
      setName("");
      setDescription("");
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="projects-shell">
      <aside className="projects-sidebar">
        <Link className="back-link" href="/">← Studio overview</Link>
        <div className="projects-brand"><span>C</span><div>CONGO <small>AI STUDIO</small></div></div>
        <p className="sidebar-caption">WORKSPACE</p>
        <Link className="sidebar-link" href="/">Overview</Link>
        <Link className="sidebar-link selected" href="/projects">Projects</Link>
        <div className="sidebar-bottom">FOUNDATION BUILD<br/>VERSION 0.1.0</div>
      </aside>

      <section className="projects-main">
        <header className="projects-topbar"><span>WORKSPACE / PROJECT MANAGEMENT</span><span className="system-pill">● LOCAL WORKSPACE</span></header>
        <div className="projects-intro">
          <div><p className="eyebrow">YOUR PRODUCTIONS</p><h1>Projects</h1><p className="intro-copy">Create and organize the films, series and creative productions behind your studio.</p></div>
          <div className="project-count"><strong>{projects.length.toString().padStart(2, "0")}</strong><span>PROJECTS</span></div>
        </div>

        <div className="projects-layout">
          <section className="project-list-panel">
            <div className="panel-heading"><div><p className="eyebrow">YOUR LIBRARY</p><h2>All projects</h2></div><button className="subtle-button" onClick={() => void loadProjects()} disabled={loading}>↻ Refresh</button></div>
            {loading ? <div className="empty-state">Loading your projects…</div> :
              projects.length === 0 ? <div className="empty-state"><span className="empty-icon">▧</span><h3>Your studio starts here.</h3><p>Create your first project to begin organizing stories, characters, scenes and shots.</p></div> :
              <div className="project-list">{projects.map(project => <article className="project-card" key={project.id}><div className="project-card-top"><span className="project-symbol">▣</span><span className={`status-badge status-${project.status.toLowerCase()}`}>{project.status}</span></div><h3>{project.name}</h3><p>{project.description || "No description added yet."}</p><div className="project-card-foot"><span>UPDATED {new Date(project.updatedAt).toLocaleDateString()}</span><span>OPEN ↗</span></div></article>)}</div>
            }
          </section>

          <aside className="create-panel">
            <p className="eyebrow">NEW PRODUCTION</p><h2>Create a project</h2><p className="form-copy">Start with a title. You can build the story structure and add creative assets later.</p>
            <form onSubmit={createProject}>
              <label htmlFor="project-name">Project name</label>
              <input id="project-name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. The Copper Kingdom" maxLength={120} required />
              <label htmlFor="project-description">Description <span>OPTIONAL</span></label>
              <textarea id="project-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="What is this production about?" rows={5} maxLength={2000} />
              <button className="primary-button" type="submit" disabled={saving}>{saving ? "Creating…" : "＋ Create project"}</button>
            </form>
            {error && <p className="error-message" role="alert">{error}</p>}
            <div className="privacy-note">LOCAL DEVELOPMENT · PROJECTS ARE SAVED IN YOUR POSTGRESQL DATABASE.</div>
          </aside>
        </div>
      </section>
    </main>
  );
}
