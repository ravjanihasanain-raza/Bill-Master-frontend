# Bill Master ERP Billing System

## Overview

Bill Master is a full-stack ERP billing and invoice management solution developed for **Abson Energy Pvt. Ltd.** The system streamlines invoice generation, customer management, billing workflows, and business operations through a secure and scalable architecture built with **ASP.NET Core Web API**, **React.js**, and **SQL Server**.

The application follows modern software development practices including JWT Authentication, RESTful API architecture, Repository Pattern, and responsive frontend design.

---



### Dashboard
<img width="1718" height="853" alt="image" src="https://github.com/user-attachments/assets/d4fcec1b-1c89-4127-8a5b-ec6b0e063642" />

### Invoice create
<img width="1024" height="796" alt="Screenshot 2026-06-07 160809" src="https://github.com/user-attachments/assets/2a05f791-0f01-46f3-a1e2-f76a64c36e8c" />
<img width="1045" height="771" alt="image" src="https://github.com/user-attachments/assets/46be711b-2aaf-48a7-b23e-a7c690422408" />


### Invoice Management
<img width="1672" height="789" alt="image" src="https://github.com/user-attachments/assets/0f6e2434-c135-411d-a17e-97c56d404ee1" />
<img width="1742" height="877" alt="image" src="https://github.com/user-attachments/assets/c37befd7-b8f3-4b82-92f5-2aa7bd679e5a" />
<img width="1643" height="752" alt="image" src="https://github.com/user-attachments/assets/9eb00066-8445-4dbb-938f-c5fd58e14e6f" />


### Stock Inward
<img width="1583" height="723" alt="image" src="https://github.com/user-attachments/assets/c91116c2-eab5-464f-b4ec-237b977abc82" />
<img width="1613" height="778" alt="image" src="https://github.com/user-attachments/assets/2632bd63-5241-40ea-8d44-d2a8eb8538ff" />


### Stock Consumption
<img width="1576" height="758" alt="image" src="https://github.com/user-attachments/assets/a19a0663-c5f8-4258-bf14-691cb1f4064b" />
<img width="1609" height="781" alt="image" src="https://github.com/user-attachments/assets/ca3fb686-74db-4e61-8391-7800da413d70" />



## Key Features

### Authentication & Security

* JWT-based Authentication
* Protected API Endpoints
* Role-Based Access Control
* Secure User Login System

### Invoice Management

* Create, Update, View and Delete Invoices
* Invoice Status Tracking
* Customer-wise Invoice History
* Invoice Validation & Processing

### Customer Management

* Customer Registration
* Customer Information Management
* Search & Filter Functionality
* Customer Billing Records

### System Features

* Full CRUD Operations
* RESTful API Architecture
* Responsive User Interface
* SQL Server Data Management
* Real-Time Data Integration

---

## Technology Stack

### Frontend

* React.js
* Vite
* JavaScript (ES6+)
* HTML5
* CSS3

### Backend

* ASP.NET Core Web API
* Entity Framework Core
* JWT Authentication
* Repository Pattern
* Dependency Injection

### Database

* SQL Server

### Development Tools

* Visual Studio
* Postman
* Git & GitHub

---

## System Architecture

Frontend (React.js)
↓
REST API (ASP.NET Core)
↓
Entity Framework Core
↓
SQL Server Database

---

## Business Benefits

* Reduces manual billing operations
* Improves invoice management efficiency
* Centralizes customer information
* Provides secure role-based access
* Enhances operational workflow management

---

## Project Status

🚀 Production deployment and hosting are currently in progress.

---

## Installation

### Frontend Setup

```bash
npm install
npm run dev
```

### Backend Setup

```bash
dotnet restore
dotnet ef database update
dotnet run
```

Update the SQL Server connection string in:

```json
appsettings.json
```

before running the application.

---

## Planned Enhancements

* PDF Invoice Generation
* Email Notifications
* Analytics Dashboard
* Advanced Reporting System
* Multi-Role Permission Management
* Export to Excel & PDF

---

## Developer

**Hasanain Raza**

Full Stack Developer

### Skills

* ASP.NET Core
* React.js
* Node.js
* SQL Server
* MongoDB
* REST APIs

GitHub:
https://github.com/ravjanihasanain-raza

LinkedIn:
https://linkedin.com/in/ravjani-hasanain-raza
