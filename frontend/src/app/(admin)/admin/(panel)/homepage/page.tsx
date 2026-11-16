"use client";
import { useEffect, useState } from "react";
import defaults from "@/config/homepage.json";
import { facilityContent, experienceContent } from "@/config/content";
import { api, errorMessage } from "@/lib/adminApi";
type Content = Record<string, Record<string, string>>;
const sections = ["Hero", "AboutPreview", "FeaturedRooms", "Facilities", "RestaurantPreview", "ShimshalExperience", "GalleryPreview", "Testimonials", "LocationSection", "CallToAction"];
const names: Record<string,string> = { Hero: "Hero banner", AboutPreview: "About the hotel", FeaturedRooms: "Featured rooms", Facilities: "Facilities", RestaurantPreview: "Restaurant", ShimshalExperience: "Shimshal experience", GalleryPreview: "Gallery", Testimonials: "Guest reviews", LocationSection: "Location", CallToAction: "Booking banner" };
const imageFields: Record<string,string[]> = { Hero: ["backgroundImage"], AboutPreview: ["mainImage", "secondaryImage"], RestaurantPreview: ["mainImage"], ShimshalExperience: experienceContent.map(item => item.id + "Image"), LocationSection: ["mapImage"], CallToAction: ["backgroundImage"] };
const initial: Content = JSON.parse(JSON.stringify(defaults));
for (const item of facilityContent) Object.assign(initial.Facilities, { [item.id + "Title"]: item.title, [item.id + "Description"]: item.description });
for (const item of experienceContent) Object.assign(initial.ShimshalExperience, { [item.id + "Title"]: item.title, [item.id + "Description"]: item.description });
const humanize = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
export default function HomepageEditor() {
 const [content, setContent] = useState<Content | null>(null);
 const [files, setFiles] = useState<Record<string, Record<string, File>>>({});
 const [active, setActive] = useState("Hero");
 const [message, setMessage] = useState("");
 const [saving, setSaving] = useState(false);
 async function load() {
  try {
   const { data } = await api<{ homepage?: Content }>("GET", "/settings");
   const merged: Content = {};
   for (const section of sections) merged[section] = { ...initial[section], ...data.homepage?.[section] };
   setContent(merged); setMessage("");
  } catch (error) { setMessage(errorMessage(error)); }
 }
 useEffect(() => {
  let mounted = true;
  api<{ homepage?: Content }>("GET", "/settings").then(({ data }) => {
   if (!mounted) return;
   const merged: Content = {};
   for (const section of sections) merged[section] = { ...initial[section], ...data.homepage?.[section] };
   setContent(merged);
  }).catch(error => { if (mounted) setMessage(errorMessage(error)); });
  return () => { mounted = false; };
 }, []);
 const update = (key: string, value: string) => setContent(current => current && ({ ...current, [active]: { ...current[active], [key]: value } }));
 async function save() {
  if (!content) return;
  setSaving(true); setMessage("");
  const section = active;
  try {
   const form = new FormData();
   form.append("content", JSON.stringify(content[section]));
   const uploads = Object.entries(files[section] ?? {});
   form.append("imageKeys", JSON.stringify(uploads.map(([key]) => key)));
   for (const [, file] of uploads) form.append("images", file);
   const { data } = await api<{ homepage: Content }>("PUT", `/settings/homepage/${section}`, { form });
   setContent(current => ({ ...current, [section]: { ...initial[section], ...data.homepage[section] } }));
   setFiles(current => ({ ...current, [section]: {} }));
   setMessage(`${names[section]} saved. Refresh the website to see your changes.`);
  } catch (error) { setMessage(errorMessage(error)); }
  finally { setSaving(false); }
 }
 return <div className="space-y-6">
  <h1 className="text-3xl">Homepage sections</h1>
  <p>Choose a section, update its content and save. Each section is saved separately.</p>
  <div role="status">{message}</div>
  {!content ? <button onClick={load}>Load homepage content</button> : <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr]">
   <nav aria-label="Homepage sections" className="flex flex-wrap gap-2 lg:flex-col">{sections.map(section => <button key={section} disabled={saving} type="button" aria-current={active === section ? "page" : undefined} onClick={() => { setActive(section); setMessage(""); }} className={`rounded-lg border px-4 py-3 text-left ${active === section ? "bg-forest text-white" : "bg-white"}`}>{names[section]}</button>)}</nav>
   <form onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-6 rounded-xl border bg-white p-6">
    <h2 className="text-2xl">{names[active]}</h2>
    {["FeaturedRooms", "RestaurantPreview", "GalleryPreview", "Testimonials"].includes(active) && <p className="text-sm text-slate-soft">Manage the listed rooms, meals, gallery photos or reviews in their dedicated admin pages. Edit this section&apos;s introduction here.</p>}
    {Object.entries(initial[active]).map(([key, fallback]) => <label key={active + key} className="block text-sm font-medium">{key.startsWith("text") ? fallback : humanize(key)}<textarea maxLength={5000} className="mt-2 block min-h-24 w-full rounded-lg border p-3 font-normal" value={content[active][key] ?? fallback} onChange={event => update(key, event.target.value)} /></label>)}
    {(imageFields[active] ?? []).map(key => <fieldset key={active + key} className="space-y-3 rounded-lg border p-4"><legend className="px-2 font-medium">{humanize(key)}</legend>
     {content[active][key] && <a href={content[active][key]} target="_blank" rel="noreferrer" className="block text-sm underline">View current image</a>}
     <label className="block text-sm">Image URL<input type="url" className="mt-1 block w-full rounded border p-3" placeholder="https://... (leave empty to use the default image)" value={content[active][key] ?? ""} onChange={event => update(key, event.target.value)} /></label>
     <label className="block text-sm">Upload a replacement (JPEG, PNG, WebP or AVIF, up to 5 MB)<input key={active + key + (files[active]?.[key]?.name ?? "empty")} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="mt-2 block w-full" onChange={event => { const file = event.target.files?.[0]; if (file && file.size > 5 * 1024 * 1024) { setMessage("Choose an image smaller than 5 MB."); event.target.value = ""; return; } setFiles(current => { const next = { ...current[active] }; if (file) next[key] = file; else delete next[key]; return { ...current, [active]: next }; }); }} /></label>
     {files[active]?.[key] && <p className="text-sm">Selected: {files[active][key].name}</p>}
     <label className="block text-sm">Image description<input className="mt-1 block w-full rounded border p-3" maxLength={500} value={content[active][key + "Alt"] ?? ""} onChange={event => update(key + "Alt", event.target.value)} /></label>
    </fieldset>)}
    <button disabled={saving} className="rounded-lg bg-forest px-6 py-3 text-white">{saving ? "Saving..." : `Save ${names[active]}`}</button>
   </form>
  </div>}
 </div>;
}
