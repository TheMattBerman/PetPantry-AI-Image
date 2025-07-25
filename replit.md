# Pet Pantry AI Tool - Replit Documentation

## Overview

The Pet Pantry AI Tool is a React-based web application that transforms pet photos into themed, shareable content. The application serves as a lead generation mechanism while building brand affinity through AI-powered pet content generation. Users can upload pet photos and transform them into baseball cards or superhero-themed images.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom Pet Pantry brand colors
- **State Management**: React hooks for local state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **File Uploads**: Multer middleware for handling pet photo uploads
- **Validation**: Zod schemas for request/response validation
- **Storage**: In-memory storage implementation (designed for easy database integration)

## Key Components

### Client-Side Components
1. **Multi-Step Flow**: Hero → Upload → Theme Selection → Customization → Processing → Results
2. **Upload System**: Drag-and-drop file upload with validation and preview
3. **Theme Selection**: Visual cards for baseball vs superhero themes  
4. **Customization Form**: Pet details, traits selection, and custom messaging
5. **Processing Animation**: Progress indicator with themed messaging
6. **Results Display**: Generated image with social sharing and email capture
7. **UI Components**: Complete shadcn/ui component library integration

### Server-Side Components
1. **File Upload Handler**: Multer configuration for image processing
2. **Storage Interface**: Abstracted storage layer for users and transformations
3. **API Routes**: RESTful endpoints for upload, stats, and email capture
4. **Error Handling**: Centralized error handling middleware

### Shared Components
1. **Database Schema**: Drizzle ORM schemas for users and pet transformations
2. **Type Definitions**: Shared TypeScript interfaces and types
3. **Validation Schemas**: Zod schemas for data validation

## Data Flow

1. **User Journey**: Users progress through a linear multi-step process
2. **File Upload**: Images are validated client-side, then sent to server via FormData
3. **Theme Selection**: Visual theme choice affects processing and output styling
4. **Customization**: Pet details and traits are collected for personalization
5. **AI Processing**: Mock processing simulation (placeholder for actual AI integration)
6. **Email Capture**: Results are gated behind email collection for lead generation
7. **Social Sharing**: Generated content includes sharing mechanisms

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Hook Form)
- Vite build system with TypeScript support
- Express.js server framework

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling  
- Lucide React for consistent iconography
- Class Variance Authority for component variants

### Data and Validation
- Drizzle ORM for database operations
- Zod for runtime type validation
- TanStack Query for server state management

### File Handling
- Multer for multipart file uploads
- Built-in Node.js crypto for UUID generation

## Deployment Strategy

### Development Setup
- **Dev Server**: Vite development server with HMR
- **API Server**: Express server with TypeScript compilation via tsx
- **Database**: PostgreSQL with Drizzle Kit for migrations
- **Environment**: Neon Database serverless PostgreSQL

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle Kit pushes schema changes to production database
- **Deployment**: Single Node.js process serving both API and static files

### Configuration Requirements
- `DATABASE_URL` environment variable for PostgreSQL connection
- Neon Database serverless driver for connection pooling
- PostgreSQL-specific Drizzle configuration

### Key Architectural Decisions

1. **Database Strategy**: Drizzle ORM with PostgreSQL provides type-safe database operations while maintaining flexibility for schema evolution

2. **File Upload Approach**: Multer with memory storage allows for easy integration with cloud storage services later

3. **Storage Abstraction**: Interface-based storage layer enables easy transition from in-memory to database persistence

4. **Email-Gated Content**: Results require email capture for lead generation, balancing user experience with business objectives

5. **Theme-Based Processing**: Separate processing flows for different themes allow for specialized AI model integration

6. **Component Architecture**: Radix UI + shadcn/ui provides accessible, customizable components with consistent design system

## Recent Changes

### Centralized Color Management System (July 25, 2025)
- Implemented centralized color management using CSS custom properties and Tailwind configuration
- Updated primary brand color to deep purple (#55005c / hsl(297, 100%, 18%))
- Updated accent color to golden yellow (#d5a800 / hsl(47, 100%, 42%))
- Created comprehensive color system with light/dark variants and semantic colors
- Added Tailwind utility classes for brand colors (bg-brand-primary, text-brand-accent, etc.)
- Created reusable component classes (.brand-button, .brand-card-selected)
- Replaced hardcoded colors with centralized variables across all components
- Added documentation in `client/src/styles/README.md` for color system usage
- Benefits: Easy theme changes, consistency, maintainability, and no more scattered color values