"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Project = {
  id: string; name: string; description: string | null; status: string;
  createdAt: string; updatedAt: string;
  _count: { seasons: number; episodes: number; scenes: number; characters: number; assets: number };
};
type IdentityProfile = {
  role?: string; age?: string; skinTone?: string; face?: string; eyes?: string;
  hair?: string; build?: string; distinguishingFeatures?: string; personality?: string;
  defaultOutfit?: string; voiceDescription?: string; consistencyNotes?: string;
};
type CharacterReference = { id: string; label: string; version: number; asset: { id: string; mimeType: string | null } | null };
type Character = {
  id: string; name: string; description: string | null; createdAt: string;
  canonicalProfile: IdentityProfile | null; references: CharacterReference[];
};
const emptyProfile: IdentityProfile = {
  role: "", age: "", skinTone: "", face: "", eyes: "", hair: "", build: "",
  distinguishingFeatures: "", personality: "", defaultOutfit: "",
  voiceDescription: "", consistencyNotes: ""
};
const profileFields: { key: keyof IdentityProfile; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "role", label: "Role in the story", placeholder: "Protagonist, antagonist, mentor…" },
  { key: "age", label: "Age", placeholder: "25 years old" },
  { key: "skinTone", label: "Skin tone", placeholder: "Deep brown, warm undertone…" },
  { key: "face", label: "Face shape & features", placeholder: "Oval face, high cheekbones…" },
  { key: "eyes", label: "Eyes", placeholder: "Dark brown, almond-shaped…" },
  { key: "hair", label: "Hair", placeholder: "Natural black curls, shoulder length…" },
  { key: "build", label: "Body build", placeholder: "Athletic, average height…" },
  { key: "distinguishingFeatures", label: "Distinctive features", placeholder: "Scar, birthmark, glasses…", multiline: true },
  { key: "personality", label: "Personality", placeholder: "Courageous, thoughtful, determined…", multiline: true },
  { key: "defaultOutfit", label: "Signature outfit", placeholder: "Red jacket, black trousers…", multiline: true },
  { key: "voiceDescription", label: "Voice identity", placeholder: "Warm medium-pitched voice, calm delivery…", multiline: true },
  { key: "consistencyNotes", label: "Continuity rules", placeholder: "Keep facial proportions, hairstyle and eye color unchanged between scenes…", multiline: true }
];
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [profile, setProfile] = useState<IdentityProfile>(emptyProfile);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [sceneInputs, setSceneInputs] = useState({ scene: "", outfit: "", action: "", environment: "", camera: "", style: "cinematic photorealism" });
  const [consistencyPrompt, setConsistencyPrompt] = useState("");
  const [consistencyReferences, setConsistencyReferences] = useState<string[]>([]);
  const [buildingPrompt, setBuildingPrompt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

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
      const loadedCharacters: Character[] = await characterResponse.json();
      setCharacters(loadedCharacters);
      if (selectedCharacterId) {
        const selected = loadedCharacters.find(character => character.id === selectedCharacterId);
        if (selected) setProfile({ ...emptyProfile, ...(selected.canonicalProfile || {}) });
      } else if (loadedCharacters.length > 0) {
        setSelectedCharacterId(loadedCharacters[0].id);
        setProfile({ ...emptyProfile, ...(loadedCharacters[0].canonicalProfile || {}) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [id, selectedCharacterId]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  async function addCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/projects/${id}/characters`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message?.[0] || body?.message || "Could not create character.");
      }
      const created: Character = await response.json();
      setName(""); setDescription(""); setSelectedCharacterId(created.id); setProfile(emptyProfile);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create character.");
    } finally { setSaving(false); }
  }

  function selectCharacter(character: Character) {
    setSelectedCharacterId(character.id);
    setProfile({ ...emptyProfile, ...(character.canonicalProfile || {}) });
    setProfileMessage("");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCharacterId) return;
    setSavingProfile(true); setProfileMessage(""); setError("");
    try {
      const cleanedProfile = Object.fromEntries(
        Object.entries(profile).map(([key, value]) => [key, value?.trim() || ""])
      );
      const response = await fetch(`${API_URL}/api/projects/${id}/characters/${selectedCharacterId}/profile`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedProfile)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message?.[0] || body?.message || "Could not save character identity.");
      }
      setProfileMessage("Identity profile saved successfully.");
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save identity profile.");
    } finally { setSavingProfile(false); }
  }


  async function uploadReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCharacterId || !referenceFile) return;
    setUploadingReference(true); setError(""); setProfileMessage("");
    try {
      const formData = new FormData();
      formData.append("file", referenceFile);
      const response = await fetch(`${API_URL}/api/projects/${id}/characters/${selectedCharacterId}/references`, {
        method: "POST", body: formData
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message?.[0] || body?.message || "Could not upload image reference.");
      }
      setReferenceFile(null);
      const input = document.getElementById("character-reference-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setProfileMessage("Image reference uploaded and saved.");
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload image reference.");
    } finally { setUploadingReference(false); }
  }

  async function makeMasterReference(referenceId: string) {
    setError(""); setProfileMessage("");
    try {
      const response = await fetch(`${API_URL}/api/projects/${id}/characters/${selectedCharacterId}/references/${referenceId}/master`, { method: "PATCH" });
      if (!response.ok) throw new Error("Could not set the master reference.");
      setProfileMessage("Master visual reference updated.");
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update master reference.");
    }
  }


  async function buildConsistencyPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCharacterId) return;
    setBuildingPrompt(true); setError(""); setConsistencyPrompt(""); setCopiedPrompt(false);
    try {
      const query = new URLSearchParams(sceneInputs);
      const response = await fetch(`${API_URL}/api/projects/${id}/characters/${selectedCharacterId}/consistency-kit?${query.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not prepare the character consistency prompt.");
      const result = await response.json();
      setConsistencyPrompt(result.prompt || "");
      setConsistencyReferences((result.references || []).map((reference: { url: string }) => `${API_URL}${reference.url}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to prepare consistency prompt.");
    } finally { setBuildingPrompt(false); }
  }

  async function copyConsistencyPrompt() {
    if (!consistencyPrompt) return;
    try {
      await navigator.clipboard.writeText(consistencyPrompt);
      setCopiedPrompt(true);
    } catch {
      setError("Clipboard access was blocked. Select and copy the prompt manually.");
    }
  }

  if (loading && !project) return <main className="workspace-state">Loading project workspace…</main>;
  if (!project) return <main className="workspace-state"><p>{error || "Project not found."}</p><Link href="/projects">← Back to projects</Link></main>;

  const stats = [
    ["SEASONS", project._count.seasons], ["EPISODES", project._count.episodes],
    ["SCENES", project._count.scenes], ["CHARACTERS", project._count.characters], ["ASSETS", project._count.assets]
  ];
  const selectedCharacter = characters.find(character => character.id === selectedCharacterId);

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
            <p className="workspace-help">Select a character to edit their canonical identity. These details are stored with the project and can later guide visual generation.</p>
            {characters.length === 0 ? <div className="workspace-empty"><span>✧</span><h3>Your cast starts here</h3><p>Add the first character and define who they are.</p></div> :
              <div className="character-list">{characters.map((character, index) =>
                <button type="button" className={`character-card character-select ${selectedCharacterId === character.id ? "character-selected" : ""}`} key={character.id} onClick={() => selectCharacter(character)}>
                  <span className="character-index">{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{character.name}</h3><p>{character.description || "Character profile not yet detailed."}</p></div>
                  <span className="character-tag">{character.canonicalProfile ? "PROFILE SAVED" : "EDIT IDENTITY"}</span>
                </button>
              )}</div>}
          </section>

          <aside className="workspace-panel character-form-panel">
            <p className="eyebrow">CAST BUILDER</p><h2>Add a character</h2>
            <p className="workspace-help">Create a named character and save their initial profile to this project.</p>
            <form onSubmit={addCharacter}>
              <label htmlFor="character-name">Character name</label>
              <input id="character-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amara" maxLength={100} required />
              <label htmlFor="character-description">Initial description <span>OPTIONAL</span></label>
              <textarea id="character-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Age, appearance, clothing, personality, role…" rows={5} maxLength={3000} />
              <button className="primary-button" disabled={saving}>{saving ? "Saving…" : "＋ Add character"}</button>
            </form>
          </aside>
        </div>

        {selectedCharacter && <section className="workspace-panel identity-editor">
          <div className="workspace-panel-heading"><div><p className="eyebrow">VISUAL IDENTITY</p><h2>{selectedCharacter.name} · Reference images</h2></div><span className="workspace-count">{selectedCharacter.references?.length || 0} REFERENCES</span></div>
          <p className="workspace-help">Import an image generated with ChatGPT or another image tool. The first uploaded image becomes the master reference; you can change it later.</p>
          <form className="reference-upload-form" onSubmit={uploadReference}>
            <input id="character-reference-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setReferenceFile(event.target.files?.[0] || null)} />
            <button className="primary-button" disabled={!referenceFile || uploadingReference}>{uploadingReference ? "Uploading image…" : "＋ Upload visual reference"}</button>
            <small>JPG, PNG or WebP · Maximum 10 MB</small>
          </form>
          {(selectedCharacter.references || []).length > 0 && <div className="reference-gallery">
            {selectedCharacter.references.map(reference => <article className="reference-card" key={reference.id}>
              {reference.asset && <img src={`${API_URL}/api/projects/${id}/assets/${reference.asset.id}/file`} alt={`${selectedCharacter.name} visual reference ${reference.version}`} />}
              <div><strong>Reference v{reference.version}</strong><span>{reference.label === "MASTER_REFERENCE" ? "MASTER REFERENCE" : "VISUAL REFERENCE"}</span></div>
              {reference.label !== "MASTER_REFERENCE" && <button type="button" className="subtle-button" onClick={() => void makeMasterReference(reference.id)}>Set as master</button>}
            </article>)}
          </div>}
        </section>}


        {selectedCharacter && <section className="workspace-panel identity-editor consistency-builder">
          <div className="workspace-panel-heading"><div><p className="eyebrow">SCENE PREPARATION</p><h2>Character Consistency Kit</h2></div><span className="workspace-count">PROMPT BUILDER</span></div>
          <p className="workspace-help">Describe the new shot. Congo AI Studio combines these scene details with the saved character identity and reference-image links to prepare a reusable prompt.</p>
          <form className="consistency-form" onSubmit={buildConsistencyPrompt}>
            <label>Scene description<input value={sceneInputs.scene} onChange={e => setSceneInputs(v => ({ ...v, scene: e.target.value }))} placeholder="Amara walks through a busy Lubumbashi street at sunset" /></label>
            <label>Outfit for this scene<input value={sceneInputs.outfit} onChange={e => setSceneInputs(v => ({ ...v, outfit: e.target.value }))} placeholder="Blue denim jacket, black trousers…" /></label>
            <label>Action / expression<input value={sceneInputs.action} onChange={e => setSceneInputs(v => ({ ...v, action: e.target.value }))} placeholder="Walking confidently, slight smile…" /></label>
            <label>Environment<input value={sceneInputs.environment} onChange={e => setSceneInputs(v => ({ ...v, environment: e.target.value }))} placeholder="Downtown Lubumbashi, late afternoon…" /></label>
            <label>Camera / composition<input value={sceneInputs.camera} onChange={e => setSceneInputs(v => ({ ...v, camera: e.target.value }))} placeholder="Medium shot, eye-level, 35mm lens…" /></label>
            <label>Visual style<input value={sceneInputs.style} onChange={e => setSceneInputs(v => ({ ...v, style: e.target.value }))} placeholder="Cinematic photorealism…" /></label>
            <button className="primary-button" disabled={buildingPrompt}>{buildingPrompt ? "Preparing consistency kit…" : "＋ Prepare scene prompt"}</button>
          </form>
          {consistencyPrompt && <div className="consistency-result">
            <div className="workspace-panel-heading"><strong>Generated consistency prompt</strong><button type="button" className="subtle-button" onClick={() => void copyConsistencyPrompt()}>{copiedPrompt ? "Copied ✓" : "Copy prompt"}</button></div>
            <textarea readOnly rows={15} value={consistencyPrompt} />
            <p className="workspace-help">Reference image links are included below. Attach the master image manually in your image-generation tool for now.</p>
            <div className="consistency-reference-links">{consistencyReferences.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">Open reference {index + 1} ↗</a>)}</div>
            <small className="consistency-note">Preparation only: this version does not automatically send images to ChatGPT or another image model.</small>
          </div>}
        </section>}

        {selectedCharacter && <section className="workspace-panel identity-editor">
          <div className="workspace-panel-heading"><div><p className="eyebrow">CANONICAL CHARACTER PROFILE</p><h2>{selectedCharacter.name} · Identity</h2></div><span className="workspace-count">PERSISTENT PROFILE</span></div>
          <p className="workspace-help">Record stable traits separately from scene-specific changes. Keep face, eyes, hair and body proportions consistent across shots.</p>
          <form className="identity-form" onSubmit={saveProfile}>
            {profileFields.map(field => <div className="identity-field" key={field.key}>
              <label htmlFor={`identity-${field.key}`}>{field.label}</label>
              {field.multiline ? <textarea id={`identity-${field.key}`} rows={3} value={profile[field.key] || ""} onChange={e => setProfile(current => ({ ...current, [field.key]: e.target.value }))} placeholder={field.placeholder} /> :
                <input id={`identity-${field.key}`} value={profile[field.key] || ""} onChange={e => setProfile(current => ({ ...current, [field.key]: e.target.value }))} placeholder={field.placeholder} />}
            </div>)}
            <div className="identity-actions"><button className="primary-button" disabled={savingProfile}>{savingProfile ? "Saving profile…" : "Save canonical identity"}</button>{profileMessage && <span className="success-message" role="status">{profileMessage}</span>}</div>
          </form>
        </section>}
        {error && <p className="error-message" role="alert">{error}</p>}

        <section className="workspace-roadmap">
          <p className="eyebrow">PRODUCTION STRUCTURE</p><h2>Story development</h2>
          <div className="roadmap-items"><div><span>01</span><strong>Seasons & episodes</strong><small>Coming next</small></div><div><span>02</span><strong>Scenes & shots</strong><small>Coming next</small></div><div><span>03</span><strong>Visual references</strong><small>Coming next</small></div></div>
        </section>
      </section>
    </main>
  );
}
