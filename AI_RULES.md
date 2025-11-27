# AI Rules for GestãoOS - Hotelaria

This document outlines the core technologies and library usage guidelines for the GestãoOS application. Adhering to these rules ensures consistency, maintainability, and efficient development.

## Tech Stack Overview

The GestãoOS application is built using a modern web development stack, focusing on performance and developer experience:

*   **React**: A declarative, component-based JavaScript library for building user interfaces.
*   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and developer tooling.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs directly in your markup.
*   **React Router DOM**: A collection of navigational components that compose declaratively with your application.
*   **Supabase**: An open-source Firebase alternative providing a PostgreSQL database, authentication, instant APIs, and real-time subscriptions.
*   **jsPDF & jspdf-autotable**: Libraries used for client-side PDF generation, specifically for service reports.
*   **Lucide React**: A collection of beautiful and customizable open-source icons for React applications.
*   **Google GenAI**: Integrated for AI-powered features, such as generating service report summaries.
*   **Vite**: A fast build tool that provides an extremely quick development experience.

## Library Usage Rules

To maintain a consistent and efficient codebase, please follow these guidelines for library usage:

*   **UI Components & Styling**:
    *   Always use **Tailwind CSS** for all styling. Prioritize utility classes.
    *   Utilize **shadcn/ui** components where applicable for pre-built, accessible, and customizable UI elements.
*   **Routing**:
    *   Use **React Router DOM** for all client-side navigation and routing within the application.
*   **Backend & Data Management**:
    *   All interactions with the database, authentication, and storage should be done via **Supabase**.
*   **Icons**:
    *   Integrate icons using the **Lucide React** library.
*   **PDF Generation**:
    *   For generating PDF documents, use **jsPDF** in conjunction with **jspdf-autotable**.
*   **AI Integration**:
    *   Any AI-powered features should leverage the **Google GenAI** library.
*   **State Management**:
    *   For component-level and global state management, rely on **React's built-in hooks** (`useState`, `useEffect`, `useContext`). Avoid introducing external state management libraries unless explicitly approved for complex global state needs.