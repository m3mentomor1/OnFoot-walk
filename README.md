<div align="center">
  <h1>OnFoot.walk</h1>
</div>

### 🧐 I. Overview

An **agentic walkability mapping app** that combines interactive maps, OpenStreetMap data, and an AI agent to help users explore and understand the walkability of an area.

Users can search for locations, drop pins, analyze walkability, and interact with the AI agent to ask questions about their surroundings, including nearby parks, groceries, transit stops, schools, pedestrian infrastructure, and other factors that contribute to a walkable, car-free lifestyle.

The AI agent can also interact with the map through natural language, allowing users to perform map-related tasks such as searching for locations, changing the map view, and exploring geographic information conversationally.

The goal is to make walkability analysis more **interactive, conversational, and accessible** by allowing users to explore geographic information through both the map and an AI-powered interface.

<br><br>
##

### ⛓️ II. Features

- 🗺️ **Interactive Map** — Explore locations through an interactive Leaflet map.
- 📍 **Location Search** — Search for places using Nominatim and quickly navigate to them.
- 📌 **Drop Pin** — Manually select any location on the map for exploration.
- 🤖 **AI Agent** — Ask questions about locations, walkability, routes, nearby amenities, and geographic information through a conversational interface.
- 🧭 **Agentic Map Control** — Use natural language to perform map-related actions such as searching for locations and changing the map view.
- 🚶 **Walkability Analysis** — Evaluate an area's walkability using nearby amenities and pedestrian infrastructure sourced from OpenStreetMap.
- 🏪 **Nearby Amenities** — Analyze nearby groceries, transit stops, food establishments, healthcare facilities, parks, schools, and pedestrian infrastructure.
- 📊 **Walkability Scoring** — Calculate a 0–100 walkability score using proximity, amenity density, category diversity, and pedestrian infrastructure.
- 💬 **Conversational Map Exploration** — Use natural language to interact with and explore geographic information.
- 🔑 **Bring Your Own API Key** — Connect supported LLM providers using your own model API credits.
- 🧠 **OpenRouter Models** — Use supported Gemma models through OpenRouter for AI agent interactions.

### 💻 III. Tech Stack

- **Front-end:** `TypeScript` `Next.js` `Tailwind CSS` `shadcn/ui`
- **Mapping:** `Leaflet` `React Leaflet`
- **AI Agent:** `LangGraph` `LangChain`
- **AI Provider:** `OpenRouter`
- **LLMs:** `Google Gemma 4 26B A4B` `Google Gemma 4 31B`
- **Geospatial Data:** `OpenStreetMap` `Overpass API`
- **Geocoding:** `Nominatim`
- **Icons:** `Lucide`

### 🧩 IV. AI Agent

The AI agent uses a tool-based architecture to connect natural-language requests with map operations and geospatial analysis.

The agent can work with the currently displayed map context and execute supported map actions, including:

- Searching for locations
- Moving the map to a location
- Changing the map zoom
- Exploring the current map context
- Requesting walkability-related information
- Working with nearby geographic features and amenities

The agent is implemented using **LangGraph** and **LangChain**, with model requests routed through **OpenRouter**.

Currently supported OpenRouter models:

- `google/gemma-4-26b-a4b-it:free`
- `google/gemma-4-31b-it:free`

### 🌍 V. Geospatial & Walkability Analysis

Walkability analysis uses data retrieved from **OpenStreetMap** through the **Overpass API**.

The application considers several categories:

- 🛒 Grocery
- 🚌 Transit
- 🍴 Food
- 🏥 Healthcare
- 🌳 Parks
- 🏫 Schools
- 🚶 Pedestrian infrastructure

The walkability score is calculated on a **0–100 scale** using:

- Distance to nearby places
- Amenity density
- Availability across different amenity categories
- Pedestrian infrastructure

The analysis currently uses a **1 km search radius** around the selected location.

The resulting score is categorized as:

- **80–100:** Excellent
- **65–79:** Good
- **50–64:** Moderate
- **35–49:** Fair
- **0–34:** Poor

<br><br>
##

## Getting started

### 1. Install dependencies

```bash
npm install