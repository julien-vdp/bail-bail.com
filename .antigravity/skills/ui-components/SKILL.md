---
name: Bail-Bail UI Guidelines
description: Normes de conception visuelle, de style et d'usage de composants pour la plateforme.
---

# 🎨 Standards UI - Bail-Bail

L'interface doit inspirer confiance, premium, et modernité (Glassmorphism, ombres subtiles, animations douces). Voici les règles de base pour créer un composant UI.

## 1. Charte Graphique & Tailwind
- **Couleur principale :** Utiliser les classes `text-primary`, `bg-primary`.
- **Fonds (Backgrounds) :** Préférer `bg-slate-50` ou `bg-slate-100` pour les fonds d'application, et du blanc `bg-white` pour les cartes/conteneurs. Le mode sombre utilise `bg-slate-900`.
- **Bordures :** Utiliser des bordures subtiles (`border border-slate-200`) couplées à des ombres (`shadow-sm`, `shadow-md`) et des coins très arrondis (`rounded-xl`, `rounded-2xl`).

## 2. Icônes
N'utiliser **que** la librairie `lucide-react`. 
Vérifie la consistance des tailles (`w-4 h-4` pour les boutons, `w-6 h-6` pour les indicateurs majeurs).

## 3. Boutons & Interactivité
Chaque élément interactif doit avoir :
- Une transition douce : `transition-colors`, `transition-all`.
- Un état de survol (hover) explicite : `hover:bg-primary/90`, `hover:border-primary`.
- Si c'est un état de chargement, utiliser le composant `Loader2` de Lucide avec la classe `animate-spin`.

## 4. Composants Serveur vs Client
- Next.js 15 App Router est utilisé. Les composants sont "Serveur" par défaut.
- Ajoute la directive `"use client";` **uniquement** si le composant utilise des *hooks* (`useState`, `useEffect`) ou des événements interactifs (`onClick`, `onChange`). 
- Privilégier les Server Actions (`src/actions/`) plutôt que des routes d'API pour la soumission de formulaires.
