"use client";
import { useState } from "react";
import Link from "next/link";
export default function LibraryHeader() {
  const [open, setOpen] = useState(false);
  return <header className="editorial-header"><div className="editorial-shell header-inner"><Link className="editorial-brand" href="#inicio" aria-label="Honestamente, Itamar — início" onClick={() => setOpen(false)}><span>Honestamente,</span><strong>Itamar<span className="brand-period">.</span></strong></Link><button className="menu-toggle" type="button" aria-expanded={open} aria-controls="library-navigation" onClick={() => setOpen(!open)}>{open ? "Fechar" : "Menu"}<span aria-hidden="true">{open ? "×" : "☰"}</span></button><nav id="library-navigation" className={`editorial-nav${open ? " is-open" : ""}`} aria-label="Navegação principal" onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus(); } }}><a href="#inicio" onClick={() => setOpen(false)}>Início</a><a href="#biblioteca" onClick={() => setOpen(false)}>Biblioteca</a><a href="#como-funciona" onClick={() => setOpen(false)}>Como funciona</a><Link prefetch={false} className="reader-link" href="/acessar" onClick={() => setOpen(false)}>Acesso do leitor <span aria-hidden="true">↗</span></Link></nav></div></header>;
}
