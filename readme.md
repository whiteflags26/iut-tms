# IUT Turf Management System (TMS)

## Server Configuration

### Environment Variables
Create a `.env` file and add the following configuration:

```
PORT=3000
NODE_ENV=development

# Database Configuration (Supabase)
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

## Getting Started

Follow these steps to set up and run the project locally:

```sh
git clone https://github.com/whiteflags26/iut-tms.git

# Navigate to the project directory
cd iut-tms

# Add the .env file with necessary configurations

# Switch to the development branch
git checkout dev

# Install dependencies
npm install

# Run database migrations
npm run prisma:migrate

# Start the development server
npm run dev
```

## Notes
- Ensure you have **Node.js** and **npm** installed before proceeding.
- Make sure your database connection is properly configured in the `.env` file.
- The server runs on **PORT 3000** by default.

