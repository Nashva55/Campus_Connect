# CampusConnect Backend

This backend is a beginner-friendly role-based auth system for CampusConnect.

## What it includes
- Admin and student roles
- Login with JWT authentication
- Protected admin route to create student accounts
- Password hashing with bcrypt
- Simple admin panel frontend

## Folder guide
- `config/`: database connection
- `middleware/`: token and role checks
- `models/`: MongoDB schema
- `routes/`: login and admin APIs
- `scripts/`: one-time helper to create admin accounts
- `utils/`: shared JWT helper

## Important environment variables
Create a `.env` file in this folder:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/campusconnect
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://127.0.0.1:5500
```

## Run the backend
```bash
cd backend
npm.cmd run dev
```

## Create an admin
Default admin:
```bash
cd backend
npm.cmd run create-admin
```

Custom admin:
```bash
cd backend
npm.cmd run create-admin -- --name "John Admin" --email "john@campusconnect.com" --password "Admin123"
```

## Main routes
- `POST /api/login`
- `POST /api/admin/create-user`

## Learning order
1. Start MongoDB.
2. Run `npm.cmd run dev`.
3. Run `npm.cmd run create-admin`.
4. Log in with the admin account.
5. Open `pages/admin.html`.
6. Create student accounts from the admin panel.
