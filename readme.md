Biochemistry Degree Guide — Interactive Web Application
Overview

The Biochemistry Degree Guide is a client-side, interactive educational web application designed to help students navigate and master core concepts across general chemistry, organic chemistry, and biochemistry. The application integrates structured curricular content with an interactive 3D molecular viewer to support visual and conceptual learning.

The project emphasizes interactivity, state persistence, and scientific visualization, without relying on a backend or external services.

Key Features

Interactive 3D Molecular Viewer

Built with Three.js

Real-time rotation, zoom, and molecule switching

Persistent Saved Molecular Views

User-defined molecular orientations and settings are stored using browser LocalStorage

Saved views persist across browser sessions

Modular, Multi-Section UI

Tab-based navigation across chemistry and biochemistry topics

Expandable topic cards for structured content exploration

Domain-Specific Visualizations

Custom SVG diagrams and curated scientific summaries

Designed to align with undergraduate biochemistry curricula

Technical Stack

Frontend: HTML5, CSS3, Vanilla JavaScript

3D Graphics: Three.js

State Persistence: Browser LocalStorage

Deployment: GitHub Pages (static hosting)

Architecture Notes

The application follows a single-page, event-driven architecture using vanilla JavaScript.

UI state (active tabs, expanded cards, viewer controls) is managed through DOM manipulation and CSS class toggling.

Molecular viewer state (e.g., camera position, zoom level, rotation settings) is serialized and stored in LocalStorage.

On page load, the Three.js scene and selected molecule are initialized before any saved viewer state is restored to ensure valid object references.

LocalStorage was chosen to provide lightweight persistence without backend complexity.

Live Demo

[GitHub Pages Deployment — insert link here]

Motivation

This project was created to combine scientific domain knowledge with interactive software development, demonstrating how visualization and thoughtful UI design can enhance learning in technically complex subjects.

Future Improvements (Optional)

Data-driven rendering of course content from JSON

Quiz and assessment engine with progress tracking

Validation and versioning for persisted LocalStorage state

Optional backend for user accounts and cloud-synced views

Author

Developed independently as a personal portfolio project.