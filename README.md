# MonthlyBudgetApplication

A web application for managing shared household budgets. Users can create accounts, create or join shared "Houses", and manage household members with different roles.

## Features

- **User Authentication**: Register and login with secure JWT authentication
- **House Management**: Create shared spaces called "Houses"
- **Unique House Keys**: Each house gets a unique 6-digit alphanumeric key for invitations
- **Join Houses**: Users can join existing houses using the house key
- **Role Management**: House owners and admins can assign roles to members
- **Roles**: Owner, Admin, Financier, Rent Payer, Member
- **House Renaming**: Members can rename their houses
- **Member Management**: View all house members and their roles

## Tech Stack

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React, React Router
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: CSS3

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher) OR Docker

## Installation

### Option 1: Using Docker (Recommended)

This is the easiest way to run the application with all dependencies:

```bash
# Clone the repository
git clone https://github.com/aSrivastaava/MonthlyBudgetApplication.git
cd MonthlyBudgetApplication

# Start MongoDB using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Install dependencies
npm install
cd client && npm install && cd ..

# Create .env file
cp .env.example .env

# Start the backend
npm run dev

# In a new terminal, start the frontend
npm run client
```

### Option 2: Local MongoDB Installation

### 1. Clone the repository

```bash
git clone https://github.com/aSrivastaava/MonthlyBudgetApplication.git
cd MonthlyBudgetApplication
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 4. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```
MONGODB_URI=mongodb://localhost:27017/monthlybudget
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Ubuntu/Linux
sudo systemctl start mongod

# On macOS with Homebrew
brew services start mongodb-community

# Or run mongod directly
mongod --dbpath /path/to/your/data/directory
```

## Running the Application

### Development Mode

#### Start the backend server

```bash
npm run dev
```

The backend server will run on http://localhost:5000

#### Start the frontend (in a new terminal)

```bash
npm run client
```

The frontend will run on http://localhost:3000

### Production Mode

```bash
# Build the frontend
cd client
npm run build
cd ..

# Start the backend server
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Houses

- `POST /api/houses/create` - Create a new house
- `POST /api/houses/join` - Join a house using house key
- `GET /api/houses/my-houses` - Get user's houses
- `GET /api/houses/:houseId` - Get house details
- `PUT /api/houses/:houseId/rename` - Rename a house
- `PUT /api/houses/:houseId/assign-role` - Assign role to member (admin only)

## Usage

1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Create House**: Click "Create House" and provide a name
4. **Get House Key**: After creating, you'll receive a unique 6-digit alphanumeric key
5. **Share Key**: Share the house key with others to invite them
6. **Join House**: Use "Join House" and enter the 6-digit key
7. **Manage Roles**: As owner/admin, click on a house to manage member roles
8. **Rename House**: Click "Rename" to change your house name

## Roles & Permissions

- **Owner**: Full control, can assign any role, cannot be changed
- **Admin**: Can assign roles to members (except owner)
- **Financier**: Standard member with financial responsibility designation
- **Rent Payer**: Standard member with rent payment responsibility designation
- **Member**: Basic access to the house

## Project Structure

```
MonthlyBudgetApplication/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   └── House.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── house.js
│   ├── middleware/
│   │   └── auth.js
│   └── server.js
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Dashboard.js
│       │   └── HouseDetails.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── services/
│       │   └── houseService.js
│       ├── App.js
│       └── index.js
├── package.json
└── README.md
```

## License

ISC