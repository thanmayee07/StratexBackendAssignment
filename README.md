# StratexBackendAssignment

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <[repository_url](https://github.com/thanmayee07/StratexBackendAssignment.git)>
   cd stratex-backend

2. Install Dependencies:
   ```bash
   npm install
   
3. Set up the database and environment variables:
   - Create a PostgreSQL/MySQL database.
   - Update the variables in .env.

4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev

5. Start the server:
   ```bash
   npm start

6. API Endpoints:
   - User and Seller Registration: POST /signup
   - Login: POST /login
   - Get All Books: GET /books
   - Get Book by ID: GET /books/:id
   - Create Book (Seller): POST /books
   - Update Book (Seller): PUT /books/:id
   - Delete Book (Seller): DELETE /books/:id
   - Upload Books CSV (Seller): POST /upload
