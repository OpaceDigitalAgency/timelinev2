# Evolution of Religion Timeline

## Overview

This project is an interactive timeline web application that visualizes the evolution and spread of world religions from prehistory to the present. Users can explore, filter, and learn about 59 religions, their origins, key figures, beliefs, and historical context.

## Tech Stack

- **Astro**: Static site generation and routing.
- **React**: Interactive UI components.
- **TypeScript**: Type safety across the codebase.
- **TailwindCSS**: Utility-first CSS framework for styling.
- **Vite**: Fast development server and build tool.
- **Supabase**: Backend-as-a-service for database and authentication (primary data source).
- **Sanity**: Headless CMS for content management (optional, for extended content).

## Data Flow & Architecture

- All religion and era data is stored in Supabase.
- The frontend fetches data from Supabase using the API (see `src/lib/services/religionService.ts`).
- Timeline and detail views are rendered using React components within Astro pages.
- No mock data is used; all data is live from Supabase.
- The timeline visualizes religions by founding year, era, and other attributes.
- Special handling is required for prehistoric religions and extremely ancient dates.

## Project Structure

- `src/`
  - `components/`: React and Astro UI components (timeline, filters, cards, etc.)
  - `lib/`: Supabase and Sanity integration, data services.
  - `pages/`: Astro pages for routes (`/`, `/timeline`, `/religions/[id]`, etc.)
  - `styles/`: Global and utility CSS.
  - `types/`: TypeScript type definitions.
- `supabase/`
  - `migrations/`: SQL migration scripts for database schema and data import.
- `public/`: Static assets (favicon, images).
- `astro.config.mjs`, `vite.config.ts`, `tailwind.config.js`: Project configuration.

## Development

### Prerequisites

- Node.js (v18+ recommended)
- Supabase project (with correct schema and data)
- (Optional) Sanity project for extended content

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/OpaceDigitalAgency/timelinev2.git
   cd timelinev2
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in Supabase credentials.

4. Run the development server:
   ```
   npm run dev
   ```

### Deployment

- The site is deployed via Netlify at [timelinev2.netlify.app](https://timelinev2.netlify.app).
- Connect the GitHub repository to Netlify and use the following settings:
  - **Build command:** `astro build`
  - **Publish directory:** `dist`

## Special Considerations

- The timeline must handle extremely ancient dates (up to -8000 BCE) and NULL end dates.
- Era assignments for prehistoric religions may require custom logic.
- All data issues should be resolved in Supabase; the frontend should not rely on mock data.

## Contributing

1. Fork the repository and create a new branch for your feature or fix.
2. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the MIT License.