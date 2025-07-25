# Ship With Tosin - International Shipping Platform

A professional international shipping platform that provides competitive rates and reliable delivery services.

## Features

- International shipping cost calculation
- User dashboard and order management
- Admin panel for pricing and order management
- Blog system with comments
- API endpoint for external integrations
- Excel upload for bulk pricing updates

## Technology Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- Supabase for backend services
- Vite for build tooling
- React Router for navigation

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd ship-with-tosin
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Configure your Supabase project settings
   - Update the Supabase URL and API keys in the configuration

4. Start the development server:
```bash
npm run dev
```

## API Documentation

The platform provides RESTful API endpoints for shipping calculations:

- `GET /api/pricing-api` - Calculate shipping costs
- Authentication required via API key

## Deployment

The application is configured for deployment on Vercel with automatic builds and custom domain support.

## Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profile information
- `orders` - Shipping orders
- `pricing` - Shipping rates by route and package type
- `blog_posts` - Blog content
- `blog_comments` - User comments on blog posts

## Contributing

This is a private commercial project. Contact the development team for contribution guidelines.

## License

Private - All rights reserved
