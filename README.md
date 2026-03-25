# MBC Digitization Project

This project aims to digitize the MBC entity by providing a comprehensive web application built with Next.js. The application includes various sections for public users, internal management, and client access.

## Project Structure

```
mbc-digitization
├── src
│   ├── app
│   │   ├── (public)
│   │   │   ├── contact
│   │   │   │   └── page.tsx
│   │   │   ├── training
│   │   │   │   ├── [courseId]
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── checkout
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── (internal)
│   │   │   ├── dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── files
│   │   │   │   └── page.tsx
│   │   │   ├── personnel
│   │   │   │   └── page.tsx
│   │   │   └── projects
│   │   │       └── page.tsx
│   │   ├── (client-access)
│   │   │   ├── track-work
│   │   │   │   ├── [projectId]
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   └── [...nextauth]
│   │   │   │       └── route.ts
│   │   │   ├── payments
│   │   │   │   └── route.ts
│   │   │   └── projects
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components
│   │   ├── ui
│   │   │   ├── Button.tsx
│   │   │   └── Card.tsx
│   │   ├── training
│   │   │   └── CourseCard.tsx
│   │   ├── internal
│   │   │   └── FileBrowser.tsx
│   │   └── client
│   │       └── ProgressTracker.tsx
│   ├── lib
│   │   ├── db.ts
│   │   └── utils.ts
│   └── types
│       └── index.ts
├── public
│   └── logo.svg
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Features

- **Landing Page**: A welcoming page for users to learn about MBC and its offerings.
- **Contact Section**: A form for users to submit inquiries.
- **Training Section**: Information on available training courses, both online and in-person, with a checkout process for payments.
- **Internal Management**: Sections for managing files, personnel, and ongoing projects.
- **Client Access**: A secure area for clients to track the progress of their projects without needing to register.

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd mbc-digitization
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.# madibabc
